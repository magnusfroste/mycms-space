
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { parseMarkdown } from '@/lib/markdown';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface AppleChatProps {
  webhookUrl: string;
  fullPage?: boolean;
  initialMessages?: Message[];
  resetTrigger?: number;
  onMessagesChange?: (messages: Message[]) => void;
  initialSessionId?: string;
  onSessionIdChange?: (id: string) => void;
  skipWebhook?: boolean;
}

const AppleChat: React.FC<AppleChatProps> = ({ 
  webhookUrl, 
  fullPage = false,
  initialMessages,
  resetTrigger = 0,
  onMessagesChange,
  initialSessionId,
  onSessionIdChange,
  skipWebhook = false
}) => {
  const getInitialMessages = () => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [
      {
        id: '1',
        text: "Hi! I'm Magnet, Magnus' digital twin. Ask me anything about innovation, product strategy or AI!",
        isUser: false
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => 
    initialSessionId ?? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessageRef = useRef(false);

  // Reset chat when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setMessages([
        {
          id: '1',
          text: "Hi! I'm Magnet, Magnus' digital twin. Ask me anything about innovation, product strategy or AI!",
          isUser: false
        }
      ]);
      setInputValue('');
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      hasSentInitialMessageRef.current = false;
    }
  }, [resetTrigger]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Notify parent of messages changes
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages]); // Only depend on messages, not the callback

  // Notify parent of sessionId changes
  useEffect(() => {
    if (onSessionIdChange) {
      onSessionIdChange(sessionId);
    }
  }, [sessionId, onSessionIdChange]);

  // Auto-send last user message if initializing with messages
  useEffect(() => {
    // Only run once on mount if we have initialMessages
    if (initialMessages && initialMessages.length > 0 && !hasSentInitialMessageRef.current) {
      const lastMessage = initialMessages[initialMessages.length - 1];
      
      // If last message is from user, send it to webhook
      if (lastMessage.isUser && lastMessage.text) {
        hasSentInitialMessageRef.current = true;
        console.log('Auto-sending initial user message:', lastMessage.text);
        
        // Wait a brief moment to ensure component is fully mounted
        setTimeout(() => {
          sendMessageWithText(lastMessage.text);
        }, 100);
      }
    }
  }, []); // Empty deps - only run once on mount

  const sendPrefilledMessage = async (message: string) => {
    if (isLoading) return;
    
    setInputValue(message);
    
    // If skipWebhook is true, just add message without sending
    if (skipWebhook) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message,
        isUser: true
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      return;
    }
    
    // Small delay to show the message being set, then send it
    setTimeout(() => {
      sendMessageWithText(message);
    }, 100);
  };

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true
    };

    console.log('Sending message:', messageText);
    console.log('Webhook URL:', webhookUrl);
    console.log('Session ID:', sessionId);

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const requestBody = { 
        message: messageText,
        sessionId: sessionId
      };
      console.log('Request body:', JSON.stringify(requestBody));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to send message'}`);
      }

      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response from webhook');
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      let botResponse = "I'm sorry, I couldn't process that request.";
      
      if (Array.isArray(data) && data.length > 0) {
        botResponse = data[0]?.output || data[0]?.message || data[0];
      } else if (data.output) {
        botResponse = data.output;
      } else if (data.message) {
        botResponse = data.message;
      } else if (typeof data === 'string') {
        botResponse = data;
      } else {
        console.warn('Unexpected response format:', data);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${errorMessage}. Please check the webhook configuration.`,
        isUser: false
      };
      
      setMessages(prev => [...prev, errorBotMessage]);
      
      toast({
        title: "Error",
        description: `Failed to send message: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "Toolbox", message: "tools I have access to" },
    { label: "AI Strategy", message: "outline an ai strategy" },
    { label: "Magnus Resume", message: "show magnus resume" },
    { label: "AI Agents", message: "tell me about ai agents" }
  ];

  return (
    <div className={fullPage ? "flex flex-col h-full" : "max-w-3xl mx-auto"}>
      <div className={fullPage ? "flex flex-col flex-1 glass-card overflow-hidden shadow-apple" : "glass-card overflow-hidden shadow-apple"}>
        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className={fullPage ? "relative z-0 flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-muted/50 to-background scroll-smooth" : "relative z-0 h-80 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-muted/50 to-background scroll-smooth"}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              data-user-message={message.isUser ? 'true' : 'false'}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-apple-blue text-white rounded-br-md'
                    : 'bg-card border border-border text-foreground rounded-bl-md shadow-sm'
                }`}
              >
                {message.isUser ? (
                  <p className="text-sm leading-relaxed text-left">{message.text}</p>
                ) : (
                  <div 
                    className="text-sm leading-relaxed prose prose-sm max-w-none text-left"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }}
                  />
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-apple-purple" />
                  <span className="text-sm text-muted-foreground">Magnet is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="relative z-10 p-6 bg-card border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about innovation, strategy, or AI..."
                className="w-full bg-muted border border-input rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-apple-blue hover:bg-blue-600 text-white rounded-full p-3 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Action Buttons - moved here */}
          <div className="relative z-10 mt-4 pt-4 border-t border-border">
            <div className="flex gap-2 justify-center flex-wrap">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  onClick={() => sendPrefilledMessage(action.message)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="hover:bg-muted hover:text-primary text-xs px-3 py-1 h-7"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleChat;
