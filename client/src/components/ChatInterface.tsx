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
            <div key={message.id} className="flex items-start mb-6">
              <div className={cn(
                "flex-shrink-0 mr-4 w-8 h-8 rounded-full flex items-center justify-center text-sm",
                message.isUserMessage 
                  ? "bg-blue-500/20 text-blue-500" 
                  : "bg-primary/20 text-primary"
              )}>
                {message.isUserMessage ? "Tu" : "AI"}
              </div>
              <div>
                <p className="text-foreground">{message.content}</p>
              </div>
            </div>
          ))
        )}
        
        {messages.length === 0 && (
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 mr-4 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm text-primary">
              AI
            </div>
            <div>
              <p className="text-lg font-medium">Buon pomeriggio, come posso essere utile?</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
