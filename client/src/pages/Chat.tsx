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

export default function Chat() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [, params] = useRoute<{ id: string }>("/chat/:id");
  const [, setLocation] = useLocation(); // Aggiunto per la navigazione
  const chatId = params ? parseInt(params.id) : 0;
  const [selectedModel, setSelectedModel] = useState("Llama 3.1 8b Instruct");
  
  // Fetch chat data
  const { data: chat, isLoading: isLoadingChat, isError: isChatError } = useQuery<ChatType>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
    retry: false, // Non riprovare se la query fallisce (chat non trovata)
  });
  
  // Fetch chat messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId && !!chat, // Carica i messaggi solo se la chat esiste
  });
  
  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/chats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setLocation('/'); // Reindirizza alla home dopo l'eliminazione
    },
  });

  // Verifica se la chat è vuota e in tal caso la elimina
  useEffect(() => {
    if (!isLoadingMessages && !isLoadingChat && chatId && messages && messages.length === 0 && chat) {
      // Se la chat esiste ma non ha messaggi (nemmeno il messaggio iniziale del sistema)
      console.log("Chat vuota rilevata. Eliminazione in corso...");
      deleteChatMutation.mutate(chatId);
    }
  }, [chatId, messages, isLoadingMessages, isLoadingChat, chat]);
  
  // Reindirizza alla home se la chat non esiste (errore nella query o chat non trovata)
  useEffect(() => {
    if ((!isLoadingChat && chatId && !chat) || isChatError) {
      console.log("Chat non trovata. Reindirizzamento alla home...");
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
    <div className="flex h-screen bg-background">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="border-b border-border py-2 px-4 flex items-center justify-between bg-background">
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
                <DropdownMenuContent align={isMobile ? "center" : "start"} className="bg-[#101c38] border-primary/30 rounded-xl shadow-xl">
                  <DropdownMenuItem 
                    onClick={() => setSelectedModel("Llama 3.1 8b Instruct")}
                    className={`text-white hover:bg-primary/20 rounded-lg transition-all duration-200 my-1 
                      ${selectedModel === "Llama 3.1 8b Instruct" ? "bg-primary/10 font-medium" : ""}`}
                  >
                    Llama 3.1 8b Instruct
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSelectedModel("Gemma 3 12b it Instruct")}
                    className={`text-white hover:bg-primary/20 rounded-lg transition-all duration-200 my-1
                      ${selectedModel === "Gemma 3 12b it Instruct" ? "bg-primary/10 font-medium" : ""}`}
                  >
                    Gemma 3 12b it Instruct
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="invisible w-8">
            {/* Spazio vuoto per mantenere il modello centrato */}
          </div>
        </header>

        {!chatId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Seleziona una chat o creane una nuova</p>
          </div>
        ) : (
          <>
            <ChatInterface chatId={chatId} />
            <MessageInput chatId={chatId} selectedModel={selectedModel} />
          </>
        )}
      </main>
    </div>
  );
}