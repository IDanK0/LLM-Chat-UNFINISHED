import React from "react";
import { cn } from "@/lib/utils";
import { useMessageInput } from "./hooks/useMessageInput";
import { MessageForm } from "./MessageForm";
import { MobileSuggestionDropdown } from "./MobileSuggestionDropdown";
import { DesktopSuggestionButtons } from "./DesktopSuggestionButtons";

interface MessageInputProps {
  chatId: string;
  selectedModel: string;
}

export default function MessageInput({ chatId, selectedModel }: MessageInputProps) {
  const {
    message,
    setMessage,
    webSearchEnabled,
    setWebSearchEnabled,
    isImprovingText,
    textareaRef,
    fileInputRef,
    handleTextareaChange,
    handleKeyDown,
    handleSendMessage,
    toggleWebSearch,
    handleAttachFile,
    handleFileSelect,
    handleImproveText,
    insertTemplate,
    sendMessageMutation,
    isMobile
  } = useMessageInput({ chatId, selectedModel });

  return (
    <div className={cn(
      "border-t border-border bg-background p-4",
      isMobile && "message-input-container p-2"
    )}>
      <div className="max-w-3xl mx-auto">
        <MessageForm
          message={message}
          onSubmit={handleSendMessage}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          webSearchEnabled={webSearchEnabled}
          toggleWebSearch={toggleWebSearch}
          handleAttachFile={handleAttachFile}
          handleImproveText={handleImproveText}
          isImprovingText={isImprovingText}
          isMobile={isMobile}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          isPending={sendMessageMutation.isPending}
          ref={textareaRef}
        />

        {/* Menu a dropdown per dispositivi mobili */}
        {isMobile && (
          <MobileSuggestionDropdown 
            insertTemplate={insertTemplate}
            setWebSearchEnabled={setWebSearchEnabled}
          />
        )}

        {/* Bottoni visibili solo su schermi grandi */}
        {!isMobile && (
          <DesktopSuggestionButtons 
            setMessage={setMessage}
            setWebSearchEnabled={setWebSearchEnabled}
          />
        )}
      </div>
    </div>
  );
}