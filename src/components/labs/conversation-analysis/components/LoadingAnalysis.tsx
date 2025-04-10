
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingAnalysisProps {
  analyzerModel?: string;
}

export const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ analyzerModel }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
      <p className="text-gray-600">
        Analyzing conversation
        {analyzerModel ? ` with ${analyzerModel.split('/').pop()?.replace(/:.*$/, '')}` : ''}...
      </p>
    </div>
  );
};
