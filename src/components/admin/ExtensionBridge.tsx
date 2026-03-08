// ============================================
// Chrome Extension Bridge
// Communicate with MyCMS Chrome Extension
// from the admin panel via externally_connectable
// ============================================

import React, { useState, useCallback, useEffect } from 'react';
import { Chrome, Wifi, WifiOff, Globe, Loader2, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useChromeExtensionModule, useUpdateChromeExtensionModule } from '@/models/modules';
import { defaultModuleConfigs } from '@/types/modules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chromeRuntime = (window as any).chrome?.runtime;

// Send message to Chrome extension
function sendToExtension(extensionId: string, message: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!chromeRuntime?.sendMessage) {
      reject(new Error('Chrome extension API not available. Use Chrome browser.'));
      return;
    }
    try {
      chromeRuntime.sendMessage(extensionId, message, (response: unknown) => {
        if (chromeRuntime.lastError) {
          reject(new Error(chromeRuntime.lastError.message || 'Extension not reachable'));
          return;
        }
        resolve(response);
      });
    } catch {
      reject(new Error('Failed to communicate with extension'));
    }
  });
}

interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  has_selection?: boolean;
}

const ExtensionBridge: React.FC = () => {
  const [extensionId, setExtensionId] = useState(() => localStorage.getItem('mycms_extension_id') || '');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const saveId = (id: string) => {
    setExtensionId(id);
    localStorage.setItem('mycms_extension_id', id);
    setConnected(null);
  };

  const ping = useCallback(async () => {
    if (!extensionId.trim()) { toast.error('Enter extension ID first'); return; }
    setLoading(true);
    try {
      const res = await sendToExtension(extensionId, { type: 'ping' }) as { ok: boolean; version: string };
      setConnected(true);
      setVersion(res.version || '?');
      toast.success(`Connected — v${res.version}`);
    } catch (err: unknown) {
      setConnected(false);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [extensionId]);

  const scrapeActiveTab = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await sendToExtension(extensionId, { type: 'scrape_active_tab' }) as { success: boolean; data: ScrapeResult; error?: string };
      if (res.success) {
        setResult(res.data);
        toast.success('Active tab scraped');
      } else {
        toast.error(res.error || 'Scrape failed');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [extensionId]);

  const navigateAndScrape = useCallback(async () => {
    if (!scrapeUrl.trim()) { toast.error('Enter a URL'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await sendToExtension(extensionId, { type: 'navigate_and_scrape', url: scrapeUrl }) as { success: boolean; data: ScrapeResult; error?: string };
      if (res.success) {
        setResult(res.data);
        toast.success('Page scraped');
      } else {
        toast.error(res.error || 'Scrape failed');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [extensionId, scrapeUrl]);

  const copyContent = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      toast.success('Content copied');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Chrome className="h-5 w-5" />
          Chrome Extension Bridge
        </CardTitle>
        <CardDescription>
          Scrape pages remotely via your installed MyCMS Chrome extension
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Extension ID */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Extension ID
            <span className="ml-1 text-[10px]">(find in chrome://extensions)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              value={extensionId}
              onChange={(e) => saveId(e.target.value)}
              placeholder="abcdefghijklmnopqrstuvwxyz..."
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={ping}
              disabled={loading || !extensionId.trim()}
              className="shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ping'}
            </Button>
          </div>
          {connected !== null && (
            <div className="flex items-center gap-2">
              {connected ? (
              <Badge variant="outline" className="text-primary border-primary/30 gap-1">
                  <Wifi className="h-3 w-3" /> Connected v{version}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-destructive border-destructive/30 gap-1">
                  <WifiOff className="h-3 w-3" /> Not reachable
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {connected && (
          <>
            <div className="border-t border-border pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={scrapeActiveTab}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Scrape Active Tab
              </Button>

              <div className="flex gap-2">
                <Input
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/someone"
                  className="text-sm"
                />
                <Button
                  onClick={navigateAndScrape}
                  disabled={loading || !scrapeUrl.trim()}
                  className="shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ExternalLink className="h-4 w-4 mr-1" /> Scrape URL</>}
                </Button>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Result</Label>
                  <Button variant="ghost" size="sm" onClick={copyContent} className="h-7 gap-1 text-xs">
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium truncate">{result.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{result.url}</p>
                  {result.has_selection && (
                    <Badge variant="secondary" className="text-[10px]">Selected text</Badge>
                  )}
                </div>
                <pre className="text-xs bg-background border rounded-lg p-3 max-h-48 overflow-auto whitespace-pre-wrap">
                  {result.content.substring(0, 2000)}{result.content.length > 2000 ? '…' : ''}
                </pre>
              </div>
            )}
          </>
        )}

        {/* Help */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
          <p className="text-xs font-medium">💡 How it works</p>
          <p className="text-[11px] text-muted-foreground">
            This communicates with the MyCMS Chrome extension installed in your browser.
            The extension ID is found in chrome://extensions after loading the unpacked extension.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtensionBridge;
