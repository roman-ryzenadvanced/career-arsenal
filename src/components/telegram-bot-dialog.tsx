'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, X, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
  Send, Bot, Power, Trash2, Info, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';

interface TelegramBotDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface BotInfo {
  id: string;
  botToken: string;
  botUsername: string | null;
  chatId: string | null;
  isActive: boolean;
  defaultPersona: string;
  lastMessageAt: string | null;
  hasToken: boolean;
}

export function TelegramBotDialog({ open, onOpenChange }: TelegramBotDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [paired, setPaired] = useState(false);
  const [webhookActive, setWebhookActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [persona, setPersona] = useState('recruiter');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const loadBot = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram/settings', { cache: 'no-store' });
      const data = await res.json();
      if (data.bot) {
        setBot(data.bot);
        setToken(data.bot.botToken);
        setPersona(data.bot.defaultPersona);
        setPaired(data.paired || false);
        setWebhookActive(data.webhookActive || false);
      } else {
        setBot(null);
        setToken('');
        setPaired(false);
        setWebhookActive(false);
      }
    } catch (e: any) {
      toast({ title: t('telegram.loadFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    if (open) loadBot();
  }, [open, loadBot]);

  const save = async () => {
    if (!token.trim() || !token.includes(':')) {
      toast({ title: t('telegram.invalidToken'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', botToken: token, defaultPersona: persona }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('telegram.saveFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: t('telegram.saved'), description: data.message });
      await loadBot();
    } catch (e: any) {
      toast({ title: t('telegram.saveFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult({ ok: true, message: data.message || t('telegram.testSuccess') });
      } else {
        setTestResult({ ok: false, message: data.error || t('telegram.testFailed') });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message });
    } finally {
      setTesting(false);
    }
  };

  const toggleActive = async () => {
    if (!bot) return;
    const action = bot.isActive ? 'deactivate' : 'activate';
    try {
      const res = await fetch('/api/telegram/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: data.isActive ? t('telegram.activated') : t('telegram.deactivated') });
        await loadBot();
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
    }
  };

  const remove = async () => {
    if (!confirm(t('telegram.confirmRemove'))) return;
    try {
      await fetch('/api/telegram/settings', { method: 'DELETE' });
      toast({ title: t('telegram.removed') });
      setBot(null);
      setToken('');
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div className="bg-background border rounded-lg w-full max-w-xl max-h-[95dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-semibold">{t('telegram.title')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading && <PugLoader message={t('telegram.loading')} size="sm" />}

          {!loading && (
            <>
              {/* Status card */}
              {bot && (
                <Card className={paired ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bot.isActive ? 'bg-sky-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">@{bot.botUsername || 'bot'}</p>
                          <p className="text-xs text-muted-foreground">
                            {bot.isActive ? t('telegram.active') : t('telegram.inactive')}
                          </p>
                        </div>
                      </div>
                      {/* Paired/unpaired indicator with green/red dot */}
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${paired ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <Badge variant="outline" className={`text-xs ${paired ? 'text-emerald-600 border-emerald-500/50' : 'text-red-600 border-red-500/50'}`}>
                          {paired ? t('telegram.paired') : t('telegram.notPaired')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${webhookActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {webhookActive ? t('telegram.webhookActive') : t('telegram.webhookInactive')}
                      </span>
                      <span>•</span>
                      <span>{t('telegram.persona')}: {bot.defaultPersona}</span>
                      {bot.chatId && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {t('telegram.chatConnected')}
                          </span>
                        </>
                      )}
                      {bot.lastMessageAt && (
                        <>
                          <span>•</span>
                          <span>📅 {new Date(bot.lastMessageAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={toggleActive} className="h-7 text-xs">
                        <Power className="h-3 w-3 mr-1" />
                        {bot.isActive ? t('telegram.deactivate') : t('telegram.activate')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={remove} className="h-7 text-xs text-red-500 hover:text-red-600">
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('telegram.remove')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Setup instructions */}
              {!bot && (
                <Card className="border-sky-500/20 bg-sky-500/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-sky-500" />
                      <p className="text-sm font-semibold">{t('telegram.howToSetup')}</p>
                    </div>
                    <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                      <li>
                        {t('telegram.step1')}{' '}
                        <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-500 underline inline-flex items-center gap-0.5">
                          @BotFather <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                      <li>{t('telegram.step2')}</li>
                      <li>{t('telegram.step3')}</li>
                      <li>{t('telegram.step4')}</li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Token input */}
              <div>
                <Label htmlFor="botToken" className="text-xs font-medium flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  {t('telegram.botToken')}
                </Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    id="botToken"
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowToken(!showToken)}
                    className="h-9 w-9 p-0 shrink-0"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{t('telegram.tokenHint')}</p>
              </div>

              {/* Persona selector */}
              <div>
                <Label className="text-xs font-medium">{t('telegram.defaultPersona')}</Label>
                <Select value={persona} onValueChange={setPersona}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recruiter">🎯 Sarah — {t('telegram.recruiter')}</SelectItem>
                    <SelectItem value="compensation">💰 Marcus — {t('telegram.compensation')}</SelectItem>
                    <SelectItem value="career_coach">🧭 Dr. Priya — {t('telegram.careerCoach')}</SelectItem>
                    <SelectItem value="hr_legal">⚖️ James — {t('telegram.hrLegal')}</SelectItem>
                    <SelectItem value="culture">🌟 Elena — {t('telegram.cultureExpert')}</SelectItem>
                    <SelectItem value="founder">🚀 Alex — {t('telegram.founderAdvisor')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`p-3 rounded-lg border ${testResult.ok ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'}`}>
                  {testResult.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mb-1" />
                  )}
                  <p className={`text-xs ${testResult.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                    {testResult.message}
                  </p>
                </div>
              )}

              <Separator />

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {t('telegram.infoNote')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 flex items-center justify-between gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={test}
            disabled={testing || !bot}
          >
            {testing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            {t('telegram.testConnection')}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {t('skill.dialog.close')}
            </Button>
            <Button size="sm" onClick={save} disabled={saving || !token.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Bot className="h-4 w-4 mr-1" />}
              {t('telegram.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-import Key icon (used above)
import { Key } from 'lucide-react';
