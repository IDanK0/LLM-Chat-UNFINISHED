import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Chat as ChatType, Message } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import MessageInput from "@/components/MessageInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MenuIcon, ChevronDownIcon } from "lucide-react";
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
  const chatId = params ? parseInt(params.id) : 0;
  const [selectedModel, setSelectedModel] = useState("Llama 3.1 8b Instruct");
  
  // Fetch chat data
  const { data: chat, isLoading: isLoadingChat } = useQuery<ChatType>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId
  });
  
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
        <header className="border-b border-border py-3 px-4 flex items-center justify-between bg-background">
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
            <div className="flex items-center space-x-2">
              {isLoadingChat ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 border-primary/20 bg-primary/10">
                      <span className="font-medium text-sm">{selectedModel}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setSelectedModel("Llama 3.1 8b Instruct")}>
                      Llama 3.1 8b Instruct
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedModel("Gemma 2 12b it Instruct")}>
                      Gemma 2 12b it Instruct
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <div className="text-xs text-muted-foreground">Attiva la visualizzazione avanzata</div>
            </div>
          </div>
        </header>

        {!chatId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Seleziona una chat o creane una nuova</p>
          </div>
        ) : (
          <>
            <ChatInterface chatId={chatId} />
            <MessageInput chatId={chatId} />
          </>
        )}
      </main>
    </div>
  );
}
