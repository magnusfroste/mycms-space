import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor } from '@/components/common';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Mail, Send, Trash2, Users, FileText, Plus, Loader2 } from 'lucide-react';
import {
  useSubscribers,
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useDeleteSubscriber,
  useSendNewsletter,
  useSubscribersSubscription,
  useCampaignsSubscription,
  type NewsletterCampaign,
  type CreateCampaignInput,
} from '@/models/newsletter';

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  unsubscribed: 'bg-yellow-500/20 text-yellow-400',
  bounced: 'bg-red-500/20 text-red-400',
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/20 text-blue-400',
  sending: 'bg-yellow-500/20 text-yellow-400',
  sent: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

export default function NewsletterManager() {
  useSubscribersSubscription();
  useCampaignsSubscription();

  const [activeTab, setActiveTab] = useState('campaigns');
  const [editingCampaign, setEditingCampaign] = useState<NewsletterCampaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subscriber' | 'campaign'; id: string } | null>(null);

  const { data: subscribers, isLoading: loadingSubscribers } = useSubscribers();
  const { data: campaigns, isLoading: loadingCampaigns } = useCampaigns();

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const deleteSubscriber = useDeleteSubscriber();
  const sendNewsletter = useSendNewsletter();

  const [formData, setFormData] = useState<CreateCampaignInput>({
    subject: '',
    content: '',
  });

  const handleCreateCampaign = async () => {
    if (!formData.subject.trim() || !formData.content.trim()) {
      toast.error('Ämne och innehåll krävs');
      return;
    }

    try {
      await createCampaign.mutateAsync(formData);
      toast.success('Kampanj skapad');
      setFormData({ subject: '', content: '' });
      setIsCreating(false);
    } catch {
      toast.error('Kunde inte skapa kampanj');
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;

    try {
      await updateCampaign.mutateAsync({
        id: editingCampaign.id,
        updates: {
          subject: formData.subject,
          content: formData.content,
        },
      });
      toast.success('Kampanj uppdaterad');
      setEditingCampaign(null);
      setFormData({ subject: '', content: '' });
    } catch {
      toast.error('Kunde inte uppdatera kampanj');
    }
  };

  const handleSendCampaign = async (campaign: NewsletterCampaign) => {
    try {
      // Get from email from localStorage (set in Integrations)
      const fromEmail = localStorage.getItem('resend_from_email') || 'newsletter@froste.eu';
      const result = await sendNewsletter.mutateAsync({ campaignId: campaign.id, fromEmail });
      if (result.success) {
        toast.success(`Nyhetsbrev skickat till ${result.sent} av ${result.total} prenumeranter`);
      } else {
        toast.error(result.error || 'Kunde inte skicka nyhetsbrev');
      }
    } catch {
      toast.error('Kunde inte skicka nyhetsbrev');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'campaign') {
        await deleteCampaign.mutateAsync(deleteTarget.id);
        toast.success('Kampanj raderad');
      } else {
        await deleteSubscriber.mutateAsync(deleteTarget.id);
        toast.success('Prenumerant raderad');
      }
    } catch {
      toast.error('Kunde inte radera');
    } finally {
      setDeleteTarget(null);
    }
  };

  const startEdit = (campaign: NewsletterCampaign) => {
    setEditingCampaign(campaign);
    setFormData({ subject: campaign.subject, content: campaign.content });
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingCampaign(null);
    setFormData({ subject: '', content: '' });
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingCampaign(null);
    setFormData({ subject: '', content: '' });
  };

  const activeSubscribers = subscribers?.filter((s) => s.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Nyhetsbrev</h2>
          <p className="text-muted-foreground">Hantera prenumeranter och skicka nyhetsbrev</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            {activeSubscribers} aktiva prenumeranter
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <FileText className="h-4 w-4" />
            Kampanjer
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" />
            Prenumeranter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {(isCreating || editingCampaign) && (
            <Card>
              <CardHeader>
                <CardTitle>{editingCampaign ? 'Redigera kampanj' : 'Ny kampanj'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Ämne</Label>
                  <Input
                    id="campaign-subject"
                    placeholder="Nyhetsbrevets ämne..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Innehåll</Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    title={formData.subject}
                    placeholder="Skriv ditt nyhetsbrev i Markdown..."
                    minHeight="min-h-[300px]"
                    showAI={true}
                    aiMode="content"
                    aiContext="newsletter email content"
                  />
                  <p className="text-xs text-muted-foreground">
                    Använd Markdown för formatering. HTML stöds också.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
                    disabled={createCampaign.isPending || updateCampaign.isPending}
                  >
                    {(createCampaign.isPending || updateCampaign.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingCampaign ? 'Spara' : 'Skapa'}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    Avbryt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isCreating && !editingCampaign && (
            <Button onClick={startCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Ny kampanj
            </Button>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Kampanjer</CardTitle>
              <CardDescription>Dina nyhetsbrevskampanjer</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !campaigns?.length ? (
                <p className="text-muted-foreground text-center py-8">
                  Inga kampanjer ännu
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ämne</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mottagare</TableHead>
                      <TableHead>Skickad</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.subject}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[campaign.status]}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.recipient_count || '-'}</TableCell>
                        <TableCell>
                          {campaign.sent_at
                            ? format(new Date(campaign.sent_at), 'yyyy-MM-dd HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {campaign.status === 'draft' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(campaign)}
                                >
                                  Redigera
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSendCampaign(campaign)}
                                  disabled={sendNewsletter.isPending}
                                  className="gap-1"
                                >
                                  {sendNewsletter.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                  Skicka
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setDeleteTarget({ type: 'campaign', id: campaign.id })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle>Prenumeranter</CardTitle>
              <CardDescription>Alla som prenumererar på ditt nyhetsbrev</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscribers ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !subscribers?.length ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Inga prenumeranter ännu</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Lägg till ett prenumerationsblock på din sida
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-post</TableHead>
                      <TableHead>Namn</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prenumererade</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>{subscriber.name || '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[subscriber.status]}>
                            {subscriber.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(subscriber.subscribed_at), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setDeleteTarget({ type: 'subscriber', id: subscriber.id })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'campaign'
                ? 'Kampanjen raderas permanent.'
                : 'Prenumeranten raderas permanent.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Radera</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
