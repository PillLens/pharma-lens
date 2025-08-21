import { supabase } from '@/integrations/supabase/client';

export interface MedicationImage {
  id: string;
  url: string;
  type: 'box' | 'leaflet' | 'label';
  uploadedAt: Date;
}

class StorageService {
  // Upload medication image to Supabase storage
  async uploadMedicationImage(file: File, productId: string, type: 'box' | 'leaflet' | 'label'): Promise<MedicationImage | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${type}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('medication-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('medication-images')
        .getPublicUrl(fileName);

      return {
        id: data.path,
        url: urlData.publicUrl,
        type,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  }

  // Upload medication leaflet PDF
  async uploadMedicationLeaflet(file: File, productId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/leaflet_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('medication-leaflets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Return signed URL for private access
      const { data: urlData, error: urlError } = await supabase.storage
        .from('medication-leaflets')
        .createSignedUrl(fileName, 60 * 60 * 24); // 24 hour expiry

      if (urlError) throw urlError;
      
      return urlData.signedUrl;
    } catch (error) {
      console.error('Leaflet upload failed:', error);
      return null;
    }
  }

  // Get medication images for a product
  async getMedicationImages(productId: string): Promise<MedicationImage[]> {
    try {
      const { data, error } = await supabase.storage
        .from('medication-images')
        .list(productId, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;

      return data.map(file => ({
        id: `${productId}/${file.name}`,
        url: supabase.storage.from('medication-images').getPublicUrl(`${productId}/${file.name}`).data.publicUrl,
        type: file.name.includes('box') ? 'box' : file.name.includes('leaflet') ? 'leaflet' : 'label',
        uploadedAt: new Date(file.created_at || Date.now())
      }));
    } catch (error) {
      console.error('Failed to get medication images:', error);
      return [];
    }
  }

  // Delete medication image
  async deleteMedicationImage(imagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('medication-images')
        .remove([imagePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }

  // Upload scanned image for processing
  async uploadScannedImage(file: File, sessionId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `scans/${sessionId}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('medication-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      return supabase.storage
        .from('medication-images')
        .getPublicUrl(fileName).data.publicUrl;
    } catch (error) {
      console.error('Scanned image upload failed:', error);
      return null;
    }
  }
}

export const storageService = new StorageService();