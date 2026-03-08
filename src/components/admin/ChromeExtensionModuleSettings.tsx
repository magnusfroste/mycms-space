// ============================================
// Chrome Extension Module Settings
// Configure the browser extension bridge
// ============================================

import React, { useState, useEffect } from 'react';
import { Chrome, Plus, X, Save, Info, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useChromeExtensionModule, useUpdateChromeExtensionModule } from '@/models/modules';
import type { ChromeExtensionModuleConfig } from '@/types/modules';
import { defaultModuleConfigs } from '@/types/modules';

const SETUP_STEPS = [
  'Go to chrome://extensions/ and enable Developer Mode',
  'Click "Load unpacked" and select the chrome-extension/ folder',
  'Copy the Extension ID shown under the extension',
  'Paste it below and click Save',
  'Use the admin Chat to scrape pages via the extension',
];

const ChromeExtensionModuleSettings: React.FC = () => {
  const { config, isEnabled, isLoading } = useChromeExtensionModule();
  const updateModule = useUpdateChromeExtensionModule();

  const safeConfig: ChromeExtensionModuleConfig = config ?? defaultModuleConfigs.chrome_extension;

  const [enabled, setEnabled] = useState(isEnabled);
  const [extensionId, setExtensionId] = useState(safeConfig.extension_id);
  const [autoConnect, setAutoConnect] = useState(safeConfig.auto_connect);
  const [domains, setDomains] = useState<string[]>(safeConfig.allowed_domains);
  const [newDomain, setNewDomain] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setEnabled(isEnabled);
      setExtensionId(safeConfig.extension_id);
      setAutoConnect(safeConfig.auto_connect);
      setDomains(safeConfig.allowed_domains);
    }
  }, [isLoading, isEnabled, safeConfig]);

  const addDomain = () => {
    const d = newDomain.trim().toLowerCase();
    if (d && !domains.includes(d)) {
      setDomains([...domains, d]);
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setDomains(domains.filter((d) => d !== domain));
  };

  const handleSave = () => {
    updateModule.mutate(
      {
        enabled,
        module_config: {
          extension_id: extensionId.trim(),
          auto_connect: autoConnect,
          allowed_domains: domains,
          setup_instructions: '',
        },
      },
      {
        onSuccess: () => {
          toast.success('Chrome Extension settings saved');
        },
        onError: () => toast.error('Failed to save settings'),
      }
    );
  };

  const copyExtensionId = () => {
    if (extensionId) {
      navigator.clipboard.writeText(extensionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Chrome className="h-6 w-6" />
          Chrome Extension
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Browser extension for scraping pages via the admin Chat agent
        </p>
      </div>

      {/* Enable toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Extension Bridge</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allows the Chat agent to use browser_scrape tool
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Setup guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {SETUP_STEPS.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Extension ID */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Connection</CardTitle>
          <CardDescription>Extension ID from chrome://extensions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Extension ID</Label>
            <div className="flex gap-2">
              <Input
                value={extensionId}
                onChange={(e) => setExtensionId(e.target.value)}
                placeholder="abcdefghijklmnopqrstuvwxyz..."
                className="font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={copyExtensionId}
                disabled={!extensionId}
                className="shrink-0"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto-connect on admin load</Label>
              <p className="text-xs text-muted-foreground">Ping extension when admin panel opens</p>
            </div>
            <Switch checked={autoConnect} onCheckedChange={setAutoConnect} />
          </div>
        </CardContent>
      </Card>

      {/* Allowed domains */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Allowed Domains</CardTitle>
          <CardDescription>Domains the agent is allowed to scrape</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <Badge key={d} variant="secondary" className="gap-1 pr-1">
                {d}
                <button onClick={() => removeDomain(d)} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className="text-sm"
              onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            />
            <Button variant="outline" size="sm" onClick={addDomain} disabled={!newDomain.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button onClick={handleSave} disabled={updateModule.isPending} className="gap-2">
        <Save className="h-4 w-4" />
        {updateModule.isPending ? 'Saving…' : 'Save Settings'}
      </Button>
    </div>
  );
};

export default ChromeExtensionModuleSettings;
