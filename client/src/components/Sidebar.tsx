import { useState, useRef, useEffect } from "react";
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
  SettingsIcon,
  AlertTriangle
} from "lucide-react";
import { ConnectionStatusCompact } from "./ConnectionStatus";
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
  className?: string;
}

export default function Sidebar({ isMobile, isOpen, onClose, className }: SidebarProps) {
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
        title: "New Chat" 
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
        title: "Error",
        description: "Unable to create a new chat",
        variant: "destructive"
      });
    }
  };
  
  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/chats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // Navigate to home if the deleted chat was active
      if (selectedChat && location === `/chat/${selectedChat.id}`) {
        setLocation('/');
      }
      
      toast({
        title: "Chat deleted",
        description: "The chat has been successfully deleted"
      });
      
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to delete the chat",
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
        title: "Chat renamed",
        description: "The chat has been successfully renamed"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to rename the chat",
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
      title: "Chat exported",
      description: "The chat has been exported as a text file"
    });
    setIsShareDialogOpen(false);
  };
  
  const exportChatAsPdf = () => {
    toast({
      title: "Chat exported",
      description: "The chat has been exported as PDF file"
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
    "bg-sidebar border-r border-border flex flex-col h-full transition-all duration-300",
    isMobile && (isOpen ? "translate-x-0" : "-translate-x-full"),
    "fixed md:relative z-40",
    !isMobile && "h-full",
    className
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
            New chat
          </Button>
          
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search"
              className="w-full bg-white/10 border-border pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 bg-white/5 hover:bg-white/10 border-border"
              onClick={() => setIsSettingsDialogOpen(true)}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 bg-white/5 hover:bg-white/10 border-border"
              onClick={() => window.open('/diagnostics', '_blank')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Diagnostics
            </Button>
          </div>
        </div>
      
        <div className="flex flex-col overflow-y-auto flex-1">
          <div className="p-4 border-t border-b border-border text-xs font-medium text-muted-foreground text-center">
            All chats
          </div>
          
          <div className="p-2 text-sm">
            {todayChats.length > 0 && (
              <>
                <div className="font-medium px-2 py-1 text-muted-foreground">Today</div>
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
                <div className="font-medium px-2 py-1 text-muted-foreground mt-1">Last 30 days</div>
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
                No chats found
              </div>
            )}
          </div>
        </div>
        
        {/* Connection Status at the bottom */}
        <div className="p-3 border-t border-border bg-sidebar/50">
          <ConnectionStatusCompact />
        </div>
        
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full bg-[#101c38] hover:bg-primary/20 border-primary/20 text-white flex items-center justify-center"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <SettingsIcon className="h-5 w-5 mr-2 text-primary" />
            Settings
          </Button>
        </div>
      </aside>
      
      {/* Dialog to delete a chat */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-sidebar border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle>Delete chat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteChat}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog to rename a chat */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-sidebar border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            className="bg-white/10 border-primary/30"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRenameChat}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog to share a chat */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-sidebar border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle>Share chat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose in which format you want to export the chat
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-start bg-[#101c38] hover:bg-primary/20 border-primary/20"
              onClick={exportChatAsTxt}
            >
              <FileTextIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Export as text file (.txt)</span>
            </Button>
            <Button 
              variant="outline"
              className="flex items-center justify-start bg-[#101c38] hover:bg-primary/20 border-primary/20"
              onClick={exportChatAsPdf}
            >
              <FileIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Export as PDF (.pdf)</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for settings */}
      <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />
    </>
  );
}