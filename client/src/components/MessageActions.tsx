import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlobeIcon, PaperclipIcon, Wand2Icon } from "lucide-react";

interface MessageActionsProps {
  isMobile: boolean;
  webSearchEnabled: boolean;
  toggleWebSearch: () => void;
  handleAttachFile: () => void;
  handleImproveText: () => void;
  isImprovingText: boolean;
  isSearchingWikipedia?: boolean;
  hasMessageContent: boolean;
  modelSupportsImages: boolean;
  modelSupportsWeb: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  isMobile,
  webSearchEnabled,
  toggleWebSearch,
  handleAttachFile,
  handleImproveText,
  isImprovingText,
  isSearchingWikipedia,
  hasMessageContent,
  modelSupportsImages,
  modelSupportsWeb
}) => {
  return (
    <div className="flex items-center space-x-1 mr-1">
      <Button
        type="button"
        variant={webSearchEnabled ? "default" : "ghost"}
        size="icon"
        className={cn(
          "rounded-full transition-all duration-300",
          webSearchEnabled ? 'bg-primary/80 text-white shadow-md' : 'hover:bg-primary/20',
          isSearchingWikipedia && webSearchEnabled && "animate-pulse",
          isMobile ? "h-6 w-6" : "h-7 w-7"
        )}
        onClick={toggleWebSearch}
        disabled={!modelSupportsWeb || isSearchingWikipedia}
        title={!modelSupportsWeb
          ? "Web search not supported by this model"
          : webSearchEnabled
            ? "Disable Wikipedia search"
            : "Enable Wikipedia search to enrich responses with updated information"}
      >
        <GlobeIcon className={cn("text-white", isMobile ? "h-3 w-3" : "h-3.5 w-3.5")} />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full hover:bg-primary/20 transition-all duration-300",
          isMobile ? "h-6 w-6" : "h-7 w-7"
        )}
        onClick={handleAttachFile}
        title={modelSupportsImages 
          ? "Attach files or images" 
          : "Attach files (this model doesn't support images)"}
      >
        <PaperclipIcon className={cn(
          "text-white",
          isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
        )} />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full hover:bg-primary/20 transition-all duration-300",
          isMobile ? "h-6 w-6" : "h-7 w-7",
          isImprovingText && "animate-pulse bg-primary/20"
        )}
        onClick={handleImproveText}
        disabled={!hasMessageContent || isImprovingText || isSearchingWikipedia}
      >
        <Wand2Icon className={cn(
          "text-white",
          isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
        )} />
      </Button>
    </div>
  );
};