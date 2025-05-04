import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { getSettings } from "@/lib/settingsStore";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { regenerateChatTitle } from "@/lib/titleGenerator";
import { modelSupportsImages, modelSupportsWeb } from "@/lib/modelConfig";
import { formatWikipediaResultsForAI, searchWikipediaWithKeywords } from "@/services/wikipediaService";

interface Message {
  id: string;
  chatId: string;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  userId: string;
  messages?: Message[];
}

interface UseMessageInputProps {
  chatId: string;
  selectedModel: string;
}

export function useMessageInput({ chatId, selectedModel }: UseMessageInputProps) {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleProcessedRef = useRef(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isImprovingText, setIsImprovingText] = useState(false);
  const [isSearchingWikipedia, setIsSearchingWikipedia] = useState(false);
  
  // Get settings and webSearchEnabled value
  const savedSettings = getSettings();
  const [webSearchEnabled, setWebSearchEnabled] = useState(savedSettings.webSearchEnabled || false);
  
  // Check if the current model supports images
  const currentModelSupportsImages = modelSupportsImages(selectedModel);
  // Check if the current model supports web search
  const currentModelSupportsWeb = modelSupportsWeb(selectedModel);
  
  // Reset webSearchEnabled if the selected model doesn't support web search
  useEffect(() => {
    if (!currentModelSupportsWeb && webSearchEnabled) {
      setWebSearchEnabled(false);
      const currentSettings = getSettings();
      const updatedSettings = {
        ...currentSettings,
        webSearchEnabled: false
      };
      localStorage.setItem('apiSettings', JSON.stringify(updatedSettings));
    }
  }, [selectedModel]);
  
  const { data: currentChat } = useQuery<Chat>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
  });

  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
  });

  // Reset the flag when the chat changes
  useEffect(() => {
    titleProcessedRef.current = false;
  }, [chatId]);

  // Effect to synchronize the textarea reference
  useEffect(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textareaRef.current = textarea as HTMLTextAreaElement;
    }
  }, []);

  useEffect(() => {
    // Reset the flag when chat changes
    setIsImprovingText(false);
  }, [chatId]);

  // After message clear, reset textarea height to auto
  useEffect(() => {
    if (message === "" && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Get current settings
      const apiSettings = getSettings();
      
      // Temporary IDs for messages
      const tempUserMessageId = `temp-user-${Date.now()}`;
      const tempAIMessageId = `temp-ai-${Date.now()}`;
      
      // Temporary messages
      const optimisticUserMessage = {
        id: tempUserMessageId,
        chatId,
        content,
        isUserMessage: true,
        createdAt: new Date().toISOString()
      };
      
      const thinkingAIMessage = {
        id: tempAIMessageId,
        chatId,
        content: "Thinking...",
        isUserMessage: false,
        createdAt: new Date().toISOString()
      };
      
      // Update the cache with temporary messages
      const queryKey = [`/api/chats/${chatId}/messages`];
      const previousMessages = queryClient.getQueryData<Message[]>(queryKey) || [];
      
      queryClient.setQueryData(queryKey, [
        ...previousMessages, 
        optimisticUserMessage,
        thinkingAIMessage
      ]);
      
      try {
        // Search Wikipedia if enabled
        let wikipediaResults = "";
        if (apiSettings.webSearchEnabled) {
          setIsSearchingWikipedia(true);
          // Show 'Searching Wikipedia...' in the optimistic AI message
          {
            const currentMsgs = queryClient.getQueryData<Message[]>(queryKey) ?? [];
            const updatedMsgs = currentMsgs.map(msg =>
              msg.id === tempAIMessageId ? { ...msg, content: "Searching Wikipedia..." } : msg
            );
            queryClient.setQueryData<Message[]>(queryKey, updatedMsgs);
          }
          try {
            console.log("Starting intelligent Wikipedia search for:", content);
            
            // Pass the selected model to the search function
            const results = await searchWikipediaWithKeywords(content, 10, selectedModel);
            
            // Format the results for AI
            wikipediaResults = formatWikipediaResultsForAI(results);
            
            console.log("Wikipedia search results with keywords:", results.length > 0 ? "found" : "none");
          } catch (error) {
            console.error("Error during Wikipedia search:", error);
            // We don't block sending the message if the search fails
            wikipediaResults = "Web search failed: service temporarily unavailable.";
          } finally {
            // Revert optimistic AI message back to 'Thinking...'
            {
              const currentMsgs = queryClient.getQueryData<Message[]>(queryKey) ?? [];
              const updatedMsgs = currentMsgs.map(msg =>
                msg.id === tempAIMessageId ? { ...msg, content: "Thinking..." } : msg
              );
              queryClient.setQueryData<Message[]>(queryKey, updatedMsgs);
            }
            setIsSearchingWikipedia(false);
          }
        }

        // Updated configuration with Wikipedia results
        const updatedSettings = {
          ...apiSettings,
          webSearchEnabled: apiSettings.webSearchEnabled,
          webSearchResults: wikipediaResults
        };
      
        // Send the request to the server
      return apiRequest("POST", "/api/messages", {
        chatId,
        content,
        isUserMessage: true,
        modelName: selectedModel,
          apiSettings: updatedSettings
      });
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Reset input
      setMessage("");
      setAttachedFile(null);
      
      try {
        // Update messages
        await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        
        // Check if we already processed this chat
        if (!titleProcessedRef.current && currentChat && currentChat.title === "New Chat") {
          console.log("[MessageInput] Checking if a title needs to be generated for the chat");
          
          // Get updated messages
          const updatedMessages = await queryClient.fetchQuery<Message[]>({
            queryKey: [`/api/chats/${chatId}/messages`],
          });
          
          // Filter only user messages (exclude AI messages)
          const userMessages = updatedMessages.filter(msg => msg.isUserMessage);
          console.log(`[MessageInput] User messages found: ${userMessages.length}`);
          
          // If there are exactly 1 user message, generate the title
          if (userMessages.length === 1) {
            console.log("[MessageInput] First user message detected, starting title generation");
            titleProcessedRef.current = true; // Set the flag to avoid multiple generations
            
            // Get current settings
            const currentApiSettings = getSettings();
            
            // Wait a bit to make sure the message has been completely saved
            setTimeout(async () => {
              // Pass the selected model and settings to the title generation function
              const success = await regenerateChatTitle(chatId, {
                modelName: selectedModel,
                temperature: currentApiSettings.temperature || 0.7,
                apiUrl: currentApiSettings.apiUrl || ""
              });
              
              if (success) {
                // Update the query cache to reflect the new title
                await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
                await queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
                console.log("[MessageInput] Title generated and cache updated");
              }
            }, 800);
          }
        }
      } catch (error) {
        console.error("[MessageInput] Error during post-processing:", error);
      }
    }
  });

  const improveTextMutation = useMutation({
    mutationFn: async (textToImprove: string) => {
      if (!textToImprove || textToImprove.trim() === "") {
        throw new Error("The text is empty");
      }
      
      console.log("Sending request to improve:", textToImprove);
      
      // Get current settings
      const apiSettings = getSettings();
      
      // Use the server endpoint instead of calling the API directly
      const response = await apiRequest("POST", "/api/improve-text", {
        text: textToImprove,
        modelName: selectedModel,
        temperature: apiSettings.temperature || 0.7
      });
      
      // Extract the JSON body from the response before processing it
      const responseData = await response.json();
      
      console.log("Response received from server:", responseData);
      
      if (!responseData || typeof responseData !== 'object' || !('improvedText' in responseData)) {
        console.error("The response doesn't contain improvedText:", responseData);
        throw new Error("Invalid API response");
      }
      
      return responseData.improvedText;
    },
    onSuccess: (improvedText) => {
      console.log("onSuccess called with improved text:", improvedText);
      
      // Set the improved text in the input box
      if (improvedText && typeof improvedText === 'string') {
        setMessage(improvedText);
        console.log("Text box updated to:", improvedText);
        
        // Force a textarea update
        setTimeout(() => {
          // Adjust textarea height
          if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, isMobile ? 80 : 120)}px`;
            // Force focus and selection to ensure the text is visible
            textarea.focus();
          }
        }, 50);
        
        toast({
          title: "Text improved",
          description: "The content has been successfully improved.",
        });
      } else {
        console.error("improvedText is empty or not a string:", improvedText);
        toast({
          title: "Error",
          description: "The received improved text is invalid.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Error during improvement:", error);
      
      toast({
        title: "Error",
        description: `Unable to improve the text: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsImprovingText(false);
    }
  });

  const handleImproveText = () => {
    if (message?.trim()) {
      setIsImprovingText(true);
      improveTextMutation.mutate(message);
    } else {
      toast({
        title: "Input required",
        description: "Enter some text to improve.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message?.trim()) {
      const currentMessage = message;
      setMessage("");
      sendMessageMutation.mutate(currentMessage);
    }
  };

  // Function to handle textarea text change and update the reference
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    textareaRef.current = e.target;
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, isMobile ? 80 : 120)}px`;
  };

  // Handles key presses in the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message?.trim()) {
        const currentMessage = message;
        setMessage("");
        sendMessageMutation.mutate(currentMessage);
      }
    }
  };

  const toggleWebSearch = () => {
    const newValue = !webSearchEnabled;
    setWebSearchEnabled(newValue);
    
    // Update saved settings
    const currentSettings = getSettings();
    const updatedSettings = {
      ...currentSettings,
      webSearchEnabled: newValue
    };
    localStorage.setItem('apiSettings', JSON.stringify(updatedSettings));
    
    toast({
      title: newValue ? "Web Search activated" : "Web Search deactivated",
      description: newValue 
        ? "Responses will include information from Wikipedia" 
        : "Responses will no longer include external information"
    });
  };
  
  // Handles opening the file selector
  const handleAttachFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handles file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if the file is an image
      const isImage = file.type.startsWith('image/');
      
      // If it's an image but the model doesn't support images, show error
      if (isImage && !currentModelSupportsImages) {
        toast({
          title: "Image not supported",
          description: "The selected model doesn't support image processing",
          variant: "destructive",
        });
        // Reset the file input
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setAttachedFile(file);
      toast({
        title: "File attached",
        description: `${file.name} successfully attached`,
      });
      
      // For now, we just insert the file name in the message
      setMessage(prev => prev + `\n[File: ${file.name}]`);
    }
  };
  
  // Function to insert a message template
  const insertTemplate = (templateMessage: string) => {
    setMessage(templateMessage);
    if (isMobile) {
      // Focus on the input after insertion on mobile
      setTimeout(() => {
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          textarea.focus();
          // Set the input height based on the content
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`;
        }
      }, 10);
    }
  };

  return {
    message,
    setMessage,
    webSearchEnabled,
    setWebSearchEnabled,
    isImprovingText,
    isSearchingWikipedia,
    textareaRef,
    fileInputRef,
    attachedFile,
    currentModelSupportsImages,
    currentModelSupportsWeb,
    handleTextareaChange,
    handleKeyDown,
    handleSendMessage,
    toggleWebSearch,
    handleAttachFile,
    handleFileSelect,
    handleImproveText,
    insertTemplate,
    sendMessageMutation,
    improveTextMutation,
    isMobile
  };
}