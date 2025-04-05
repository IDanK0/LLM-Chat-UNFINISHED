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
import { PlusIcon, MessageSquareIcon, GlobeIcon, ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Llama 3.1 8b Instruct");
  
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
  
  // Non reindirizzare automaticamente, mostra sempre la schermata principale
  
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </Button>
            )}
          </div>
          
          <div className="flex-1 flex justify-center">
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
          </div>
          
          <div className="invisible w-8">
            {/* Spazio vuoto per mantenere il modello centrato */}
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="rounded-full bg-primary/20 w-20 h-20 flex items-center justify-center mx-auto shadow-lg">
              <GlobeIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">LLM Chat</h1>
            <p className="text-white/70">
              Benvenuto nell'interfaccia di chat AI con supporto per la lingua italiana. Inizia una nuova conversazione o seleziona una chat esistente.
            </p>
            <Button 
              className="mx-auto bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
              onClick={handleNewChat}
            >
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
