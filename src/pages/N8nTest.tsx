
import React, { useState, useRef } from 'react';

const N8nTest = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    console.log('N8N iframe loaded successfully');
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    console.log('N8N iframe failed to load');
    setIframeError(true);
  };

  const testDirectUrl = () => {
    window.open('https://agent.froste.eu/webhook/3092ebad-b671-44ad-8b3d-b4d12b7ea76b/chat', '_blank');
  };

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

            {/* Status indicators */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm">
                <strong>Iframe Status:</strong> 
                {iframeLoaded ? ' ✅ Loaded' : iframeError ? ' ❌ Error' : ' ⏳ Loading...'}
              </p>
              <button 
                onClick={testDirectUrl}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Test Direct URL in New Tab
              </button>
            </div>
            
            {/* Direct iframe embed of the n8n hosted chat */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src="https://agent.froste.eu/webhook/3092ebad-b671-44ad-8b3d-b4d12b7ea76b/chat"
                width="100%"
                height="600"
                style={{
                  border: 'none',
                  minHeight: '600px'
                }}
                title="N8N Hosted Chat"
                allow="microphone; camera"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Test Notes:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• If this loads and works, the webhook URL is functional</li>
                <li>• If this is more responsive than our ChatWidget, we should consider switching</li>
                <li>• This bypasses all our custom styling and complexity</li>
                <li>• Check if speech synthesis and other features are available</li>
                <li>• The "firstEntryJson" error might indicate a CORS or initialization issue</li>
              </ul>
            </div>

            {/* Debug section */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Debugging Info:</h3>
              <p className="text-yellow-700 text-sm mb-2">
                Current URL: {window.location.href}
              </p>
              <p className="text-yellow-700 text-sm mb-2">
                Target URL: https://agent.froste.eu/webhook/3092ebad-b671-44ad-8b3d-b4d12b7ea76b/chat
              </p>
              <p className="text-yellow-700 text-sm">
                If the iframe shows nothing or errors, try the "Test Direct URL" button to see if the chat works in a new tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nTest;
