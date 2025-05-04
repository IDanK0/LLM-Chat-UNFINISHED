import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CopyIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import MarkdownContent from "./MarkdownContent";
import { useIsMobile } from "@/hooks/use-mobile";

// Define the Message type directly
interface Message {
  id: number;
  chatId: string;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

interface ChatInterfaceProps {
  chatId: string;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const isMobile = useIsMobile();
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
  });

  // Function to copy message to clipboard
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(
      () => {
        toast({
          title: "Copied",
          description: "The message has been copied to clipboard",
        });
      },
      (err) => {
        console.error("Error during copy", err);
        toast({
          title: "Error",
          description: "Unable to copy message",
          variant: "destructive",
        });
      }
    );
  };

  // Start message edit
  const handleEditStart = (message: Message) => {
    setEditingMessage(message);
    setEditedContent(message.content);
    setIsEditDialogOpen(true);
  };

  // Handle message deletion
  const handleDeleteStart = (message: Message) => {
    setMessageToDelete(message);
    setIsDeleteDialogOpen(true);
  };

  // Confirm and execute message deletion
  const handleDeleteConfirm = () => {
    if (messageToDelete && messages) {
      // In a real app, we would call an API to delete the message
      const updatedMessages = messages.filter(msg => msg.id !== messageToDelete.id);
      
      // Manually update the React Query cache
      queryClient.setQueryData([`/api/chats/${chatId}/messages`], updatedMessages);
      
      toast({
        title: "Message deleted",
        description: "The message has been successfully deleted"
      });
      setIsDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  // Simulates saving the edited message (in a real app, an API endpoint would be needed)
  const handleSaveEdit = () => {
    if (editingMessage && editedContent.trim()) {
      // In a real app, we would call an API to update the message
      // Here we simulate the update by updating the local cache
      if (editingMessage && messages) {
        const updatedMessages = messages.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, content: editedContent } 
            : msg
        );

        // Manually update the React Query cache
        queryClient.setQueryData([`/api/chats/${chatId}/messages`], updatedMessages);
      }

      toast({
        title: "Edit saved",
        description: "The message has been successfully modified"
      });
      setIsEditDialogOpen(false);
      setEditingMessage(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex-1 overflow-y-auto px-4 py-4",
        isMobile && "p-1 chat-interface"
      )}>
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className={cn("flex items-start mb-4", isMobile && "mb-2")}>
              <Skeleton className={cn("h-8 w-8 rounded-full mr-2", isMobile && "h-7 w-7")} />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[400px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 overflow-y-auto px-4 py-4",
      isMobile && "p-1 chat-interface"
    )}>
      <div className="max-w-3xl mx-auto">
        {/* Show chat messages if there are any */}
        {messages.length > 0 && messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "relative flex flex-col items-start mb-6 p-3 rounded-xl transition-all duration-300 group",
              message.isUserMessage 
                ? "hover:bg-primary/5" 
                : "bg-[#101c38] border border-primary/30 shadow-md hover:shadow-lg hover:border-primary/40",
              isMobile && "mb-3 p-2.5"
            )}
          >
            <div className="flex w-full items-start">
              {/* Avatar - Optimized dimensions */}
              <div className={cn(
                "flex-shrink-0 mr-2 rounded-full flex items-center justify-center text-sm self-start mt-0.5 chat-message-avatar",
                message.isUserMessage 
                  ? "bg-blue-500/20 text-blue-500" 
                  : "bg-primary/30 text-primary",
                isMobile ? "w-6 h-6 text-xs" : "w-7 h-7"
              )}>
                {message.isUserMessage ? "You" : "AI"}
              </div>

              {/* Message content with integrated buttons */}
              <div className="flex-1 min-w-0 relative">
                {message.isUserMessage ? (
                  <p className={cn(
                    "message-content text-foreground leading-relaxed py-1",
                    "text-white/90",
                    isMobile && "mobile-text",
                    "pr-24" /* Added right padding to make space for the buttons */
                  )}>
                    {message.content}
                  </p>
                ) : (
                  <MarkdownContent
                    content={message.content}
                    className={cn(
                      "text-foreground leading-relaxed py-1",
                      "text-white",
                      isMobile ? "mobile-text" : "-mt-0.5",
                      "pr-24" /* right padding for buttons */
                    )}
                  />
                )}
                
                {/* Action buttons for the message - repositioned at the BOTTOM right */}
                <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-full hover:bg-primary/20",
                      isMobile && "h-6 w-6 bg-primary/10"
                    )}
                    onClick={() => copyToClipboard(message.content)}
                    title="Copy message"
                  >
                    <CopyIcon className={cn("h-3.5 w-3.5 text-primary", isMobile && "h-3 w-3")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-full hover:bg-primary/20",
                      isMobile && "h-6 w-6 bg-primary/10"
                    )}
                    onClick={() => handleEditStart(message)}
                    title="Edit message"
                  >
                    <PencilIcon className={cn("h-3.5 w-3.5 text-primary", isMobile && "h-3 w-3")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-full hover:bg-primary/20",
                      isMobile && "h-6 w-6 bg-primary/10"
                    )}
                    onClick={() => handleDeleteStart(message)}
                    title="Delete message"
                  >
                    <Trash2Icon className={cn("h-3.5 w-3.5 text-primary", isMobile && "h-3 w-3")} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Dialog to edit a message - optimized for mobile */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={cn(
          "bg-sidebar border-primary/30 text-white",
          isMobile ? "max-w-[95vw]" : "max-w-md"
        )}>
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[100px] mt-2 bg-white/10 border-primary/30 text-white textarea-glow"
          />
          <DialogFooter className={cn(
            "mt-4",
            isMobile && "dialog-footer flex-col space-y-2"
          )}>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className={cn(
                "border-primary/30 text-white hover:bg-primary/20",
                isMobile && "w-full"
              )}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={!editedContent.trim()}
              className={cn(
                "bg-primary hover:bg-primary/90",
                isMobile && "w-full"
              )}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog to confirm message deletion - optimized for mobile */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className={cn(
          "bg-sidebar border-primary/30 text-white",
          isMobile ? "max-w-[95vw]" : "max-w-md"
        )}>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-white/80">Are you sure you want to delete this message? This action cannot be undone.</p>
          <DialogFooter className={cn(
            "mt-4",
            isMobile && "dialog-footer flex-col space-y-2"
          )}>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className={cn(
                "border-primary/30 text-white hover:bg-primary/20",
                isMobile && "w-full"
              )}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="destructive"
              className={cn(
                "bg-red-500 hover:bg-red-600",
                isMobile && "w-full"
              )}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}