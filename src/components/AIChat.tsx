import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIChat } from '@/hooks/useAIChat';
import { Send, Loader2, Bot, User, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaperContext {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  exam_type: string;
  description?: string | null;
}

interface AIChatProps {
  paperContext?: PaperContext;
  className?: string;
}

export function AIChat({ paperContext, className }: AIChatProps) {
  const { messages, isLoading, sendMessage, clearChat } = useAIChat(paperContext);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedPrompts = paperContext ? [
    `Explain the key concepts in ${paperContext.subject}`,
    `What topics should I study for ${paperContext.exam_type.replace('_', ' ')}?`,
    'Give me tips to solve problems faster',
    'Explain any difficult concept from this paper',
  ] : [
    'How can I improve my study habits?',
    'What are effective exam preparation strategies?',
    'Explain a difficult concept in mathematics',
    'Help me create a study schedule',
  ];

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Study Assistant
        </CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 h-[300px] pr-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Hi! I'm your AI study assistant. I can help you understand concepts, 
                    explain solutions, and give study tips.
                    {paperContext && (
                      <span> Ask me anything about <strong>{paperContext.subject}</strong>!</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5 px-3"
                      onClick={() => {
                        setInput(prompt);
                        textareaRef.current?.focus();
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    message.role === 'user' ? 'bg-primary/10' : 'bg-secondary/50'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                    message.role === 'user' ? 'bg-primary' : 'bg-primary/20'
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="text-xs font-medium text-muted-foreground">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
