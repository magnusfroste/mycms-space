
import React from 'react';

const N8nTest = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            N8N Hosted Chat Test
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Testing N8N Hosted Chat Solution
            </h2>
            <p className="text-gray-600 mb-6">
              This page tests the n8n hosted chat by embedding it directly using an iframe. 
              This should bypass all the custom ChatWidget complexity and use the hosted solution directly.
            </p>
            
            {/* Direct iframe embed of the n8n hosted chat */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src="https://agent.froste.eu/webhook/3092ebad-b671-44ad-8b3d-b4d12b7ea76b/chat"
                width="100%"
                height="600"
                style={{
                  border: 'none',
                  minHeight: '600px'
                }}
                title="N8N Hosted Chat"
                allow="microphone; camera"
              />
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Test Notes:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• If this loads and works, the webhook URL is functional</li>
                <li>• If this is more responsive than our ChatWidget, we should consider switching</li>
                <li>• This bypasses all our custom styling and complexity</li>
                <li>• Check if speech synthesis and other features are available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nTest;
