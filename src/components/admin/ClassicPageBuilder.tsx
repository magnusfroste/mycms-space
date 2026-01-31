// ============================================
// Classic Page Builder
// Split view: Page list left, Block canvas right
// ============================================

import React, { useState } from 'react';
import { Plus, FileText, Home, Trash2, Edit2, ExternalLink, Link as LinkIcon, X, Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { usePages, useCreatePage, useUpdatePage, useDeletePage, usePagesSubscription } from '@/models/pages';
import { useCreateNavLink, useAllNavLinks, useDeleteNavLink } from '@/models/navLinks';
import { BlockCanvas } from './BlockCanvas';
import type { Page } from '@/types/pages';
import { cn } from '@/lib/utils';

const ClassicPageBuilder = () => {
  const { data: pages = [], isLoading } = usePages();
  const { data: navLinks = [] } = useAllNavLinks();
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();
  const createNavLink = useCreateNavLink();
  const deleteNavLink = useDeleteNavLink();
  
  usePagesSubscription();

  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    is_main_landing: false,
    enabled: true,
  });

  // Auto-select first page if none selected
  React.useEffect(() => {
    if (!selectedPageSlug && pages.length > 0) {
      const mainPage = pages.find(p => p.is_main_landing);
      setSelectedPageSlug(mainPage?.slug || pages[0].slug);
    }
  }, [pages, selectedPageSlug]);

  const selectedPage = pages.find(p => p.slug === selectedPageSlug);

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      is_main_landing: false,
      enabled: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.slug) return;
    
    await createPage.mutateAsync({
      title: formData.title,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: formData.description || undefined,
      is_main_landing: formData.is_main_landing,
      enabled: formData.enabled,
    });
    
    setIsCreateOpen(false);
    resetForm();
    // Select the newly created page
    setSelectedPageSlug(formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  };

  const handleUpdate = async () => {
    if (!editingPage) return;
    
    await updatePage.mutateAsync({
      id: editingPage.id,
      title: formData.title,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: formData.description || undefined,
      is_main_landing: formData.is_main_landing,
      enabled: formData.enabled,
    });
    
    setEditingPage(null);
    resetForm();
  };

  const handleDelete = async (page: Page) => {
    const navLink = navLinks.find(link => link.url === `/${page.slug}`);
    if (navLink) {
      await deleteNavLink.mutateAsync(navLink.id);
    }
    await deletePage.mutateAsync(page.id);
    
    // Select another page if this was selected
    if (selectedPageSlug === page.slug) {
      const remaining = pages.filter(p => p.id !== page.id);
      setSelectedPageSlug(remaining[0]?.slug || null);
    }
  };

  const handleSetMainLanding = async (page: Page) => {
    await updatePage.mutateAsync({
      id: page.id,
      is_main_landing: true,
    });
  };

  const handleAddToNav = async (page: Page) => {
    const maxOrder = navLinks.reduce((max, link) => Math.max(max, link.order_index), 0);
    await createNavLink.mutateAsync({
      label: page.title,
      url: `/${page.slug}`,
      order_index: maxOrder + 1,
      enabled: true,
      is_external: false,
    });
  };

  const handleRemoveFromNav = async (page: Page) => {
    const navLink = navLinks.find(link => link.url === `/${page.slug}`);
    if (navLink) {
      await deleteNavLink.mutateAsync(navLink.id);
    }
  };

  const isInNav = (page: Page) => navLinks.some(link => link.url === `/${page.slug}`);

  const openEditDialog = (page: Page) => {
    setFormData({
      title: page.title,
      slug: page.slug,
      description: page.description || '',
      is_main_landing: page.is_main_landing,
      enabled: page.enabled,
    });
    setEditingPage(page);
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (isLoading) {
    return <div className="p-4">Laddar sidor...</div>;
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 rounded-lg border">
        {/* Left Panel: Page List */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <div className="h-full flex flex-col bg-muted/20">
            {/* Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Sidor</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ny
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Skapa ny sida</DialogTitle>
                      <DialogDescription>
                        Skapa en ny sida som du kan fylla med block
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titel</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              title: e.target.value,
                              slug: formData.slug || generateSlug(e.target.value),
                            });
                          }}
                          placeholder="Min nya sida"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL-slug</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">/</span>
                          <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="min-nya-sida"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Beskrivning (valfri)</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="En kort beskrivning..."
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enabled">Aktiverad</Label>
                        <Switch
                          id="enabled"
                          checked={formData.enabled}
                          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Avbryt</Button>
                      <Button onClick={handleCreate} disabled={!formData.title || !formData.slug}>
                        Skapa sida
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-xs text-muted-foreground">
                Välj en sida för att redigera dess block
              </p>
            </div>

            {/* Page List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={cn(
                      "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedPageSlug === page.slug 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-muted border border-transparent",
                      !page.enabled && "opacity-50"
                    )}
                    onClick={() => setSelectedPageSlug(page.slug)}
                  >
                    <div className="flex-shrink-0">
                      {page.is_main_landing ? (
                        <Home className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{page.title}</span>
                        {page.is_main_landing && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">Start</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">/{page.slug}</span>
                    </div>
                    
                    <ChevronRight className={cn(
                      "h-4 w-4 text-muted-foreground transition-opacity",
                      selectedPageSlug === page.slug ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                    )} />
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Selected Page Actions */}
            {selectedPage && (
              <div className="p-3 border-t bg-background space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => openEditDialog(selectedPage)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Redigera info
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    asChild
                  >
                    <a href={selectedPage.is_main_landing ? '/' : `/${selectedPage.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Öppna
                    </a>
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {!selectedPage.is_main_landing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleSetMainLanding(selectedPage)}
                    >
                      <Home className="h-3 w-3 mr-1" />
                      Sätt som start
                    </Button>
                  )}
                  
                  {isInNav(selectedPage) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleRemoveFromNav(selectedPage)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Ta bort från meny
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleAddToNav(selectedPage)}
                    >
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Lägg till i meny
                    </Button>
                  )}
                  
                  {selectedPage.slug !== 'home' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Ta bort
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort sida?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Detta tar bort "{selectedPage.title}" och alla dess block permanent.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(selectedPage)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Block Canvas */}
        <ResizablePanel defaultSize={75} minSize={50}>
          {selectedPageSlug ? (
            <BlockCanvas 
              pageSlug={selectedPageSlug} 
              headerTitle={selectedPage?.title || 'Block Canvas'}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Välj en sida för att redigera dess block</p>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Edit Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera sida</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-slug">URL-slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  disabled={editingPage?.slug === 'home'}
                />
              </div>
              {editingPage?.slug === 'home' && (
                <p className="text-xs text-muted-foreground">Startsidans slug kan inte ändras</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Beskrivning</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-enabled">Aktiverad</Label>
              <Switch
                id="edit-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>Avbryt</Button>
            <Button onClick={handleUpdate}>Spara ändringar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassicPageBuilder;
