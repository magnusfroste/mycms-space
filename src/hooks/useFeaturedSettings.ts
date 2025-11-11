import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils/imageCompression";

export interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  image_path: string | null;
  order_index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useFeaturedItems = () => {
  return useQuery({
    queryKey: ["featured-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_in")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as FeaturedItem[];
    },
  });
};

export const useCreateFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      title,
      description,
      enabled,
    }: {
      file: File | null;
      title: string;
      description: string;
      enabled: boolean;
    }) => {
      // Get the max order_index and add 1
      const { data: existingItems } = await supabase
        .from("featured_in")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = existingItems?.[0]?.order_index
        ? existingItems[0].order_index + 1
        : 1;

      let image_url = null;
      let image_path = null;

      // Upload image if provided
      if (file) {
        // Compress image before upload
        const compressedFile = await compressImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
        });
        
        const itemId = crypto.randomUUID();
        const fileExt = compressedFile.name.split(".").pop();
        const filePath = `${itemId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("featured-images")
          .upload(filePath, compressedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("featured-images").getPublicUrl(filePath);

        image_url = publicUrl;
        image_path = filePath;
      }

      // Create the featured item
      const { data, error } = await supabase
        .from("featured_in")
        .insert({
          title,
          description,
          image_url,
          image_path,
          order_index: nextOrderIndex,
          enabled,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-items"] });
      toast({
        title: "Success",
        description: "Featured item created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create featured item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      file,
      title,
      description,
      enabled,
      oldImagePath,
    }: {
      id: string;
      file: File | null;
      title: string;
      description: string;
      enabled: boolean;
      oldImagePath: string | null;
    }) => {
      let image_url = undefined;
      let image_path = undefined;

      // If new file provided, delete old and upload new
      if (file) {
        // Compress image before upload
        const compressedFile = await compressImage(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
        });
        
        // Delete old image if it exists
        if (oldImagePath) {
          await supabase.storage.from("featured-images").remove([oldImagePath]);
        }

        // Upload new image
        const fileExt = compressedFile.name.split(".").pop();
        const filePath = `${id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("featured-images")
          .upload(filePath, compressedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("featured-images").getPublicUrl(filePath);

        image_url = publicUrl;
        image_path = filePath;
      }

      // Update the featured item
      const updateData: any = { title, description, enabled };
      if (image_url !== undefined) {
        updateData.image_url = image_url;
        updateData.image_path = image_path;
      }

      const { data, error } = await supabase
        .from("featured_in")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-items"] });
      toast({
        title: "Success",
        description: "Featured item updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update featured item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      imagePath,
    }: {
      id: string;
      imagePath: string | null;
    }) => {
      // Delete the image from storage if it exists
      if (imagePath) {
        await supabase.storage.from("featured-images").remove([imagePath]);
      }

      // Delete the database record
      const { error } = await supabase.from("featured_in").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-items"] });
      toast({
        title: "Success",
        description: "Featured item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete featured item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useReorderFeaturedItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newOrderIndex }: { id: string; newOrderIndex: number }) => {
      const { error } = await supabase
        .from("featured_in")
        .update({ order_index: newOrderIndex })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-items"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reorder: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
