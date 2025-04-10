
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, MessageSquare } from 'lucide-react';

interface EmptyAnalysisProps {
  goToStep: (step: number) => void;
}

export const EmptyAnalysis: React.FC<EmptyAnalysisProps> = ({ goToStep }) => {
  return (
    <Card className="mb-12 overflow-hidden border-2 border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-gray-600" />
          Conversation Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">No conversation to analyze</p>
          <p className="text-gray-500 mb-6">Start a conversation between AI agents first to see analysis.</p>
          <Button onClick={() => goToStep(2)} variant="outline">
            Go to Agent Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
