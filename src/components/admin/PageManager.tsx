import React, { useState } from 'react';
import { Plus, FileText, Home, Trash2, Edit2, ExternalLink, Link as LinkIcon, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { usePages, useCreatePage, useUpdatePage, useDeletePage, usePagesSubscription } from '@/models/pages';
import { useCreateNavLink, useAllNavLinks, useDeleteNavLink } from '@/models/navLinks';
import type { Page } from '@/types/pages';

const PageManager = () => {
  const { data: pages = [], isLoading } = usePages();
  const { data: navLinks = [] } = useAllNavLinks();
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();
  const createNavLink = useCreateNavLink();
  const deleteNavLink = useDeleteNavLink();
  
  usePagesSubscription();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    is_main_landing: false,
    enabled: true,
  });

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
    // Also remove from nav_links if exists
    const navLink = navLinks.find(link => link.url === `/${page.slug}`);
    if (navLink) {
      await deleteNavLink.mutateAsync(navLink.id);
    }
    await deletePage.mutateAsync(page.id);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sidor</h2>
          <p className="text-muted-foreground">Hantera dina sidor och välj vilken som ska vara startsidan</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ny sida
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
                  placeholder="En kort beskrivning av sidan..."
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
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_main">Sätt som startsida</Label>
                <Switch
                  id="is_main"
                  checked={formData.is_main_landing}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_main_landing: checked })}
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

      {/* Pages Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Card key={page.id} className={`relative ${!page.enabled ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {page.is_main_landing ? (
                    <Home className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <CardDescription className="text-sm">/{page.slug}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  {page.is_main_landing && (
                    <Badge variant="default" className="text-xs">Startsida</Badge>
                  )}
                  {!page.enabled && (
                    <Badge variant="secondary" className="text-xs">Inaktiv</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {page.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {page.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(page)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Redigera
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={page.is_main_landing ? '/' : `/${page.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visa
                  </a>
                </Button>
                
                {!page.is_main_landing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetMainLanding(page)}
                  >
                    <Home className="h-3 w-3 mr-1" />
                    Sätt som start
                  </Button>
                )}
                
                {isInNav(page) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFromNav(page)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Ta bort från meny
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddToNav(page)}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Lägg till i meny
                  </Button>
                )}
                
                {page.slug !== 'home' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Ta bort
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ta bort sida?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Detta kommer ta bort sidan "{page.title}" och alla dess block permanent.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(page)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ta bort
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PageManager;
