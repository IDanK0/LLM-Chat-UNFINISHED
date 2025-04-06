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
  PaperclipIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  chatId: number;
  selectedModel: string;
}

export default function MessageInput({ chatId, selectedModel }: MessageInputProps) {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const { toast } = useToast();
  
  // Cache delle chat già processate per ID con useRef per persistenza tra render
  const processedChatsRef = useRef<Record<number, number>>({});
  
  // Riferimento al timer per debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ottieni le informazioni sulla chat corrente
  const { data: currentChat } = useQuery<Chat>({
    queryKey: [`/api/chats/${chatId}`],
    enabled: !!chatId,
  });

  // Ottieni i messaggi della chat
  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
    enabled: !!chatId,
  });

  // Resetta il contatore quando cambia la chat
  useEffect(() => {
    return () => {
      // Pulizia del timer quando il componente viene smontato o cambia chat
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [chatId]);

  // Effetto per rilevare nuovi messaggi e generare un titolo quando necessario
  useEffect(() => {
    // Verifica se l'opzione è abilitata nelle impostazioni
    if (!getSettings().autoGenerateTitle || !chatId || !chatMessages || !currentChat) {
      return;
    }
    
    // Ottieni il numero di messaggi già processati per questa chat
    const processedCount = processedChatsRef.current[chatId] || 0;
    
    // Verifica se ci sono nuovi messaggi da processare
    if (chatMessages.length > processedCount && chatMessages.length >= 2) {
      console.log(`[Chat ${chatId}] Nuovi messaggi rilevati: ${chatMessages.length} (precedenti: ${processedCount})`);
      
      // Cancella eventuali timer in corso
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Imposta un timer per debounce (ritarda l'esecuzione per evitare chiamate multiple)
      debounceTimerRef.current = setTimeout(() => {
        // Aggiorna il contatore per questa chat
        processedChatsRef.current[chatId] = chatMessages.length;
        
        // Genera il titolo
        generateTitle();
      }, 1500); // Aumentato a 1.5 secondi per dare tempo alla risposta di completarsi
    }
  }, [chatMessages, currentChat, chatId]);

  // Funzione per generare il titolo
  const generateTitle = async () => {
    if (!chatId || !chatMessages || chatMessages.length < 2) {
      return;
    }
    
    console.log(`[Chat ${chatId}] Generazione titolo iniziata`);
    
    try {
      // Prendi solo gli ultimi 4 messaggi per un contesto più rilevante (2 scambi)
      const recentMessages = chatMessages.slice(-4);
      const conversationContext = recentMessages
        .map(msg => `${msg.isUserMessage ? "Utente" : "AI"}: ${msg.content.substring(0, 200)}`)
        .join("\n\n");
      
      // Prompt specifico che richiede esattamente 3 parole o meno
      const titlePrompt = "Crea un titolo MOLTO BREVE (massimo 3 parole) che descriva questa conversazione. Rispondi SOLO con il titolo, senza punti, virgolette o altro testo.";
      
      // Parametri aggiuntivi per limitare la lunghezza del titolo
      const titleParams = {
        maxTokens: 10, // Limitiamo i token per forzare risposte brevi
        temperature: 0.7 // Temperatura leggermente più alta per titoli creativi
      };
      
      // Invia richiesta all'API
      const response = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: conversationContext,
          prompt: titlePrompt,
          chatId,
          modelName: selectedModel,
          params: titleParams
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data?.title) {
        // Pulisci e limita il titolo
        let cleanTitle = data.title
          .replace(/^["'\s.,;:]+|["'\s.,;:]+$/g, '')
          .trim();
        
        // Dividi il titolo in parole e prendi solo le prime 3
        const words = cleanTitle.split(/\s+/);
        if (words.length > 3) {
          cleanTitle = words.slice(0, 3).join(' ');
        }
        
        console.log(`[Chat ${chatId}] Titolo generato: "${cleanTitle}"`);
        
        // Aggiorna il titolo solo se è diverso da quello attuale
        if (cleanTitle && cleanTitle !== currentChat?.title) {
          await updateChatTitle(cleanTitle);
        } else {
          console.log(`[Chat ${chatId}] Titolo invariato o già impostato`);
        }
      }
    } catch (error) {
      console.error(`[Chat ${chatId}] Errore generazione titolo:`, error);
    }
  };

  // Funzione per aggiornare il titolo della chat
  const updateChatTitle = async (title: string) => {
    try {
      console.log(`[Chat ${chatId}] Aggiornamento titolo a: "${title}"`);
      
      // Ottieni una "copia fresca" dello stato attuale della chat
      const latestChat = queryClient.getQueryData<Chat>([`/api/chats/${chatId}`]);
      
      // Se il titolo è già lo stesso, non fare nulla
      if (latestChat?.title === title) {
        return;
      }
      
      // Invia richiesta per aggiornare il titolo
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error(`Errore aggiornamento: ${response.status}`);
      }
      
      // Aggiorna la cache ottimisticamente
      queryClient.setQueryData([`/api/chats/${chatId}`], {
        ...latestChat,
        title
      });
      
      // Invalida le query per aggiornare l'UI
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // Mostra notifica solo se è il primo cambiamento da "Nuova Chat"
      if (latestChat?.title === "Nuova Chat") {
        toast({
          title: "Titolo generato",
          description: `Il titolo della chat è stato impostato a "${title}"`,
        });
      }
      
      // Forza un aggiornamento finale dopo un breve ritardo
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      }, 300);
    } catch (error) {
      console.error(`[Chat ${chatId}] Errore aggiornamento titolo:`, error);
    }
  };
  
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