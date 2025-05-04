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
        onClick={() => setMessage("Describe the attached image.")}
      >
        <ImageIcon className="h-4 w-4 mr-2 text-primary" />
        <span className="text-white/90">Describe image</span>
      </Button>
      <Button 
        variant="outline" 
        className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
        onClick={() => setMessage("Can you write a React code example for a to-do list?")}
      >
        <Code2Icon className="h-4 w-4 mr-2 text-primary" />
        <span className="text-white/90">Code</span>
      </Button>
      <Button 
        variant="outline" 
        className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
        onClick={() => setMessage("Help me create a study plan to learn machine learning in 3 months.")}
      >
        <FileIcon className="h-4 w-4 mr-2 text-primary" />
        <span className="text-white/90">Make a plan</span>
      </Button>
      <Button 
        variant="outline" 
        className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
        onClick={() => {
          setWebSearchEnabled(true);
          setMessage("What are the most recent developments in generative AI?");
        }}
      >
        <NotebookTextIcon className="h-4 w-4 mr-2 text-primary" />
        <span className="text-white/90">News</span>
      </Button>
      <Button 
        variant="outline" 
        className="bg-[#101c38] hover:bg-primary/20 border-primary/20 text-sm h-8 rounded-xl transition-all duration-300 transform hover:scale-105"
        onClick={() => setMessage("What is the difference between machine learning and deep learning?")}
      >
        <PlusIcon className="h-4 w-4 mr-2 text-primary" />
        <span className="text-white/90">More</span>
      </Button>
    </div>
  );
};