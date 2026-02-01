// ============================================
// Messages Manager - Admin view for contact messages
// ============================================

import React, { useState } from 'react';
import { 
  useContactMessages, 
  useMarkMessageAsRead, 
  useDeleteContactMessage,
  useContactMessagesSubscription 
} from '@/models/contactMessages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Mail, MailOpen, Trash2, Clock, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { ContactMessage } from '@/data/contactMessages';

const MessagesManager: React.FC = () => {
  const { data: messages, isLoading } = useContactMessages();
  const markAsRead = useMarkMessageAsRead();
  const deleteMessage = useDeleteContactMessage();
  
  // Enable realtime updates
  useContactMessagesSubscription();

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const handleOpenMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      await markAsRead.mutateAsync(message.id);
    }
  };

  const handleDeleteConfirm = async () => {
    if (messageToDelete) {
      await deleteMessage.mutateAsync(messageToDelete);
      setMessageToDelete(null);
      if (selectedMessage?.id === messageToDelete) {
        setSelectedMessage(null);
      }
    }
  };

  const unreadCount = messages?.filter(m => !m.is_read).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground">
            Manage contact requests from visitors
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="default" className="text-sm">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {messages?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No messages yet. When someone sends a contact form, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages?.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                !message.is_read ? 'border-primary/50 bg-primary/5' : ''
              }`}
              onClick={() => handleOpenMessage(message)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {message.is_read ? (
                      <MailOpen className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Mail className="w-5 h-5 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-base font-medium">
                        {message.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {message.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {format(new Date(message.created_at), 'd MMM yyyy, HH:mm', { locale: enUS })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {message.subject && (
                  <p className="font-medium mb-1">{message.subject}</p>
                )}
                <p className="text-muted-foreground line-clamp-2">
                  {message.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <DialogTitle>{selectedMessage.name}</DialogTitle>
                    <DialogDescription>{selectedMessage.email}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(new Date(selectedMessage.created_at), "d MMMM yyyy 'at' HH:mm", { locale: enUS })}
                </div>
                
                {selectedMessage.subject && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Subject</p>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Message</p>
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Your message'}`)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Reply via email
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setMessageToDelete(selectedMessage.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesManager;
