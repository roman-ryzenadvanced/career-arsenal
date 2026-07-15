'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles, Send, Loader2, Eye, EyeOff, ExternalLink, ArrowRight,
  Bot, FileText, Briefcase, MessageCircle, Check, ChevronDown, ChevronUp,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { LOCALES } from '@/lib/i18n';
import { PugLoader } from '@/components/pug-loader';

interface LoginScreenProps {
  onLoggedIn: () => void;
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const { t, locale, setLocale } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<'choice' | 'login' | 'signup'>('choice');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const login = async () => {
    if (!token.trim() || !token.includes(':')) {
      toast({ title: t('auth.invalidToken'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('auth.loginFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      toast({
        title: data.isNewUser ? t('auth.welcomeNew') : t('auth.welcomeBack'),
        description: data.isNewUser
          ? t('auth.accountCreated', { bot: '@' + data.user.botUsername })
          : t('auth.loggedInAs', { bot: '@' + data.user.botUsername }),
      });
      onLoggedIn();
    } catch (e: any) {
      toast({ title: t('auth.loginFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background relative">
      {/* Language picker — top right */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2" aria-label="Language">
              <Globe className="h-4 w-4" />
              <span className="text-base leading-none">{LOCALES.find(l => l.code === locale)?.flag}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {LOCALES.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`cursor-pointer gap-2 ${l.code === locale ? 'font-semibold bg-accent' : ''}`}
              >
                <span className="text-base">{l.flag}</span>
                <span>{l.label}</span>
                {l.code === locale && <Check className="h-3.5 w-3.5 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logo + title */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background mb-4">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Career Arsenal</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {t('auth.subtitle')}
        </p>
      </div>

      {/* Choice screen */}
      {mode === 'choice' && (
        <div className="w-full max-w-sm space-y-3 animate-fade-in-up">
          <Button
            onClick={() => setMode('login')}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Bot className="h-5 w-5 mr-2" />
            {t('auth.existingUser')}
          </Button>
          <Button
            onClick={() => setMode('signup')}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {t('auth.newUser')}
          </Button>

          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {t('auth.tokenIsLogin')}
            </p>
          </div>
        </div>
      )}

      {/* Login (existing user) */}
      {mode === 'login' && (
        <div className="w-full max-w-sm space-y-4 animate-fade-in-up">
          <div>
            <h2 className="text-lg font-semibold mb-1">{t('auth.loginTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('auth.loginDesc')}</p>
          </div>
          <div>
            <Label htmlFor="token" className="text-xs font-medium">{t('auth.botToken')}</Label>
            <div className="flex gap-1 mt-1">
              <Input
                id="token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                placeholder="123456789:ABCdefGHIjkl..."
                className="text-sm"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={() => setShowToken(!showToken)} className="h-9 w-9 p-0 shrink-0">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={login} disabled={loading || !token.trim()} className="w-full h-11">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
            {t('auth.login')}
          </Button>
          <button onClick={() => setMode('choice')} className="text-xs text-muted-foreground hover:text-foreground">
            ← {t('auth.back')}
          </button>
        </div>
      )}

      {/* Signup (new user) */}
      {mode === 'signup' && (
        <div className="w-full max-w-sm space-y-4 animate-fade-in-up">
          <div>
            <h2 className="text-lg font-semibold mb-1">{t('auth.signupTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('auth.signupDesc')}</p>
          </div>

          {/* Setup guide */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center justify-between w-full text-sm font-medium"
            >
              {t('auth.howToGetToken')}
              {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showGuide && (
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside animate-fade-in-up">
                <li>
                  {t('auth.step1')}{' '}
                  <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-500 underline inline-flex items-center gap-0.5">
                    @BotFather <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>{t('auth.step2')}</li>
                <li>{t('auth.step3')}</li>
                <li>{t('auth.step4')}</li>
                <li>{t('auth.step5')}</li>
              </ol>
            )}
          </div>

          <div>
            <Label htmlFor="signupToken" className="text-xs font-medium">{t('auth.botToken')}</Label>
            <div className="flex gap-1 mt-1">
              <Input
                id="signupToken"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                placeholder="123456789:ABCdefGHIjkl..."
                className="text-sm"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={() => setShowToken(!showToken)} className="h-9 w-9 p-0 shrink-0">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={login} disabled={loading || !token.trim()} className="w-full h-11">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {t('auth.createAccount')}
          </Button>
          {loading && <PugLoader message={t('auth.creatingAccount')} size="sm" />}
          <button onClick={() => setMode('choice')} className="text-xs text-muted-foreground hover:text-foreground">
            ← {t('auth.back')}
          </button>
        </div>
      )}

      {/* Features preview */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg">
        {[
          { icon: FileText, label: '16 AI Skills' },
          { icon: MessageCircle, label: 'HR Live Chat' },
          { icon: Briefcase, label: 'Job Finder' },
          { icon: Bot, label: 'Telegram Bot' },
        ].map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg border text-center">
            <f.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
