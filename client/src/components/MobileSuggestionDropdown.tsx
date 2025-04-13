import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ImageIcon, Code2Icon, NotebookTextIcon, FileIcon, PlusIcon, MoreHorizontalIcon } from "lucide-react";

interface MobileSuggestionDropdownProps {
  insertTemplate: (template: string) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
}

export const MobileSuggestionDropdown: React.FC<MobileSuggestionDropdownProps> = ({
  insertTemplate,
  setWebSearchEnabled
}) => {
  return (
    <div className="flex justify-center mt-1 suggestions-container">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-xs rounded-xl transition-all max-w-[140px] mx-auto"
            style={{ height: "28px", padding: "0 12px" }}
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
            onClick={() => insertTemplate("Descrivi la seguente immagine allegata.")}
          >
            <ImageIcon className="h-3 w-3 mr-2 text-primary" />
            <span>Descrivi immagine</span>
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
  );
};