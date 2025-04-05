import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ImageIcon, 
  Code2Icon, 
  NotebookTextIcon, 
  GlobeIcon, 
  ImagePlusIcon,
  ArrowRightIcon,
  PlusIcon,
  FileIcon,
  PaperclipIcon
} from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

interface MessageInputProps {
  chatId: number;
}

export default function MessageInput({ chatId }: MessageInputProps) {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        chatId,
        content,
        isUserMessage: true
      });
      // Refresh messages to show user message immediately
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      // Wait for AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Refresh messages again to get AI response
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      return response;
    },
    onSuccess: () => {
      // Reset the input
      setMessage("");
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
      // Reset textarea height after sending
      const textarea = e.currentTarget.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '36px';
      }
    }
  };
  
  // Gestisce la pressione dei tasti nella textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Se viene premuto solo Enter (senza Shift), invia il messaggio
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        sendMessageMutation.mutate(message);
        // Reset textarea height
        e.currentTarget.style.height = '36px';
      }
    }
    // Con Shift+Enter la textarea gestisce automaticamente l'inserimento di una nuova riga
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };
  
  return (
    <div className="border-t border-border bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSendMessage}>
          <div className="bg-[#101c38] border border-primary/30 rounded-xl mb-2 shadow-lg transition-all duration-300 ease-in-out">
            <div className="flex items-center p-2">
              <div className="flex items-center space-x-2 mr-2">
                <Button
                  type="button"
                  variant={webSearchEnabled ? "default" : "ghost"}
                  size="icon"
                  className={`rounded-full transition-all duration-300 ${webSearchEnabled ? 'bg-primary/80 text-white shadow-md' : 'hover:bg-primary/20'}`}
                  onClick={toggleWebSearch}
                >
                  <GlobeIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-primary/20 transition-all duration-300"
                >
                  <PaperclipIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <Textarea
                placeholder="Come posso aiutarti oggi?"
                className="flex-1 bg-transparent border-0 outline-none shadow-none focus-visible:ring-0 text-sm textarea-glow resize-none py-2 min-h-[36px] transition-all duration-200 max-h-[200px] overflow-y-auto"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full bg-primary hover:bg-primary/90 ml-2 transition-all duration-300 transform hover:scale-105"
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>

        {/* Bottoni visibili solo su schermi grandi */}
        {!isMobile && (
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            <Button 
              variant="outline" 
              className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setMessage("Puoi generare un'immagine di un gatto che suona il pianoforte?")}
            >
              <ImageIcon className="h-4 w-4 mr-2 text-primary" />
              <span className="text-white/90">Crea immagine</span>
            </Button>
            <Button 
              variant="outline" 
              className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setMessage("Puoi scrivere un esempio di codice React per una to-do list?")}
            >
              <Code2Icon className="h-4 w-4 mr-2 text-primary" />
              <span className="text-white/90">Codice</span>
            </Button>
            <Button 
              variant="outline" 
              className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setMessage("Aiutami a creare un piano di studio per imparare il machine learning in 3 mesi.")}
            >
              <FileIcon className="h-4 w-4 mr-2 text-primary" />
              <span className="text-white/90">Fai un piano</span>
            </Button>
            <Button 
              variant="outline" 
              className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                setWebSearchEnabled(true);
                setMessage("Quali sono gli sviluppi più recenti nell'intelligenza artificiale generativa?");
              }}
            >
              <NotebookTextIcon className="h-4 w-4 mr-2 text-primary" />
              <span className="text-white/90">Notizie</span>
            </Button>
            <Button 
              variant="outline" 
              className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setMessage("Qual è la differenza tra machine learning e deep learning?")}
            >
              <PlusIcon className="h-4 w-4 mr-2 text-primary" />
              <span className="text-white/90">Altro</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
