import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Chat as ChatType, Message } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import MessageInput from "@/components/MessageInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MenuIcon, ChevronDownIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { availableModels, getModelsByProvider } from "@/lib/modelConfig";
import { getSettings } from "@/lib/settingsStore";

export default function Chat() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [, params] = useRoute<{ id: string }>("/chat/:id");
  const [, setLocation] = useLocation();
  const chatId = params ? params.id : "";
  
  // Get default model from settings
  const settings = getSettings();
  const [selectedModel, setSelectedModel] = useState(settings.defaultModel);
  
  // Update selected model when settings change
  useEffect(() => {
    const currentSettings = getSettings();
    setSelectedModel(currentSettings.defaultModel);
  }, []);
  
  // Fetch chat data
  const { data: chat, isLoading: isLoadingChat, isError: isChatError } = useQuery<ChatType>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
    retry: false,
  });
  
  // Fetch chat messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId && !!chat,
  });
  
  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/chats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setLocation('/');
    },
  });

  // Check if the chat is empty and if so, delete it
  useEffect(() => {
    if (!isLoadingMessages && !isLoadingChat && chatId && messages && messages.length === 0 && chat) {
      console.log("Empty chat detected. Deleting...");
      deleteChatMutation.mutate(chatId);
    }
  }, [chatId, messages, isLoadingMessages, isLoadingChat, chat, deleteChatMutation]);
  
  // Redirect to home if the chat doesn't exist (query error or chat not found)
  useEffect(() => {
    if ((!isLoadingChat && chatId && !chat) || isChatError) {
      console.log("Chat not found. Redirecting to home...");
      setLocation('/');
    }
  }, [chatId, chat, isLoadingChat, isChatError, setLocation]);
  
  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [chatId, isMobile]);
  
  return (
    <div className="flex h-screen bg-background app-container">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="border-b border-border py-2 px-2 flex items-center justify-between bg-background">
          <div className="flex items-center space-x-2">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1" 
                onClick={() => setIsSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <div className="flex-1 flex justify-center">
            {isLoadingChat ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 border-primary/30 bg-[#101c38] rounded-xl shadow-md hover:bg-primary/20 transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="font-medium text-sm text-white">{selectedModel}</span>
                    <ChevronDownIcon className="h-4 w-4 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isMobile ? "center" : "start"} className="bg-[#101c38] border-primary/30 rounded-xl shadow-xl max-h-96 overflow-y-auto">
                  {/* Local Models */}
                  {getModelsByProvider('local').length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-primary/20">
                        Local Models
                      </div>
                      {getModelsByProvider('local').map(model => (
                        <DropdownMenuItem 
                          key={model.displayName}
                          onClick={() => setSelectedModel(model.displayName)}
                          className={`text-white hover:bg-primary/20 rounded-lg transition-all duration-200 my-1 
                            ${selectedModel === model.displayName ? "bg-primary/10 font-medium" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                              local
                            </span>
                            {model.displayName}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  
                  {/* OpenRouter Models */}
                  {getModelsByProvider('openrouter').length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-primary/20 mt-2">
                        OpenRouter Models
                      </div>
                      {getModelsByProvider('openrouter').map(model => (
                        <DropdownMenuItem 
                          key={model.displayName}
                          onClick={() => setSelectedModel(model.displayName)}
                          className={`text-white hover:bg-primary/20 rounded-lg transition-all duration-200 my-1 
                            ${selectedModel === model.displayName ? "bg-primary/10 font-medium" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                              openrouter
                            </span>
                            {model.displayName}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  
                  {/* Deepseek Models */}
                  {getModelsByProvider('deepseek').length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-primary/20 mt-2">
                        Deepseek Models
                      </div>
                      {getModelsByProvider('deepseek').map(model => (
                        <DropdownMenuItem 
                          key={model.displayName}
                          onClick={() => setSelectedModel(model.displayName)}
                          className={`text-white hover:bg-primary/20 rounded-lg transition-all duration-200 my-1 
                            ${selectedModel === model.displayName ? "bg-primary/10 font-medium" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                              deepseek
                            </span>
                            {model.displayName}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="invisible w-8">
            {/* Empty space to keep the model centered */}
          </div>
        </header>

        {!chatId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a chat or create a new one</p>
          </div>
        ) : (
          <>
            <div className="mobile-chat-container flex-1 flex flex-col overflow-hidden">
              <ChatInterface chatId={chatId} />
              <MessageInput chatId={chatId} selectedModel={selectedModel} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}