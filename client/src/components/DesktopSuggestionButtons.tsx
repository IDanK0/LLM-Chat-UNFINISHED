import React from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Code2Icon, NotebookTextIcon, FileIcon, PlusIcon } from "lucide-react";

interface DesktopSuggestionButtonsProps {
  setMessage: (message: string) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
}

export const DesktopSuggestionButtons: React.FC<DesktopSuggestionButtonsProps> = ({
  setMessage,
  setWebSearchEnabled
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2 justify-center">
      <Button 
        variant="outline" 
        className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
        onClick={() => setMessage("Descrivi la seguente immagine allegata.")}
      >
        <ImageIcon className="h-4 w-4 mr-2 text-primary" />
        <span className="text-white/90">Descrivi immagine</span>
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
  );
};