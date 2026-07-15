'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings, X, Loader2, CheckCircle2, AlertCircle, Zap, Eye, EyeOff,
  Server, Key, User, RefreshCw, Plug, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n-context';
import { PugLoader } from '@/components/pug-loader';

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface AIConfig {
  baseUrl?: string;
  apiKey?: string;
  chatId?: string;
  userId?: string;
  token?: string;
}

interface AISettings {
  config: AIConfig;
  hasApiKey: boolean;
  hasToken: boolean;
  source: string;
  provider: string;
  modelUsed: string;
}

const PROVIDER_PRESETS = [
  { name: 'Z.ai GLM', baseUrl: 'https://internal-api.z.ai/v1', description: 'Default — free GLM 5.2 access', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900' },
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', description: 'GPT-4o, GPT-4 Turbo, GPT-3.5', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
  { name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', description: 'Claude 3.5 Sonnet, Opus, Haiku', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900' },
  { name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', description: 'Gemini 1.5 Pro, Flash, Ultra', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900' },
  { name: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1', description: 'Mistral Large, Codestral, Mixtral', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', description: 'DeepSeek V3, DeepSeek Coder', color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900' },
  { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', description: 'Ultra-fast inference (Llama, Mixtral)', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
  { name: 'Together AI', baseUrl: 'https://api.together.xyz/v1', description: 'Open-source models hosting', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900' },
  { name: 'Custom', baseUrl: '', description: 'Any OpenAI-compatible endpoint', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300' },
];

export function AISettingsDialog({ open, onOpenChange }: AISettingsDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState<AIConfig>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-settings', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setFormData(data.config);
        setSelectedPreset(data.provider);
      }
    } catch (e: any) {
      toast({ title: t('aiSettings.loadFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    if (open) loadSettings();
  }, [open, loadSettings]);

  const save = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: formData }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: t('aiSettings.saveFailed'), description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: t('aiSettings.saved'), description: data.message });
      await loadSettings();
    } catch (e: any) {
      toast({ title: t('aiSettings.saveFailed'), description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult({ ok: true, message: data.message + ' Reply: ' + data.reply });
      } else {
        setTestResult({ ok: false, message: data.message || data.error });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message });
    } finally {
      setTesting(false);
    }
  };

  const applyPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
    setSelectedPreset(preset.name);
    if (preset.baseUrl) {
      setFormData((prev) => ({ ...prev, baseUrl: preset.baseUrl }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div className="bg-background border rounded-lg w-full max-w-2xl max-h-[95dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('aiSettings.title')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading && <PugLoader message={t('aiSettings.loading')} size="sm" />}

          {!loading && settings && (
            <>
              {/* Current status */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{settings.provider}</p>
                        <p className="text-xs text-muted-foreground">{t('aiSettings.model')}: {settings.modelUsed}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Plug className="h-3 w-3 mr-1" />
                      {settings.source === 'system' ? t('aiSettings.sourceSystem') :
                       settings.source === 'project' ? t('aiSettings.sourceProject') :
                       settings.source === 'home' ? t('aiSettings.sourceHome') :
                       t('aiSettings.sourceNone')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      {settings.hasApiKey ? (
                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t('aiSettings.apiKeySet')}</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {t('aiSettings.apiKeyMissing')}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {settings.hasToken ? (
                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t('aiSettings.tokenSet')}</span>
                      ) : (
                        <span className="text-muted-foreground">{t('aiSettings.tokenNone')}</span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Provider presets */}
              <div>
                <Label className="text-xs font-medium mb-2 block">{t('aiSettings.providerPresets')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROVIDER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        selectedPreset === preset.name
                          ? preset.color + ' ring-1 ring-foreground/20'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <p className="text-xs font-semibold">{preset.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Config form */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="baseUrl" className="text-xs font-medium flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    {t('aiSettings.baseUrl')}
                  </Label>
                  <Input
                    id="baseUrl"
                    value={formData.baseUrl || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="apiKey" className="text-xs font-medium flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    {t('aiSettings.apiKey')}
                  </Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.apiKey || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={settings.hasApiKey ? t('aiSettings.apiKeyPlaceholder') : t('aiSettings.apiKeyEmpty')}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="h-9 w-9 p-0 shrink-0"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="chatId" className="text-xs font-medium">{t('aiSettings.chatId')}</Label>
                  <Input
                    id="chatId"
                    value={formData.chatId || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, chatId: e.target.value }))}
                    placeholder="(optional)"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="userId" className="text-xs font-medium">{t('aiSettings.userId')}</Label>
                  <Input
                    id="userId"
                    value={formData.userId || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))}
                    placeholder="(optional)"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="token" className="text-xs font-medium flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t('aiSettings.token')} <span className="text-muted-foreground">({t('common.optional')})</span>
                  </Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      id="token"
                      type={showToken ? 'text' : 'password'}
                      value={formData.token || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, token: e.target.value }))}
                      placeholder="(optional)"
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
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <Alert className={testResult.ok ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'}>
                  {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                  <AlertDescription className={testResult.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {t('aiSettings.infoNote')}
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
            onClick={testConnection}
            disabled={testing || loading}
          >
            {testing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plug className="h-4 w-4 mr-1" />}
            {t('aiSettings.testConnection')}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              {t('skill.dialog.close')}
            </Button>
            <Button size="sm" onClick={save} disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              {t('aiSettings.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Local Alert component (to avoid import issues)
function Alert({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative w-full rounded-lg border p-4 ${className}`}>
      {children}
    </div>
  );
}

function AlertDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}
