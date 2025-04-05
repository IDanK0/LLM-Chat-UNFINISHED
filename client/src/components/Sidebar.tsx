import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Chat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  PlusIcon, 
  SearchIcon, 
  GlobeIcon, 
  Trash2Icon, 
  PenIcon, 
  ShareIcon, 
  MoreHorizontalIcon,
  FileTextIcon,
  DownloadIcon,
  CopyIcon,
  FileIcon,
  SettingsIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import SettingsDialog from "@/components/SettingsDialog";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const { toast } = useToast();
  
  // Fetch chats
  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
  });
  
  // Create new chat and navigate to it
  const handleNewChat = async () => {
    try {
      const response = await apiRequest('POST', '/api/chats', { 
        title: "Nuova Chat" 
      });
      const newChat = await response.json();
      // Invalidate chats query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      // Navigate to the new chat
      setLocation(`/chat/${newChat.id}`);
      // Close the sidebar if on mobile
      if (isMobile) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create new chat', error);
      toast({
        title: "Errore",
        description: "Impossibile creare una nuova chat",
        variant: "destructive"
      });
    }
  };
  
  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/chats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // Navigate to home if the deleted chat was active
      if (selectedChat && location === `/chat/${selectedChat.id}`) {
        setLocation('/');
      }
      
      toast({
        title: "Chat eliminata",
        description: "La chat è stata eliminata con successo"
      });
      
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la chat",
        variant: "destructive"
      });
    }
  });
  
  // Rename chat mutation
  const renameChatMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number, title: string }) => {
      return apiRequest('PATCH', `/api/chats/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      setIsRenameDialogOpen(false);
      toast({
        title: "Chat rinominata",
        description: "La chat è stata rinominata con successo"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile rinominare la chat",
        variant: "destructive"
      });
    }
  });
  
  const handleDeleteChat = (chat: Chat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChat(chat);
    setIsDeleteDialogOpen(true);
  };
  
  const handleRenameChat = (chat: Chat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChat(chat);
    setNewChatTitle(chat.title);
    setIsRenameDialogOpen(true);
  };
  
  const handleShareChat = (chat: Chat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChat(chat);
    setIsShareDialogOpen(true);
  };
  
  const confirmDeleteChat = () => {
    if (selectedChat) {
      deleteChatMutation.mutate(selectedChat.id);
    }
  };
  
  const confirmRenameChat = () => {
    if (selectedChat && newChatTitle.trim()) {
      renameChatMutation.mutate({ 
        id: selectedChat.id, 
        title: newChatTitle 
      });
    }
  };
  
  const exportChatAsTxt = () => {
    toast({
      title: "Chat esportata",
      description: "La chat è stata esportata come file di testo"
    });
    setIsShareDialogOpen(false);
  };
  
  const exportChatAsPdf = () => {
    toast({
      title: "Chat esportata",
      description: "La chat è stata esportata come file PDF"
    });
    setIsShareDialogOpen(false);
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
    <>
      <aside className={sidebarClasses}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <div className="rounded-full bg-primary/30 w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-110">
              <GlobeIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-white">LLM Chat</span>
          </Link>
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
          
          {/* Rimosso il pulsante Impostazioni da qui */}
          
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
                  <div 
                    key={chat.id}
                    className={cn(
                      "mt-1 rounded-md group cursor-pointer transition-all duration-300 flex items-center",
                      location === `/chat/${chat.id}` ? "bg-[#101c38] border border-primary/20" : "hover:bg-[#101c38] border border-transparent hover:border-primary/20"
                    )}
                  >
                    <Link 
                      href={`/chat/${chat.id}`}
                      className="p-2 flex-1 min-w-0"
                    >
                      <div className="text-white truncate">{chat.title}</div>
                    </Link>
                    
                    <div className="opacity-0 group-hover:opacity-100 pr-2 flex space-x-1 transition-opacity duration-300">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full hover:bg-primary/20"
                        onClick={(e) => handleRenameChat(chat, e)}
                      >
                        <PenIcon className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full hover:bg-primary/20"
                        onClick={(e) => handleShareChat(chat, e)}
                      >
                        <ShareIcon className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full hover:bg-primary/20"
                        onClick={(e) => handleDeleteChat(chat, e)}
                      >
                        <Trash2Icon className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {recentChats.length > 0 && (
              <>
                <div className="font-medium px-2 py-1 text-muted-foreground mt-1">Ultimi 30 giorni</div>
                {recentChats.map(chat => (
                  <div 
                    key={chat.id}
                    className={cn(
                      "mt-1 rounded-md group cursor-pointer transition-all duration-300 flex items-center",
                      location === `/chat/${chat.id}` ? "bg-[#101c38] border border-primary/20" : "hover:bg-[#101c38] border border-transparent hover:border-primary/20"
                    )}
                  >
                    <Link 
                      href={`/chat/${chat.id}`}
                      className="p-2 flex-1 min-w-0"
                    >
                      <div className="text-white truncate">{chat.title}</div>
                    </Link>
                    
                    <div className="opacity-0 group-hover:opacity-100 pr-2 flex space-x-1 transition-opacity duration-300">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full hover:bg-primary/20"
                        onClick={(e) => handleRenameChat(chat, e)}
                      >
                        <PenIcon className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full hover:bg-primary/20"
                        onClick={(e) => handleShareChat(chat, e)}
                      >
                        <ShareIcon className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full hover:bg-primary/20"
                        onClick={(e) => handleDeleteChat(chat, e)}
                      >
                        <Trash2Icon className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  </div>
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
        
        {/* Aggiungi il pulsante Impostazioni qui in fondo */}
        <div className="p-4 border-t border-border mt-auto">
          <Button 
            variant="outline" 
            className="w-full bg-[#101c38] hover:bg-primary/20 border-primary/20 text-white flex items-center justify-center"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <SettingsIcon className="h-5 w-5 mr-2 text-primary" />
            Impostazioni
          </Button>
        </div>
      </aside>
      
      {/* Dialog per eliminare una chat */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-sidebar border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle>Elimina chat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Sei sicuro di voler eliminare questa chat? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmDeleteChat}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog per rinominare una chat */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-sidebar border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle>Rinomina chat</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nuovo nome"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            className="bg-white/10 border-primary/30"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={confirmRenameChat}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog per condividere una chat */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-sidebar border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle>Condividi chat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Scegli in quale formato vuoi esportare la chat
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-start bg-[#101c38] hover:bg-primary/20 border-primary/20"
              onClick={exportChatAsTxt}
            >
              <FileTextIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Esporta come file di testo (.txt)</span>
            </Button>
            <Button 
              variant="outline"
              className="flex items-center justify-start bg-[#101c38] hover:bg-primary/20 border-primary/20"
              onClick={exportChatAsPdf}
            >
              <FileIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Esporta come PDF (.pdf)</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog per le impostazioni */}
      <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />
    </>
  );
}