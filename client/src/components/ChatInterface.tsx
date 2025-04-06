import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CopyIcon, PencilIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AnimatedText from "./AnimatedText";
import { getSettings } from "@/lib/settingsStore";
interface ChatInterfaceProps {
  chatId: number;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
  });

  // Funzione per copiare il messaggio negli appunti
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(
      () => {
        toast({
          title: "Copiato",
          description: "Il messaggio è stato copiato negli appunti",
        });
      },
      (err) => {
        console.error("Errore durante la copia", err);
        toast({
          title: "Errore",
          description: "Impossibile copiare il messaggio",
          variant: "destructive",
        });
      }
    );
  };

  // Inizia modifica messaggio
  const handleEditStart = (message: Message) => {
    setEditingMessage(message);
    setEditedContent(message.content);
    setIsEditDialogOpen(true);
  };

  // Simula la salvataggio del messaggio modificato (in una app reale, sarà necessario un endpoint API)
  const handleSaveEdit = () => {
    if (editingMessage && editedContent.trim()) {
      // In una app reale, qui chiameremmo un'API per aggiornare il messaggio
      // Qui simuliamo l'aggiornamento aggiornando la cache locale
      if (editingMessage && messages) {
        const updatedMessages = messages.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, content: editedContent } 
            : msg
        );

        // Aggiorniamo manualmente la cache di React Query
        queryClient.setQueryData([`/api/chats/${chatId}/messages`], updatedMessages);
      }

      toast({
        title: "Modifica salvata",
        description: "Il messaggio è stato modificato con successo"
      });
      setIsEditDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start mb-6">
              <Skeleton className="h-8 w-8 rounded-full mr-4" />
              <div className="space-y-2">
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
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Mostra i messaggi della chat se ce ne sono */}
        {messages.length > 0 && messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "relative flex items-start mb-6 p-3 rounded-xl transition-all duration-300 group",
              message.isUserMessage 
                ? "hover:bg-primary/5" 
                : "bg-[#101c38] border border-primary/30 shadow-md hover:shadow-lg hover:border-primary/40"
            )}
          >
            <div className={cn(
              "flex-shrink-0 mr-4 w-8 h-8 rounded-full flex items-center justify-center text-sm self-start mt-0.5",
              message.isUserMessage 
                ? "bg-blue-500/20 text-blue-500" 
                : "bg-primary/30 text-primary"
            )}>
              {message.isUserMessage ? "Tu" : "AI"}
            </div>
            <div className="flex-1 flex items-center">
              {message.isUserMessage ? (
                <p className={cn(
                  "text-foreground leading-relaxed py-1 break-all whitespace-pre-wrap",
                  "text-white/90"
                )}>
                  {message.content}
                </p>
              ) : (
                <AnimatedText
                  text={message.content}
                  className={cn(
                    "text-foreground leading-relaxed py-1 break-all whitespace-pre-wrap",
                    "text-white"
                  )}
                />
              )}
            </div>
            {/* Pulsanti di azione per il messaggio */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary/20"
                onClick={() => handleEditStart(message)}
                title="Modifica messaggio"
              >
                <PencilIcon className="h-3.5 w-3.5 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary/20"
                onClick={() => copyToClipboard(message.content)}
                title="Copia messaggio"
              >
                <CopyIcon className="h-3.5 w-3.5 text-primary" />
              </Button>
            </div>
          </div>
        ))}

        {/* Messaggio di benvenuto mostrato solo quando non ci sono messaggi */}
        {messages.length === 0 && (
          <div className="relative flex items-start mb-6 p-3 rounded-xl bg-[#101c38] border border-primary/30 shadow-md hover:shadow-lg hover:border-primary/40 transition-all duration-300 group">
            <div className="flex-shrink-0 mr-4 w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-sm text-primary self-start mt-0.5">
              AI
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <AnimatedText
                text="Buon pomeriggio, come posso essere utile?"
                className="text-lg font-medium text-white leading-relaxed break-words whitespace-pre-wrap"
              />
            </div>

            {/* Pulsanti di azione per il messaggio */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary/20"
                onClick={() => {
                  setEditingMessage({
                    id: 0,
                    chatId: chatId,
                    content: "Buon pomeriggio, come posso essere utile?",
                    isUserMessage: false,
                    createdAt: new Date().toISOString()
                  });
                  setEditedContent("Buon pomeriggio, come posso essere utile?");
                  setIsEditDialogOpen(true);
                }}
                title="Modifica messaggio"
              >
                <PencilIcon className="h-3.5 w-3.5 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-primary/20"
                onClick={() => copyToClipboard("Buon pomeriggio, come posso essere utile?")}
                title="Copia messaggio"
              >
                <CopyIcon className="h-3.5 w-3.5 text-primary" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog per modificare un messaggio */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-sidebar border-primary/30 text-white">
          <DialogHeader>
            <DialogTitle>Modifica messaggio</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[100px] mt-2 bg-white/10 border-primary/30 text-white textarea-glow"
          />
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="border-primary/30 text-white hover:bg-primary/20"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={!editedContent.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Controllo accessibilità per animazioni */}
      {getSettings().stream && (
        <div className="fixed bottom-4 right-4 z-10 opacity-70 hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            className="bg-sidebar/80 border-primary/30 text-white hover:bg-primary/20"
            onClick={() => {
              const settings = getSettings();
              settings.stream = !settings.stream;
              localStorage.setItem("apiSettings", JSON.stringify(settings));
              window.location.reload();
            }}
          >
            {getSettings().stream ? "Disattiva animazioni" : "Attiva animazioni"}
          </Button>
        </div>
      )}
    </div>
  );
}