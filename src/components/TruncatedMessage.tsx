import React from 'react';
import { Button } from '@/components/ui/button';
import { Expand } from 'lucide-react';
import { MarkdownContent } from '@/components/common';

interface TruncatedMessageProps {
  content: string;
  onViewFull: () => void;
  maxLength?: number;
}

const TruncatedMessage: React.FC<TruncatedMessageProps> = ({ 
  content, 
  onViewFull, 
  maxLength = 300 
}) => {
  const getTruncatedContent = () => {
    if (content.length <= maxLength) return content;
    
    // Try to truncate at a sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    // Use the latest boundary found
    const cutPoint = Math.max(lastSentence, lastNewline);
    if (cutPoint > maxLength * 0.5) {
      return content.substring(0, cutPoint + 1);
    }
    
    // Fallback to word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return content.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
  };

  const truncatedContent = getTruncatedContent();

  return (
    <div className="space-y-3">
      <MarkdownContent content={truncatedContent} compact className="text-left" />
      
      {content.length > maxLength && (
        <Button
          variant="outline"
          size="sm"
          onClick={onViewFull}
          className="text-xs h-7 px-3"
        >
          <Expand className="h-3 w-3 mr-1" />
          View Full Response
        </Button>
      )}
    </div>
  );
};

export default TruncatedMessage;
