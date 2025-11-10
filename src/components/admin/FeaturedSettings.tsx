import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useFeaturedItems,
  useCreateFeaturedItem,
  useUpdateFeaturedItem,
  useDeleteFeaturedItem,
  useReorderFeaturedItem,
  type FeaturedItem,
} from "@/hooks/useFeaturedSettings";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Upload } from "lucide-react";

export default function FeaturedSettings() {
  const { data: items, isLoading } = useFeaturedItems();
  const createMutation = useCreateFeaturedItem();
  const updateMutation = useUpdateFeaturedItem();
  const deleteMutation = useDeleteFeaturedItem();
  const reorderMutation = useReorderFeaturedItem();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<FeaturedItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    enabled: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const resetForm = () => {
    setFormData({ title: "", description: "", enabled: true });
    setSelectedFile(null);
    setPreviewUrl("");
    setEditingItem(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please upload JPG, PNG, or WEBP image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        file: selectedFile,
        ...formData,
        oldImagePath: editingItem.image_path,
      });
      setEditingItem(null);
    } else {
      await createMutation.mutateAsync({
        file: selectedFile,
        ...formData,
      });
      setIsAddDialogOpen(false);
    }
    resetForm();
  };

  const handleEdit = (item: FeaturedItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      enabled: item.enabled,
    });
    setPreviewUrl(item.image_url || "");
    setSelectedFile(null);
  };

  const handleDelete = async () => {
    if (deleteConfirmItem) {
      await deleteMutation.mutateAsync({
        id: deleteConfirmItem.id,
        imagePath: deleteConfirmItem.image_path,
      });
      setDeleteConfirmItem(null);
    }
  };

  const handleReorder = async (item: FeaturedItem, direction: "up" | "down") => {
    if (!items) return;

    const currentIndex = items.findIndex((i) => i.id === item.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= items.length) return;

    const currentOrder = item.order_index;
    const swapOrder = items[swapIndex].order_index;

    await Promise.all([
      reorderMutation.mutateAsync({ id: item.id, newOrderIndex: swapOrder }),
      reorderMutation.mutateAsync({
        id: items[swapIndex].id,
        newOrderIndex: currentOrder,
      }),
    ]);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const FormDialog = ({ open, onOpenChange, title }: any) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div>
            <Label>Image</Label>
            <div className="mt-2 space-y-4">
              {previewUrl && (
                <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Max 5MB, JPG/PNG/WEBP format
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enabled: checked })
              }
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Featured In Items</h3>
          <p className="text-sm text-muted-foreground">
            Manage items displayed in the Featured section
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <FormDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            title="Add Featured Item"
          />
        </Dialog>
      </div>

      <div className="space-y-4">
        {items?.map((item, index) => (
          <Card key={item.id} className="p-4">
            <div className="flex gap-4">
              {item.image_url && (
                <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden border">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">
                      {index + 1}. {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(item, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(item, "down")}
                      disabled={index === items.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmItem(item)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-muted-foreground">
                      {item.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <FormDialog
        open={!!editingItem}
        onOpenChange={(open: boolean) => {
          if (!open) resetForm();
        }}
        title="Edit Featured Item"
      />

      <AlertDialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the featured item and its associated image. This
              action cannot be undone.
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
