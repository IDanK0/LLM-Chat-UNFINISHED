import { useQuery } from "@tanstack/react-query";
import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatInterfaceProps {
  chatId: number;
}

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chatId}/messages`],
  });
  
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
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <p className="text-muted-foreground text-center">
              Non ci sono messaggi. Inizia una conversazione!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start mb-6 p-3 rounded-xl transition-all duration-300",
                message.isUserMessage 
                  ? "hover:bg-primary/5" 
                  : "bg-[#101c38] border border-primary/30 shadow-md hover:shadow-lg hover:border-primary/40"
              )}
            >
              <div className={cn(
                "flex-shrink-0 mr-4 w-8 h-8 rounded-full flex items-center justify-center text-sm",
                message.isUserMessage 
                  ? "bg-blue-500/20 text-blue-500" 
                  : "bg-primary/30 text-primary"
              )}>
                {message.isUserMessage ? "Tu" : "AI"}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-foreground leading-relaxed",
                  message.isUserMessage ? "text-white/90" : "text-white"
                )}>
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        
        {messages.length === 0 && (
          <div className="flex items-start mb-6 p-3 rounded-xl bg-[#101c38] border border-primary/30 shadow-md hover:shadow-lg hover:border-primary/40 transition-all duration-300">
            <div className="flex-shrink-0 mr-4 w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-sm text-primary">
              AI
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-white leading-relaxed">
                Buon pomeriggio, come posso essere utile oggi?
              </p>
              <p className="text-white/70 text-sm mt-2">
                Puoi chiedermi qualsiasi cosa in italiano. Sono qui per aiutarti a trovare informazioni,
                scrivere contenuti o risolvere problemi.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
