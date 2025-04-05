import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Chat } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, MessageSquareIcon } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Fetch chats
  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
  });
  
  // Create new chat
  const handleNewChat = async () => {
    try {
      const response = await apiRequest('POST', '/api/chats', { 
        title: "Nuova Chat" 
      });
      const newChat = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setLocation(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Failed to create new chat', error);
    }
  };
  
  // Redirect to the first chat if available
  useEffect(() => {
    if (chats.length > 0) {
      setLocation(`/chat/${chats[0].id}`);
    }
  }, [chats, setLocation]);
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="border-b border-border py-3 px-4 flex items-center justify-between bg-background">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">Llama 3.1 8b Instruct</span>
            <div className="text-xs text-muted-foreground">Attiva la visualizzazione avanzata</div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <MessageSquareIcon className="mx-auto h-16 w-16 text-primary/40" />
            <h1 className="text-3xl font-bold">Owen AI Chat</h1>
            <p className="text-muted-foreground">
              Benvenuto nell'interfaccia di chat AI. Inizia una nuova conversazione o seleziona una chat esistente.
            </p>
            <Button className="mx-auto" onClick={handleNewChat}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Inizia una nuova chat
            </Button>
            
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
