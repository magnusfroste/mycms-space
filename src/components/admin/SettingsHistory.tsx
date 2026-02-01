import { useState } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { History, RotateCcw, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useSettingsHistory,
  useRestoreHistoryEntry,
  tableLabels,
  type SettingsHistoryEntry,
} from '@/models/settingsHistory';

export const SettingsHistory = () => {
  const { data: history, isLoading } = useSettingsHistory(100);
  const restoreMutation = useRestoreHistoryEntry();
  
  const [selectedEntry, setSelectedEntry] = useState<SettingsHistoryEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  // Group history by table
  const groupedHistory = history?.reduce((acc, entry) => {
    if (!acc[entry.table_name]) {
      acc[entry.table_name] = [];
    }
    acc[entry.table_name].push(entry);
    return acc;
  }, {} as Record<string, SettingsHistoryEntry[]>) || {};

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const handlePreview = (entry: SettingsHistoryEntry) => {
    setSelectedEntry(entry);
    setShowPreview(true);
  };

  const handleRestoreClick = (entry: SettingsHistoryEntry) => {
    setSelectedEntry(entry);
    setShowRestoreConfirm(true);
  };

  const handleRestore = () => {
    if (selectedEntry) {
      restoreMutation.mutate(selectedEntry);
      setShowRestoreConfirm(false);
      setSelectedEntry(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const tableNames = Object.keys(groupedHistory);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Version History</h2>
          <p className="text-sm text-muted-foreground">
            All changes are saved automatically. Restore to previous versions with one click.
          </p>
        </div>
      </div>

      {tableNames.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No history yet</p>
            <p className="text-sm">Changes will be saved automatically from here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tableNames.map((tableName) => {
            const entries = groupedHistory[tableName];
            const isExpanded = expandedTables.has(tableName);
            const displayEntries = isExpanded ? entries : entries.slice(0, 3);

            return (
              <Card key={tableName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {tableLabels[tableName] || tableName}
                      </CardTitle>
                      <CardDescription>
                        {entries.length} {entries.length === 1 ? 'change' : 'changes'}
                      </CardDescription>
                    </div>
                    {entries.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTable(tableName)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show all ({entries.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {displayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {format(new Date(entry.changed_at), 'dd MMM HH:mm', { locale: enUS })}
                          </Badge>
                          {entry.record_id && tableName === 'page_blocks' && (
                            <span className="text-xs text-muted-foreground">
                              Block: {entry.record_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(entry)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreClick(entry)}
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Preview Data
            </DialogTitle>
            <DialogDescription>
              {selectedEntry && (
                <>
                  {tableLabels[selectedEntry.table_name] || selectedEntry.table_name}
                  {' • '}
                  {format(new Date(selectedEntry.changed_at), 'PPpp', { locale: enUS })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
              {selectedEntry && JSON.stringify(selectedEntry.old_data, null, 2)}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowPreview(false);
                setShowRestoreConfirm(true);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore this version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace current data with the selected version from{' '}
              {selectedEntry && format(new Date(selectedEntry.changed_at), 'PPpp', { locale: enUS })}.
              <br /><br />
              <strong>Note:</strong> The current version will also be saved in history so you can undo if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoreMutation.isPending}>
              {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
