import React from "react";
import { cn } from "@/lib/utils";
import { useMessageInput } from "./hooks/useMessageInput";
import { MessageForm } from "./MessageForm";
import { MobileSuggestionDropdown } from "./MobileSuggestionDropdown";
import { DesktopSuggestionButtons } from "./DesktopSuggestionButtons";
import { MessageActions } from "./MessageActions";
import { Button } from "@/components/ui/button";
import { GlobeIcon, PaperclipIcon } from "lucide-react";

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
    isSearchingWikipedia,
    textareaRef,
    fileInputRef,
    currentModelSupportsImages,
    currentModelSupportsWeb,
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
    <>  {/* Mobile-fragment wrapper */}
      <div className={cn(
        "border-t border-border bg-background pt-4 pb-2 px-4",
        isMobile ? "message-input-container p-2" : ""
      )}>
        <div className={cn(
          "mx-auto w-full",
          isMobile ? "max-w-full" : "max-w-3xl"
        )}>
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
            isSearchingWikipedia={isSearchingWikipedia}
            isMobile={isMobile}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            isPending={sendMessageMutation.isPending}
            modelSupportsImages={currentModelSupportsImages}
            modelSupportsWeb={currentModelSupportsWeb}
            ref={textareaRef}
          />

          {/* Buttons visible only on large screens */}
          {!isMobile && (
            <div className="my-1.5">
              <DesktopSuggestionButtons 
                setMessage={setMessage}
                setWebSearchEnabled={setWebSearchEnabled}
              />
            </div>
          )}
        </div>
      </div>
      {/* Mobile bottom action row: web search, attach, suggestions */}
      {isMobile && (
        <div className="flex items-center justify-center my-1.5 space-x-2">
          <Button
            type="button"
            variant={webSearchEnabled ? "default" : "ghost"}
            size="icon"
            onClick={toggleWebSearch}
            disabled={!currentModelSupportsWeb || isSearchingWikipedia}
            title={!currentModelSupportsWeb ? "Web search not supported" : webSearchEnabled ? "Disable web search" : "Enable web search"}
          >
            <GlobeIcon className="text-white h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAttachFile}
            title={currentModelSupportsImages ? "Attach image" : "Attach file"}
          >
            <PaperclipIcon className="text-white h-5 w-5" />
          </Button>
          <MobileSuggestionDropdown 
            insertTemplate={insertTemplate}
            setWebSearchEnabled={setWebSearchEnabled}
          />
        </div>
      )}
    </>
  );
}