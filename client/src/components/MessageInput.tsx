import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message, Chat } from "@/lib/types";
import { getSettings } from "@/lib/settingsStore";
import { 
  ImageIcon, 
  Code2Icon, 
  NotebookTextIcon, 
  GlobeIcon, 
  ArrowRightIcon,
  PlusIcon,
  FileIcon,
  PaperclipIcon,
  MoreHorizontalIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface MessageInputProps {
  chatId: string;
  selectedModel: string;
}

export default function MessageInput({ chatId, selectedModel }: MessageInputProps) {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const { toast } = useToast();
  const processedChatsRef = useRef<Record<string, number>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: currentChat } = useQuery<Chat>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
  });

  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
  });

  // Resto del codice per processare i messaggi della chat e generare titoli...
  
  // [Funzioni omesse per brevità: generateTitle, updateChatTitle, ecc.]
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Ottieni le impostazioni correnti
      const apiSettings = getSettings();
      
      // ID temporanei per i messaggi
      const tempUserMessageId = `temp-user-${Date.now()}`;
      const tempAIMessageId = `temp-ai-${Date.now()}`;
      
      // Messaggi temporanei
      const optimisticUserMessage = {
        id: tempUserMessageId,
        chatId,
        content,
        isUserMessage: true,
        createdAt: new Date().toISOString()
      };
      
      const thinkingAIMessage = {
        id: tempAIMessageId,
        chatId,
        content: "Sta pensando...",
        isUserMessage: false,
        createdAt: new Date().toISOString()
      };
      
      // Aggiorna la cache con i messaggi temporanei
      const queryKey = [`/api/chats/${chatId}/messages`];
      const previousMessages = queryClient.getQueryData<Message[]>(queryKey) || [];
      
      queryClient.setQueryData(queryKey, [
        ...previousMessages, 
        optimisticUserMessage,
        thinkingAIMessage
      ]);
      
      // Invia la richiesta al server
      return apiRequest("POST", "/api/messages", {
        chatId,
        content,
        isUserMessage: true,
        modelName: selectedModel,
        apiSettings
      });
    },
    onSuccess: async () => {
      // Reset dell'input
      setMessage("");
      
      // Aggiorna i messaggi
      await queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      const currentMessage = message;
      setMessage("");
      // Reset textarea height
      const textarea = e.currentTarget.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '36px';
      }
      sendMessageMutation.mutate(currentMessage);
    }
  };
  
  // Gestisce la pressione dei tasti nella textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter senza Shift invia il messaggio
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        const currentMessage = message;
        setMessage("");
        e.currentTarget.style.height = '36px';
        sendMessageMutation.mutate(currentMessage);
      }
    }
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };
  
  // Funzione per inserire un template di messaggio
  const insertTemplate = (templateMessage: string) => {
    setMessage(templateMessage);
    if (isMobile) {
      // Focus sull'input dopo l'inserimento su mobile
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        // Imposta l'altezza dell'input in base al contenuto
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }
    }
  };
  return (
    <div className="border-t border-border bg-background p-2 md:p-4 message-input-container">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSendMessage}>
          <div className="bg-[#101c38] border border-primary/30 rounded-xl shadow-lg transition-all duration-300 ease-in-out">
            <div className="flex items-center p-1.5">
              <div className="flex items-center space-x-1 mr-1">
                <Button
                  type="button"
                  variant={webSearchEnabled ? "default" : "ghost"}
                  size="icon"
                  className={`rounded-full transition-all duration-300 h-7 w-7 ${webSearchEnabled ? 'bg-primary/80 text-white shadow-md' : 'hover:bg-primary/20'}`}
                  onClick={toggleWebSearch}
                >
                  <GlobeIcon className="h-3.5 w-3.5" />
                </Button>
                {!isMobile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/20 transition-all duration-300 h-7 w-7"
                  >
                    <PaperclipIcon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              
              <Textarea
                placeholder="Come posso aiutarti oggi?"
                className="flex-1 bg-transparent border-0 outline-none shadow-none focus-visible:ring-0 text-sm textarea-glow resize-none py-1.5 min-h-[36px] transition-all duration-200 max-h-[120px] overflow-y-auto"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full bg-primary hover:bg-primary/90 ml-1 transition-all duration-300 transform hover:scale-105 h-7 w-7"
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </form>

        {/* Menu a dropdown per dispositivi mobili - reso più compatto */}
        {isMobile && (
          <div className="flex justify-center mt-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-xs h-7 w-full rounded-xl transition-all duration-300"
                >
                  <MoreHorizontalIcon className="h-4 w-4 mr-1.5 text-primary" />
                  <span className="text-white/90">Suggerimenti</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="bg-[#101c38] border-primary/30 w-[250px] rounded-xl shadow-xl"
              >
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg my-0.5 py-2 text-sm"
                  onClick={() => insertTemplate("Puoi generare un'immagine di un gatto che suona il pianoforte?")}
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Crea immagine</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg my-0.5 py-2 text-sm"
                  onClick={() => insertTemplate("Puoi scrivere un esempio di codice React per una to-do list?")}
                >
                  <Code2Icon className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Codice</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg my-0.5 py-2 text-sm"
                  onClick={() => insertTemplate("Aiutami a creare un piano di studio per imparare il machine learning in 3 mesi.")}
                >
                  <FileIcon className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Fai un piano</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg my-0.5 py-2 text-sm"
                  onClick={() => {
                    setWebSearchEnabled(true);
                    insertTemplate("Quali sono gli sviluppi più recenti nell'intelligenza artificiale generativa?");
                  }}
                >
                  <NotebookTextIcon className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Notizie</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg my-0.5 py-2 text-sm"
                  onClick={() => insertTemplate("Qual è la differenza tra machine learning e deep learning?")}
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Altro</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

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