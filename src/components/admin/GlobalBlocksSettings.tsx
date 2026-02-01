// ============================================
// Global Blocks Settings (Header & Footer)
// ============================================

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Globe, Github, Linkedin, Twitter, Instagram, Youtube, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  useHeaderModule, 
  useFooterModule, 
  useUpdateHeaderModule, 
  useUpdateFooterModule,
  useCreateModule 
} from '@/models/modules';
import { defaultModuleConfigs } from '@/types/modules';
import type { HeaderModuleConfig, FooterModuleConfig, SocialLink } from '@/types/modules';

const SOCIAL_PLATFORMS = [
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'custom', label: 'Anpassad', icon: Link },
] as const;

const getSocialIcon = (platform: string) => {
  const found = SOCIAL_PLATFORMS.find(p => p.value === platform);
  return found ? found.icon : Link;
};

export default function GlobalBlocksSettings() {
  const { toast } = useToast();
  
  // Header state
  const { data: headerModule, isLoading: headerLoading } = useHeaderModule();
  const updateHeader = useUpdateHeaderModule();
  const createHeaderModule = useCreateModule('header');
  
  const [headerConfig, setHeaderConfig] = useState<HeaderModuleConfig>(defaultModuleConfigs.header);
  
  // Footer state
  const { data: footerModule, isLoading: footerLoading } = useFooterModule();
  const updateFooter = useUpdateFooterModule();
  const createFooterModule = useCreateModule('footer');
  
  const [footerConfig, setFooterConfig] = useState<FooterModuleConfig>(defaultModuleConfigs.footer);

  // Sync header config from DB
  useEffect(() => {
    if (headerModule?.module_config) {
      setHeaderConfig(headerModule.module_config as HeaderModuleConfig);
    }
  }, [headerModule]);

  // Sync footer config from DB
  useEffect(() => {
    if (footerModule?.module_config) {
      setFooterConfig(footerModule.module_config as FooterModuleConfig);
    }
  }, [footerModule]);

  const handleSaveHeader = async () => {
    try {
      if (!headerModule) {
        await createHeaderModule.mutateAsync({ config: headerConfig, enabled: true });
      } else {
        await updateHeader.mutateAsync({ module_config: headerConfig });
      }
      toast({ title: 'Sparat', description: 'Header-inställningar uppdaterade' });
    } catch (error) {
      toast({ title: 'Fel', description: 'Kunde inte spara inställningar', variant: 'destructive' });
    }
  };

  const handleSaveFooter = async () => {
    try {
      if (!footerModule) {
        await createFooterModule.mutateAsync({ config: footerConfig, enabled: true });
      } else {
        await updateFooter.mutateAsync({ module_config: footerConfig });
      }
      toast({ title: 'Sparat', description: 'Footer-inställningar uppdaterade' });
    } catch (error) {
      toast({ title: 'Fel', description: 'Kunde inte spara inställningar', variant: 'destructive' });
    }
  };

  const addSocialLink = () => {
    setFooterConfig(prev => ({
      ...prev,
      social_links: [...prev.social_links, { platform: 'custom', url: '', label: '' }],
    }));
  };

  const removeSocialLink = (index: number) => {
    setFooterConfig(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }));
  };

  const updateSocialLink = (index: number, updates: Partial<SocialLink>) => {
    setFooterConfig(prev => ({
      ...prev,
      social_links: prev.social_links.map((link, i) => 
        i === index ? { ...link, ...updates } : link
      ),
    }));
  };

  if (headerLoading || footerLoading) {
    return <div className="flex items-center justify-center p-8">Laddar...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Globala Block
        </h1>
        <p className="text-muted-foreground mt-1">
          Hantera header och footer som visas på alla sidor
        </p>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* Header Settings */}
        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Header-inställningar</CardTitle>
              <CardDescription>
                Konfigurera logotyp och navigeringsbeteende
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="space-y-4">
                <h3 className="font-medium">Logotyp</h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="logo-text">Logotyptext</Label>
                    <Input
                      id="logo-text"
                      value={headerConfig.logo_text}
                      onChange={(e) => setHeaderConfig(prev => ({ ...prev, logo_text: e.target.value }))}
                      placeholder="Din webbplats"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo-image">Logotypbild (URL)</Label>
                    <Input
                      id="logo-image"
                      value={headerConfig.logo_image_url || ''}
                      onChange={(e) => setHeaderConfig(prev => ({ ...prev, logo_image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Lämna tomt för att använda text istället
                    </p>
                  </div>
                </div>
              </div>

              {/* Behavior Section */}
              <div className="space-y-4">
                <h3 className="font-medium">Beteende</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sticky header</Label>
                      <p className="text-sm text-muted-foreground">
                        Headern följer med vid scrollning
                      </p>
                    </div>
                    <Switch
                      checked={headerConfig.sticky}
                      onCheckedChange={(checked) => setHeaderConfig(prev => ({ ...prev, sticky: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Visa tema-toggle</Label>
                      <p className="text-sm text-muted-foreground">
                        Knapp för att växla mellan ljust/mörkt tema
                      </p>
                    </div>
                    <Switch
                      checked={headerConfig.show_theme_toggle}
                      onCheckedChange={(checked) => setHeaderConfig(prev => ({ ...prev, show_theme_toggle: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Transparent på hero</Label>
                      <p className="text-sm text-muted-foreground">
                        Genomskinlig bakgrund över hero-sektionen
                      </p>
                    </div>
                    <Switch
                      checked={headerConfig.transparent_on_hero}
                      onCheckedChange={(checked) => setHeaderConfig(prev => ({ ...prev, transparent_on_hero: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveHeader} disabled={updateHeader.isPending || createHeaderModule.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Spara header
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer-inställningar</CardTitle>
              <CardDescription>
                Konfigurera copyright-text och sociala länkar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Copyright Section */}
              <div className="space-y-2">
                <Label htmlFor="copyright">Copyright-text</Label>
                <Input
                  id="copyright"
                  value={footerConfig.copyright_text}
                  onChange={(e) => setFooterConfig(prev => ({ ...prev, copyright_text: e.target.value }))}
                  placeholder="© {year} Ditt namn"
                />
                <p className="text-xs text-muted-foreground">
                  Använd {'{year}'} för att visa aktuellt år automatiskt
                </p>
              </div>

              {/* Social Links Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Sociala länkar</h3>
                    <p className="text-sm text-muted-foreground">
                      Lägg till länkar till dina sociala profiler
                    </p>
                  </div>
                  <Switch
                    checked={footerConfig.show_social_links}
                    onCheckedChange={(checked) => setFooterConfig(prev => ({ ...prev, show_social_links: checked }))}
                  />
                </div>

                {footerConfig.show_social_links && (
                  <div className="space-y-3">
                    {footerConfig.social_links.map((link, index) => {
                      const IconComponent = getSocialIcon(link.platform);
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <IconComponent className="h-5 w-5 text-muted-foreground shrink-0" />
                          
                          <Select
                            value={link.platform}
                            onValueChange={(value) => updateSocialLink(index, { platform: value as SocialLink['platform'] })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SOCIAL_PLATFORMS.map(platform => (
                                <SelectItem key={platform.value} value={platform.value}>
                                  {platform.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                            placeholder="https://..."
                            className="flex-1"
                          />

                          {link.platform === 'custom' && (
                            <Input
                              value={link.label || ''}
                              onChange={(e) => updateSocialLink(index, { label: e.target.value })}
                              placeholder="Etikett"
                              className="w-24"
                            />
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSocialLink(index)}
                            className="shrink-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    <Button variant="outline" onClick={addSocialLink} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Lägg till länk
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveFooter} disabled={updateFooter.isPending || createFooterModule.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Spara footer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
