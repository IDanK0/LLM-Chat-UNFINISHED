import React, { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, GlobeIcon, LoaderIcon, Wand2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageActions } from "./MessageActions";

interface MessageFormProps {
  message: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  webSearchEnabled: boolean;
  toggleWebSearch: () => void;
  handleAttachFile: () => void;
  handleImproveText: () => void;
  isImprovingText: boolean;
  isSearchingWikipedia?: boolean;
  isMobile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPending: boolean;
  modelSupportsImages: boolean;
  modelSupportsWeb: boolean;
}

export const MessageForm = forwardRef<HTMLTextAreaElement, MessageFormProps>(({
  message,
  onSubmit,
  onChange,
  onKeyDown,
  webSearchEnabled,
  toggleWebSearch,
  handleAttachFile,
  handleImproveText,
  isImprovingText,
  isSearchingWikipedia,
  isMobile,
  fileInputRef,
  onFileSelect,
  isPending,
  modelSupportsImages,
  modelSupportsWeb
}, ref) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="bg-[#101c38] border border-primary/30 rounded-xl shadow-lg transition-all duration-300 ease-in-out">
        <div className="flex items-center py-1.5 px-3">
          {/* Show MessageActions only on desktop */}
          {!isMobile && (
            <MessageActions
              isMobile={isMobile}
              webSearchEnabled={webSearchEnabled}
              toggleWebSearch={toggleWebSearch}
              handleAttachFile={handleAttachFile}
              handleImproveText={handleImproveText}
              isImprovingText={isImprovingText}
              isSearchingWikipedia={isSearchingWikipedia}
              hasMessageContent={!!message?.trim()}
              modelSupportsImages={modelSupportsImages}
              modelSupportsWeb={modelSupportsWeb}
            />
          )}
          
          {/* Improve Text button on mobile, left of textarea */}
          {isMobile && (
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
              disabled={!message?.trim() || isImprovingText || isSearchingWikipedia}
              title="Improve text"
            >
              <Wand2Icon className={cn(
                "text-white",
                isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
              )} />
            </Button>
          )}
          
          <Textarea
            placeholder={isImprovingText 
              ? "Improving text..." 
              : "How can I help you today?"}
            className={cn(
              "flex-1 bg-transparent border-0 outline-none shadow-none focus-visible:ring-0 text-sm textarea-glow resize-none",
              `py-2.5 min-h-[36px] transition-all duration-200 max-h-[120px] ${message.trim() ? 'overflow-y-auto' : 'overflow-y-hidden'} flex items-center justify-center`,
              (isImprovingText || isSearchingWikipedia) && "opacity-70",
              isMobile && "message-textarea py-1 min-h-[28px] max-h-[80px]"
            )}
            value={message}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={isImprovingText}
            ref={ref}
            style={{ display: "flex", alignItems: "center" }}
          />
          
          {/* Wikipedia search indicator */}
          {isSearchingWikipedia && webSearchEnabled && (
            <div className="flex items-center justify-center mr-1">
              <div className="flex items-center justify-center bg-primary/10 rounded-full p-1.5">
                <GlobeIcon className="h-3 w-3 text-primary animate-pulse" />
                <LoaderIcon className="h-3 w-3 text-primary ml-1 animate-spin" />
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            size="icon" 
            className={cn(
              "rounded-full bg-primary hover:bg-primary/90 ml-1 transition-all duration-300 transform hover:scale-105",
              isMobile ? "h-6 w-6" : "h-7 w-7"
            )}
            disabled={!message?.trim() || isPending || isImprovingText || isSearchingWikipedia}
          >
            <ArrowRightIcon className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </Button>
        </div>
      </div>
      
      {/* Hidden input for file selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
        accept={modelSupportsImages 
          ? "image/*,.pdf,.doc,.docx,.txt" 
          : ".pdf,.doc,.docx,.txt"}
      />
    </form>
  );
});

MessageForm.displayName = "MessageForm";