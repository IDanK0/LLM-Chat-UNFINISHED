import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Message, Chat } from "@/lib/types";
import { getSettings } from "@/lib/settingsStore";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { regenerateChatTitle } from "@/lib/titleGenerator";
import { modelSupportsImages } from "@/lib/modelConfig"; // Nuova importazione

interface UseMessageInputProps {
  chatId: string;
  selectedModel: string;
}

export function useMessageInput({ chatId, selectedModel }: UseMessageInputProps) {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleProcessedRef = useRef(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isImprovingText, setIsImprovingText] = useState(false);
  
  // Verifica se il modello corrente supporta le immagini
  const currentModelSupportsImages = modelSupportsImages(selectedModel);

  const { data: currentChat } = useQuery<Chat>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
  });

  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
  });

  // Reset il flag quando cambia la chat
  useEffect(() => {
    titleProcessedRef.current = false;
  }, [chatId]);

  // Effetto per sincronizzare il riferimento alla textarea
  useEffect(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textareaRef.current = textarea as HTMLTextAreaElement;
    }
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Ottieni le impostazioni correnti
      const apiSettings = getSettings();
      
      // ID temporanei per i messaggi
      const tempUserMessageId = `temp-user-${Date.now()}`;
      const tempAIMessageId = `temp-ai-${Date.now()}`;
      
      // Messaggi temporanei
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
        content: "Sta pensando...",
        isUserMessage: false,
        createdAt: new Date().toISOString()
      };
      
      // Aggiorna la cache con i messaggi temporanei
      const queryKey = [`/api/chats/${chatId}/messages`];
      const previousMessages = queryClient.getQueryData<Message[]>(queryKey) || [];
      
      queryClient.setQueryData(queryKey, [
        ...previousMessages, 
        optimisticUserMessage,
        thinkingAIMessage
      ]);
      
      // Invia la richiesta al server
      return apiRequest("POST", "/api/messages", {
        chatId,
        content,
        isUserMessage: true,
        modelName: selectedModel,
        apiSettings
      });
    },
    onSuccess: async () => {
      // Reset dell'input
      setMessage("");
      setAttachedFile(null);
      
      try {
        // Aggiorna i messaggi
        await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        
        // Controlla se abbiamo già elaborato questa chat
        if (!titleProcessedRef.current && currentChat && currentChat.title === "Nuova Chat") {
          console.log("[MessageInput] Verifico se è necessario generare un titolo per la chat");
          
          // Ottieni messaggi aggiornati
          const updatedMessages = await queryClient.fetchQuery<Message[]>({
            queryKey: [`/api/chats/${chatId}/messages`],
          });
          
          // Filtra solo i messaggi utente (escludi quelli dell'AI)
          const userMessages = updatedMessages.filter(msg => msg.isUserMessage);
          console.log(`[MessageInput] Messaggi utente trovati: ${userMessages.length}`);
          
          // Se ci sono esattamente 1 messaggio utente, genera il titolo
          if (userMessages.length === 1) {
            console.log("[MessageInput] Primo messaggio utente rilevato, avvio generazione titolo");
            titleProcessedRef.current = true; // Imposta il flag per evitare generazioni multiple
            
            // Ottieni le impostazioni correnti
            const apiSettings = getSettings();
            
            // Attendi un po' per assicurarti che il messaggio sia stato salvato completamente
            setTimeout(async () => {
              // Passa il modello selezionato e le impostazioni alla funzione di generazione del titolo
              const success = await regenerateChatTitle(chatId, {
                modelName: selectedModel,
                temperature: apiSettings.temperature || 0.7,
                apiKey: apiSettings.apiKey,
                apiUrl: apiSettings.apiUrl || "",
                apiVersion: apiSettings.apiVersion || ""
              });
              
              if (success) {
                // Aggiorna la query cache per riflettere il nuovo titolo
                await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
                await queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
                console.log("[MessageInput] Titolo generato e cache aggiornata");
              }
            }, 800);
          }
        }
      } catch (error) {
        console.error("[MessageInput] Errore durante l'elaborazione post-invio:", error);
      }
    }
  });

  const improveTextMutation = useMutation({
    mutationFn: async (textToImprove: string) => {
      if (!textToImprove || textToImprove.trim() === "") {
        throw new Error("Il testo è vuoto");
      }
      
      console.log("Invio richiesta per migliorare:", textToImprove);
      
      // Ottieni le impostazioni correnti
      const apiSettings = getSettings();
      
      // Usiamo l'endpoint del server invece di chiamare direttamente l'API
      const response = await apiRequest("POST", "/api/improve-text", {
        text: textToImprove,
        modelName: selectedModel,
        temperature: apiSettings.temperature || 0.7
      });
      
      // Estrai il corpo JSON dalla risposta prima di elaborarlo
      const responseData = await response.json();
      
      console.log("Risposta ricevuta dal server:", responseData);
      
      if (!responseData || typeof responseData !== 'object' || !('improvedText' in responseData)) {
        console.error("La risposta non contiene improvedText:", responseData);
        throw new Error("Risposta API non valida");
      }
      
      return responseData.improvedText;
    },
    onSuccess: (improvedText) => {
      console.log("onSuccess chiamato con testo migliorato:", improvedText);
      
      // Imposta il testo migliorato nella casella di input
      if (improvedText && typeof improvedText === 'string') {
        setMessage(improvedText);
        console.log("Testo della casella aggiornato a:", improvedText);
        
        // Forza un aggiornamento della textarea
        setTimeout(() => {
          // Adatta l'altezza della textarea
          if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, isMobile ? 80 : 120)}px`;
            // Forza il focus e la selezione per assicurarsi che il testo sia visibile
            textarea.focus();
          }
        }, 50);
        
        toast({
          title: "Testo migliorato",
          description: "Il contenuto è stato migliorato con successo.",
        });
      } else {
        console.error("improvedText è vuoto o non è una stringa:", improvedText);
        toast({
          title: "Errore",
          description: "Il testo migliorato ricevuto non è valido.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Errore durante il miglioramento:", error);
      
      toast({
        title: "Errore",
        description: `Impossibile migliorare il testo: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
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
        title: "Input richiesto",
        description: "Inserisci del testo da migliorare.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message?.trim()) {
      const currentMessage = message;
      setMessage("");
      // Reset textarea height
      const textarea = e.currentTarget.querySelector('textarea');
      if (textarea) {
        textarea.style.height = isMobile ? '28px' : '36px';
      }
      sendMessageMutation.mutate(currentMessage);
    }
  };

  // Funzione per gestire il cambio del testo nella textarea e aggiornare il riferimento
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    textareaRef.current = e.target;
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, isMobile ? 80 : 120)}px`;
  };

  // Gestisce la pressione dei tasti nella textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter senza Shift invia il messaggio
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message?.trim()) {
        const currentMessage = message;
        setMessage("");
        e.currentTarget.style.height = isMobile ? '28px' : '36px';
        sendMessageMutation.mutate(currentMessage);
      }
    }
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };
  
  // Gestisce l'apertura del selettore di file
  const handleAttachFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Gestisce la selezione di un file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Controlla se il file è un'immagine
      const isImage = file.type.startsWith('image/');
      
      // Se è un'immagine ma il modello non supporta le immagini, mostra errore
      if (isImage && !currentModelSupportsImages) {
        toast({
          title: "Immagine non supportata",
          description: "Il modello selezionato non supporta l'elaborazione di immagini",
          variant: "destructive",
        });
        // Reset dell'input file
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setAttachedFile(file);
      toast({
        title: "File allegato",
        description: `${file.name} allegato con successo`,
      });
      
      // Per ora, inseriamo solo il nome del file nel messaggio
      setMessage(prev => prev + `\n[File: ${file.name}]`);
    }
  };
  
  // Funzione per inserire un template di messaggio
  const insertTemplate = (templateMessage: string) => {
    setMessage(templateMessage);
    if (isMobile) {
      // Focus sull'input dopo l'inserimento su mobile
      setTimeout(() => {
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          textarea.focus();
          // Imposta l'altezza dell'input in base al contenuto
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
    textareaRef,
    fileInputRef,
    attachedFile,
    currentModelSupportsImages, // Esponiamo questa nuova proprietà
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