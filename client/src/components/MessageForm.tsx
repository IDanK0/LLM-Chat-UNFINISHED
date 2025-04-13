import React, { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
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
  isMobile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPending: boolean;
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
  isMobile,
  fileInputRef,
  onFileSelect,
  isPending
}, ref) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="bg-[#101c38] border border-primary/30 rounded-xl shadow-lg transition-all duration-300 ease-in-out">
        <div className="flex items-center p-1.5">
          {/* Mostra MessageActions solo su desktop */}
          {!isMobile && (
            <MessageActions
              isMobile={isMobile}
              webSearchEnabled={webSearchEnabled}
              toggleWebSearch={toggleWebSearch}
              handleAttachFile={handleAttachFile}
              handleImproveText={handleImproveText}
              isImprovingText={isImprovingText}
              hasMessageContent={!!message?.trim()}
            />
          )}
          
          <Textarea
            placeholder={isImprovingText ? "Miglioramento in corso..." : "Come posso aiutarti oggi?"}
            className={cn(
              "flex-1 bg-transparent border-0 outline-none shadow-none focus-visible:ring-0 text-sm textarea-glow resize-none",
              "py-2.5 min-h-[36px] transition-all duration-200 max-h-[120px] overflow-y-auto flex items-center justify-center",
              isImprovingText && "opacity-70",
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
          
          <Button 
            type="submit" 
            size="icon" 
            className={cn(
              "rounded-full bg-primary hover:bg-primary/90 ml-1 transition-all duration-300 transform hover:scale-105",
              isMobile ? "h-6 w-6" : "h-7 w-7"
            )}
            disabled={!message?.trim() || isPending || isImprovingText}
          >
            <ArrowRightIcon className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </Button>
        </div>
      </div>
      
      {/* Input nascosto per la selezione dei file */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </form>
  );
});

MessageForm.displayName = "MessageForm";