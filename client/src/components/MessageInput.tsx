import React from "react";
import { cn } from "@/lib/utils";
import { useMessageInput } from "./hooks/useMessageInput";
import { MessageForm } from "./MessageForm";
import { MobileSuggestionDropdown } from "./MobileSuggestionDropdown";
import { DesktopSuggestionButtons } from "./DesktopSuggestionButtons";
import { MessageActions } from "./MessageActions";

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
    currentModelSupportsImages, // Nuova proprietà da useMessageInput
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
          modelSupportsImages={currentModelSupportsImages} // Passiamo questa proprietà
          ref={textareaRef}
        />

        {/* Contenitore per i pulsanti mobili che appaiono sotto la textbox */}
        {isMobile && (
          <div className="flex items-center justify-center mt-1 space-x-2">
            {/* Mobile Message Actions (pulsanti ricerca, allegati, improving) */}
            <div className="flex items-center">
              <MessageActions
                isMobile={isMobile}
                webSearchEnabled={webSearchEnabled}
                toggleWebSearch={toggleWebSearch}
                handleAttachFile={handleAttachFile}
                handleImproveText={handleImproveText}
                isImprovingText={isImprovingText}
                hasMessageContent={!!message?.trim()}
                modelSupportsImages={currentModelSupportsImages} // Passiamo questa proprietà
              />
            </div>
            
            {/* Menu a dropdown per suggerimenti su dispositivi mobili */}
            <MobileSuggestionDropdown 
              insertTemplate={insertTemplate}
              setWebSearchEnabled={setWebSearchEnabled}
            />
          </div>
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