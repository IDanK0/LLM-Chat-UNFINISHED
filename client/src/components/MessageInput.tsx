import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message, Chat } from "@/lib/types";
import { getSettings } from "@/lib/settingsStore";
import { cn } from "@/lib/utils";
import { 
  ImageIcon, 
  Code2Icon, 
  NotebookTextIcon, 
  GlobeIcon, 
  ArrowRightIcon,
  PlusIcon,
  FileIcon,
  MoreHorizontalIcon,
  PaperclipIcon
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
  
  // Gestione dell'upload di file
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const { data: currentChat } = useQuery<Chat>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
  });

  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
  });

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
      setAttachedFile(null);
      
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
        textarea.style.height = isMobile ? '28px' : '36px';
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
        e.currentTarget.style.height = isMobile ? '28px' : '36px';
        sendMessageMutation.mutate(currentMessage);
      }
    }
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };
  
  // Gestisce l'apertura del selettore di file
  const handleAttachFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Gestisce la selezione di un file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      toast({
        title: "File allegato",
        description: `${file.name} allegato con successo`,
      });
      
      // Per ora, inseriamo solo il nome del file nel messaggio
      // In un'implementazione reale, il file verrebbe caricato sul server
      setMessage(prev => prev + `\n[File: ${file.name}]`);
    }
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
        textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`;
      }
    }
  };
  
  return (
    <div className={cn(
      "border-t border-border bg-background p-4",
      isMobile && "message-input-container p-2"
    )}>
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSendMessage}>
          <div className="bg-[#101c38] border border-primary/30 rounded-xl shadow-lg transition-all duration-300 ease-in-out">
            <div className="flex items-center p-1.5">
              {/* Azioni a sinistra - riorganizzate per miglior allineamento */}
              <div className="flex items-center space-x-1 mr-1">
                <Button
                  type="button"
                  variant={webSearchEnabled ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "rounded-full transition-all duration-300",
                    webSearchEnabled ? 'bg-primary/80 text-white shadow-md' : 'hover:bg-primary/20',
                    isMobile ? "h-6 w-6" : "h-7 w-7"
                  )}
                  onClick={toggleWebSearch}
                >
                  <GlobeIcon className={cn("text-white", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
                </Button>
                
                {/* Pulsante per allegare file - ora disponibile sia su desktop che mobile */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full hover:bg-primary/20 transition-all duration-300",
                    isMobile ? "h-6 w-6" : "h-7 w-7"
                  )}
                  onClick={handleAttachFile}
                >
                  <PaperclipIcon className={cn(
                    "text-white",
                    isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
                  )} />
                </Button>
                
                {/* Input nascosto per la selezione dei file */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </div>
              
              <Textarea
                placeholder="Come posso aiutarti oggi?"
                className={cn(
                  "flex-1 bg-transparent border-0 outline-none shadow-none focus-visible:ring-0 text-sm textarea-glow resize-none",
                  "py-1.5 min-h-[36px] transition-all duration-200 max-h-[120px] overflow-y-auto",
                  isMobile && "message-textarea py-1 min-h-[28px] max-h-[80px]"
                )}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, isMobile ? 80 : 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Button 
                type="submit" 
                size="icon" 
                className={cn(
                  "rounded-full bg-primary hover:bg-primary/90 ml-1 transition-all duration-300 transform hover:scale-105",
                  isMobile ? "h-6 w-6" : "h-7 w-7"
                )}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <ArrowRightIcon className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </Button>
            </div>
          </div>
        </form>

        {/* Menu a dropdown per dispositivi mobili - migliorato allineamento */}
        {isMobile && (
          <div className="flex justify-center mt-1 suggestions-container">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-xs h-6 w-full rounded-xl transition-all"
                >
                  <MoreHorizontalIcon className="h-3 w-3 mr-1 text-primary" />
                  <span className="text-white/90 text-xs">Suggerimenti</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                side="top"
                className="bg-[#101c38] border-primary/30 w-[250px] rounded-xl shadow-xl dropdown-content"
              >
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
                  onClick={() => insertTemplate("Puoi generare un'immagine di un gatto che suona il pianoforte?")}
                >
                  <ImageIcon className="h-3 w-3 mr-2 text-primary" />
                  <span>Crea immagine</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
                  onClick={() => insertTemplate("Puoi scrivere un esempio di codice React per una to-do list?")}
                >
                  <Code2Icon className="h-3 w-3 mr-2 text-primary" />
                  <span>Codice</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
                  onClick={() => insertTemplate("Aiutami a creare un piano di studio per imparare il machine learning in 3 mesi.")}
                >
                  <FileIcon className="h-3 w-3 mr-2 text-primary" />
                  <span>Fai un piano</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
                  onClick={() => {
                    setWebSearchEnabled(true);
                    insertTemplate("Quali sono gli sviluppi più recenti nell'intelligenza artificiale generativa?");
                  }}
                >
                  <NotebookTextIcon className="h-3 w-3 mr-2 text-primary" />
                  <span>Notizie</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
                  onClick={() => insertTemplate("Qual è la differenza tra machine learning e deep learning?")}
                >
                  <PlusIcon className="h-3 w-3 mr-2 text-primary" />
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