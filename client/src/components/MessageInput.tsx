import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ImageIcon, 
  Code2Icon, 
  PianoIcon, 
  NotebookTextIcon, 
  EyeIcon, 
  ImagePlusIcon,
  ArrowRightIcon,
  PlusIcon
} from "lucide-react";

interface MessageInputProps {
  chatId: number;
}

export default function MessageInput({ chatId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        chatId,
        content,
        isUserMessage: true
      });
    },
    onSuccess: () => {
      // Reset the input
      setMessage("");
      // Refresh the messages
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };
  
  return (
    <div className="border-t border-border bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSendMessage}>
          <div className="bg-background border border-border rounded-lg mb-4">
            <div className="p-3">
              <Input
                type="text"
                placeholder="Come posso aiutarti oggi?"
                className="w-full bg-transparent border-0 outline-none shadow-none focus-visible:ring-0"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <div className="flex items-center space-x-1">
                <Button type="button" variant="ghost" size="icon" className="rounded-md">
                  <EyeIcon className="h-5 w-5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="rounded-md">
                  <ImagePlusIcon className="h-5 w-5" />
                </Button>
              </div>
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full" 
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <ArrowRightIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="bg-white/10 hover:bg-white/15 border-0 text-sm h-9"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Crea immagine
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/10 hover:bg-white/15 border-0 text-sm h-9"
          >
            <Code2Icon className="h-4 w-4 mr-2" />
            Codice
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/10 hover:bg-white/15 border-0 text-sm h-9"
          >
            <PianoIcon className="h-4 w-4 mr-2" />
            Fai un piano
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/10 hover:bg-white/15 border-0 text-sm h-9"
          >
            <NotebookTextIcon className="h-4 w-4 mr-2" />
            Notizie
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/10 hover:bg-white/15 border-0 text-sm h-9"
          >
            Altro
          </Button>
        </div>
      </div>
    </div>
  );
}
