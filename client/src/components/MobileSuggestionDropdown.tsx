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
            <span className="text-white/90 text-xs">Suggestions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="center" 
          side="top"
          className="bg-[#101c38] border-primary/30 w-[250px] rounded-xl shadow-xl dropdown-content"
        >
          <DropdownMenuItem 
            className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
            onClick={() => insertTemplate("Describe the attached image.")}
          >
            <ImageIcon className="h-3 w-3 mr-2 text-primary" />
            <span>Describe image</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
            onClick={() => insertTemplate("Can you write a React code example for a to-do list?")}
          >
            <Code2Icon className="h-3 w-3 mr-2 text-primary" />
            <span>Code</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
            onClick={() => insertTemplate("Help me create a study plan to learn machine learning in 3 months.")}
          >
            <FileIcon className="h-3 w-3 mr-2 text-primary" />
            <span>Make a plan</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
            onClick={() => {
              setWebSearchEnabled(true);
              insertTemplate("What are the most recent developments in generative AI?");
            }}
          >
            <NotebookTextIcon className="h-3 w-3 mr-2 text-primary" />
            <span>News</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-white hover:bg-primary/20 focus:bg-primary/20 rounded-lg py-1.5 text-xs"
            onClick={() => insertTemplate("What is the difference between machine learning and deep learning?")}
          >
            <PlusIcon className="h-3 w-3 mr-2 text-primary" />
            <span>More</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};