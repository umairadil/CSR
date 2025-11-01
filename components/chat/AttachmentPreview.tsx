"use client";

import { motion } from 'framer-motion';
import { Attachment } from '@/lib/types/chat';
import { Download, File, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  attachment: Attachment;
  isOwn: boolean;
}

export function AttachmentPreview({ attachment, isOwn }: AttachmentPreviewProps) {
  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';
  const isDocument = attachment.mimeType.includes('document') || attachment.mimeType.includes('text');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="w-4 h-4" />;
    if (isPdf) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName;
    link.click();
  };

  if (isImage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group"
      >
        <img
          src={attachment.url}
          alt={attachment.originalName}
          className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(attachment.url, '_blank')}
        />
        
        {/* Download overlay */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={handleDownload}
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
        >
          <Download className="w-4 h-4" />
        </motion.button>

        {/* File info */}
        <div className="mt-1 text-xs text-gray-500">
          {attachment.originalName} • {formatFileSize(attachment.size)}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isOwn 
          ? "bg-blue-500 bg-opacity-20 border-blue-300" 
          : "bg-gray-100 border-gray-200 hover:bg-gray-200"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
      )}>
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {attachment.originalName}
        </div>
        <div className="text-xs text-gray-500">
          {formatFileSize(attachment.size)}
        </div>
      </div>

      <button
        onClick={handleDownload}
        className={cn(
          "p-2 rounded-lg transition-colors",
          isOwn 
            ? "text-blue-600 hover:bg-blue-100" 
            : "text-gray-500 hover:bg-gray-200"
        )}
      >
        <Download className="w-4 h-4" />
      </button>
    </motion.div>
  );
}


