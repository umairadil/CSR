"use client";

import { motion } from 'framer-motion';
import { Message } from '@/lib/types/chat';
import { AttachmentPreview } from './AttachmentPreview';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showTime: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  isFirstInGroup,
  isLastInGroup,
  showTime,
}: MessageBubbleProps) {
  const getBubbleClasses = () => {
    const baseClasses = "px-4 py-2 rounded-2xl max-w-full break-words transition-all duration-200";
    
    if (isOwn) {
      return cn(
        baseClasses,
        "bg-blue-600 text-white",
        isFirstInGroup ? "rounded-br-md" : "rounded-r-md",
        isLastInGroup ? "rounded-tr-md" : "rounded-r-md",
        message.isOptimistic && "opacity-70",
        message.hasError && "bg-red-500"
      );
    } else {
      return cn(
        baseClasses,
        "bg-white text-gray-900 border border-gray-200",
        isFirstInGroup ? "rounded-bl-md" : "rounded-l-md",
        isLastInGroup ? "rounded-tl-md" : "rounded-l-md",
        message.isOptimistic && "opacity-70"
      );
    }
  };

  const renderContent = () => {
    if (message.messageType === 'IMAGE' && message.attachments?.length) {
      return (
        <div className="space-y-2">
          {message.attachments.map((attachment, index) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              isOwn={isOwn}
            />
          ))}
          {message.content && (
            <div className="text-sm leading-relaxed">
              {message.content}
            </div>
          )}
        </div>
      );
    }

    if (message.messageType === 'FILE' && message.attachments?.length) {
      return (
        <div className="space-y-2">
          {message.attachments.map((attachment, index) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              isOwn={isOwn}
            />
          ))}
          {message.content && (
            <div className="text-sm leading-relaxed">
              {message.content}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {message.content}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative",
        message.isOptimistic && "opacity-70",
        message.hasError && "opacity-50"
      )}
    >
      <div className={getBubbleClasses()}>
        {renderContent()}
        
        {/* Status indicators */}
        {isOwn && (
          <div className="flex items-center justify-end mt-1 gap-1">
            {message.isOptimistic && (
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
            )}
            {message.isRead && !message.isOptimistic && (
              <div className="w-2 h-2 bg-blue-300 rounded-full" />
            )}
            {message.hasError && (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
        )}
      </div>

      {/* Error retry button */}
      {message.hasError && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-6 right-0 text-xs text-red-500 hover:text-red-700 underline"
          onClick={() => {
            // Retry logic would go here
            console.log('Retry message:', message.id);
          }}
        >
          Retry
        </motion.button>
      )}
    </motion.div>
  );
}
