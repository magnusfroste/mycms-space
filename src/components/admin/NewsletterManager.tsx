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
      toast.error('Subject and content are required');
      return;
    }

    try {
      await createCampaign.mutateAsync(formData);
      toast.success('Campaign created');
      setFormData({ subject: '', content: '' });
      setIsCreating(false);
    } catch {
      toast.error('Could not create campaign');
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
      toast.success('Campaign updated');
      setEditingCampaign(null);
      setFormData({ subject: '', content: '' });
    } catch {
      toast.error('Could not update campaign');
    }
  };

  const handleSendCampaign = async (campaign: NewsletterCampaign) => {
    try {
      const fromEmail = localStorage.getItem('resend_from_email') || 'newsletter@froste.eu';
      const result = await sendNewsletter.mutateAsync({ campaignId: campaign.id, fromEmail });
      if (result.success) {
        toast.success(`Newsletter sent to ${result.sent} of ${result.total} subscribers`);
      } else {
        toast.error(result.error || 'Could not send newsletter');
      }
    } catch {
      toast.error('Could not send newsletter');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'campaign') {
        await deleteCampaign.mutateAsync(deleteTarget.id);
        toast.success('Campaign deleted');
      } else {
        await deleteSubscriber.mutateAsync(deleteTarget.id);
        toast.success('Subscriber deleted');
      }
    } catch {
      toast.error('Could not delete');
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
          <h2 className="text-2xl font-bold">Newsletter</h2>
          <p className="text-muted-foreground">Manage subscribers and send newsletters</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            {activeSubscribers} active subscribers
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <FileText className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {(isCreating || editingCampaign) && (
            <Card>
              <CardHeader>
                <CardTitle>{editingCampaign ? 'Edit campaign' : 'New campaign'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Subject</Label>
                  <Input
                    id="campaign-subject"
                    placeholder="Newsletter subject..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    title={formData.subject}
                    placeholder="Write your newsletter in Markdown..."
                    minHeight="min-h-[300px]"
                    showAI={true}
                    aiMode="content"
                    aiContext="newsletter email content"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use Markdown for formatting. HTML is also supported.
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
                    {editingCampaign ? 'Save' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isCreating && !editingCampaign && (
            <Button onClick={startCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New campaign
            </Button>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>Your newsletter campaigns</CardDescription>
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
                  No campaigns yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                                  Edit
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
                                  Send
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
              <CardTitle>Subscribers</CardTitle>
              <CardDescription>Everyone subscribed to your newsletter</CardDescription>
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
                  <p className="text-muted-foreground">No subscribers yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add a subscription block to your page
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'campaign'
                ? 'The campaign will be permanently deleted.'
                : 'The subscriber will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
