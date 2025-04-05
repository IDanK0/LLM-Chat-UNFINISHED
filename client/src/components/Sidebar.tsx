import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Chat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PlusIcon, SearchIcon, EyeIcon } from "lucide-react";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch chats
  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
  });
  
  // Create new chat
  const handleNewChat = async () => {
    try {
      await apiRequest('POST', '/api/chats', { 
        title: "Nuova Chat" 
      });
      // Invalidate chats query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    } catch (error) {
      console.error('Failed to create new chat', error);
    }
  };
  
  // Filter chats by search query
  const filteredChats = searchQuery 
    ? chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;
  
  // Group chats by time
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const todayChats = filteredChats.filter(chat => {
    const chatDate = new Date(chat.createdAt);
    return chatDate.toDateString() === today.toDateString();
  });
  
  const recentChats = filteredChats.filter(chat => {
    const chatDate = new Date(chat.createdAt);
    return chatDate.toDateString() !== today.toDateString() && 
           chatDate >= thirtyDaysAgo;
  });
  
  const sidebarClasses = cn(
    "bg-sidebar w-64 flex-shrink-0 border-r border-border flex flex-col h-full transition-all duration-300",
    isMobile && (isOpen ? "translate-x-0" : "-translate-x-full"),
    "fixed md:relative z-40"
  );
  
  return (
    <aside className={sidebarClasses}>
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-white/10 w-8 h-8 flex items-center justify-center">
            <EyeIcon className="h-5 w-5" />
          </div>
          <span className="font-medium">Owen</span>
        </div>
        {isMobile && (
          <Button variant="ghost" size="sm" className="p-1" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-white"
          onClick={handleNewChat}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuova chat
        </Button>
        
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cerca"
            className="w-full bg-white/10 border-border pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-col overflow-y-auto flex-1">
        <div className="p-4 border-t border-b border-border text-xs font-medium text-muted-foreground">
          Tutte le chat
        </div>
        
        <div className="p-2 text-sm">
          {todayChats.length > 0 && (
            <>
              <div className="font-medium px-2 py-1 text-muted-foreground">Oggi</div>
              {todayChats.map(chat => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <a 
                    className={cn(
                      "mt-1 rounded-md p-2 cursor-pointer transition-colors block",
                      location === `/chat/${chat.id}` ? "bg-white/5" : "hover:bg-white/10"
                    )}
                  >
                    <div className="text-white">{chat.title}</div>
                  </a>
                </Link>
              ))}
            </>
          )}
          
          {recentChats.length > 0 && (
            <>
              <div className="font-medium px-2 py-1 text-muted-foreground mt-1">Ultimi 30 giorni</div>
              {recentChats.map(chat => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <a 
                    className={cn(
                      "mt-1 rounded-md p-2 cursor-pointer transition-colors block",
                      location === `/chat/${chat.id}` ? "bg-white/5" : "hover:bg-white/10"
                    )}
                  >
                    <div className="text-foreground">{chat.title}</div>
                  </a>
                </Link>
              ))}
            </>
          )}
          
          {filteredChats.length === 0 && (
            <div className="px-2 py-4 text-center text-muted-foreground">
              Nessuna chat trovata
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
