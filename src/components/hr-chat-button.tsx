'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PERSONAS = [
  { id: 'recruiter', name: 'Sarah', role: 'Senior Recruiter', icon: '🎯', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
  { id: 'compensation', name: 'Marcus', role: 'Comp Specialist', icon: '💰', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900' },
  { id: 'career_coach', name: 'Dr. Priya', role: 'Career Coach', icon: '🧭', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900' },
  { id: 'hr_legal', name: 'James', role: 'HR & Legal', icon: '⚖️', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  { id: 'culture', name: 'Elena', role: 'Culture Expert', icon: '🌟', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900' },
  { id: 'founder', name: 'Alex', role: 'Founder Advisor', icon: '🚀', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900' },
];

export function HRChatButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('recruiter');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = useCallback(async () => {
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/hr-chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          persona: selectedPersona,
        }),
      });

      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: 'Server returned an invalid response.' }; }

      if (!res.ok) {
        toast({ title: t('toast.chatFailed'), description: data.error, variant: 'destructive' });
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e: any) {
      toast({ title: t('toast.chatFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [input, messages, sending, selectedPersona, toast, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentPersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all animate-fade-in-up p-0"
          size="icon"
          aria-label={t('chat.title')}
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          {!open && messages.length === 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            {t('chat.title')}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{t('chat.subtitle')}</p>
        </SheetHeader>

        {/* Persona selector */}
        <div className="px-3 py-2 border-b overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPersona(p.id);
                  setMessages([]);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all whitespace-nowrap ${
                  p.id === selectedPersona
                    ? p.color + ' ring-1 ring-foreground/20'
                    : 'bg-background text-muted-foreground hover:bg-accent'
                }`}
              >
                <span className="text-sm">{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full border-2 ${currentPersona.color}`}>
                  <span className="text-2xl">{currentPersona.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{currentPersona.name}</p>
                  <p className="text-xs text-muted-foreground">{currentPersona.role}</p>
                </div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {t('chat.welcome')}
                </p>
                {/* Suggested questions */}
                <div className="space-y-1.5 max-w-xs mx-auto">
                  {getSuggestedQuestions(selectedPersona, t).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background'
                    : currentPersona.color
                }`}>
                  {msg.role === 'user' ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-sm">{currentPersona.icon}</span>
                  )}
                </div>
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-muted'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-2">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${currentPersona.color}`}>
                  <span className="text-sm">{currentPersona.icon}</span>
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <PugLoader size="sm" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-3 space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={sending}
          />
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px]">
              {currentPersona.icon} {currentPersona.name}
            </Badge>
            <Button
              size="sm"
              onClick={send}
              disabled={!input.trim() || sending}
              className="h-8"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {t('chat.send')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getSuggestedQuestions(persona: string, t: (k: string) => string): string[] {
  const questions: Record<string, string[]> = {
    recruiter: [
      'What do recruiters look for in a senior resume?',
      'How do I explain a career gap?',
      'What questions should I ask in a recruiter screen?',
    ],
    compensation: [
      'What\'s a fair salary for a senior engineer at a Series B startup?',
      'How should I evaluate my equity offer?',
      'What\'s included in total compensation?',
    ],
    career_coach: [
      'I feel stuck in my career. How do I figure out what\'s next?',
      'How do I overcome imposter syndrome?',
      'When is it time to leave my current role?',
    ],
    hr_legal: [
      'What should I look for in my employment contract?',
      'Is my non-compete enforceable?',
      'What\'s the difference between contractor and employee?',
    ],
    culture: [
      'How do I assess company culture during interviews?',
      'What are red flags in a job description?',
      'How do I know if a team has psychological safety?',
    ],
    founder: [
      'Should I join a pre-seed startup?',
      'What equity should I expect as employee #5?',
      'What questions should I ask the founder?',
    ],
  };
  return questions[persona] || questions.recruiter;
}
