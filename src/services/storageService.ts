import { supabase } from '@/integrations/supabase/client';
import { imageOptimizationService, OptimizationResult } from './imageOptimizationService';
import { securityAuditService } from './securityAuditService';

export interface MedicationImage {
  id: string;
  url: string;
  type: 'box' | 'leaflet' | 'label';
  uploadedAt: Date;
  optimized?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

class StorageService {
  // Upload medication image to Supabase storage with optimization
  async uploadMedicationImage(file: File, productId: string, type: 'box' | 'leaflet' | 'label'): Promise<MedicationImage | null> {
    try {
      // Log the file upload attempt
      await securityAuditService.logFileEvent('upload', file.name, 'medical_image', true);
      
      // Validate file
      const validation = imageOptimizationService.validateImageFile(file);
      if (!validation.valid) {
        await securityAuditService.logFileEvent('upload', file.name, 'medical_image', false);
        throw new Error(validation.error);
      }

      // Optimize image for medical use
      let optimizationResult: OptimizationResult | null = null;
      let fileToUpload = file;
      
      if (imageOptimizationService.shouldOptimize(file)) {
        optimizationResult = await imageOptimizationService.optimizeMedicalImage(file);
        fileToUpload = optimizationResult.file;
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${productId}/${type}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('medication-images')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('medication-images')
        .getPublicUrl(fileName);

      // Log successful upload
      await securityAuditService.logFileEvent('upload', fileName, 'medical_image', true);

      return {
        id: data.path,
        url: urlData.publicUrl,
        type,
        uploadedAt: new Date(),
        optimized: optimizationResult !== null,
        originalSize: file.size,
        compressedSize: fileToUpload.size
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      await securityAuditService.logFileEvent('upload', file.name, 'medical_image', false);
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

  // Upload scanned image for processing with optimization
  async uploadScannedImage(file: File, sessionId: string): Promise<string | null> {
    try {
      // Log the scan upload attempt
      await securityAuditService.logFileEvent('upload', file.name, 'scanned_image', true);
      
      // Validate and optimize scanned image
      const validation = imageOptimizationService.validateImageFile(file);
      if (!validation.valid) {
        await securityAuditService.logFileEvent('upload', file.name, 'scanned_image', false);
        throw new Error(validation.error);
      }

      // Optimize for OCR processing (higher quality, proper format)
      const optimizationResult = await imageOptimizationService.optimizeMedicalImage(file);
      const optimizedFile = optimizationResult.file;

      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `scans/${sessionId}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('medication-images')
        .upload(fileName, optimizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Log successful upload with optimization details
      await securityAuditService.logFileEvent('upload', fileName, 'scanned_image', true);
      
      return supabase.storage
        .from('medication-images')
        .getPublicUrl(fileName).data.publicUrl;
    } catch (error) {
      console.error('Scanned image upload failed:', error);
      await securityAuditService.logFileEvent('upload', file.name, 'scanned_image', false);
      return null;
    }
  }

  // Create multiple image sizes for responsive loading
  async createImageVariants(file: File, productId: string): Promise<{ 
    thumbnail: string; 
    medium: string; 
    full: string; 
  } | null> {
    try {
      // Create thumbnail (200px)
      const thumbnailResult = await imageOptimizationService.createThumbnail(file, 200);
      const thumbnailName = `${productId}/thumb_${Date.now()}.webp`;
      
      // Create medium size (800px)
      const mediumResult = await imageOptimizationService.optimizeImage(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
        format: 'webp'
      });
      const mediumName = `${productId}/medium_${Date.now()}.webp`;
      
      // Upload all variants
      const [thumbUpload, mediumUpload, fullUpload] = await Promise.all([
        supabase.storage.from('medication-images').upload(thumbnailName, thumbnailResult.file),
        supabase.storage.from('medication-images').upload(mediumName, mediumResult.file),
        this.uploadMedicationImage(file, productId, 'box')
      ]);

      if (thumbUpload.error || mediumUpload.error || !fullUpload) {
        throw new Error('Failed to upload image variants');
      }

      return {
        thumbnail: supabase.storage.from('medication-images').getPublicUrl(thumbnailName).data.publicUrl,
        medium: supabase.storage.from('medication-images').getPublicUrl(mediumName).data.publicUrl,
        full: fullUpload.url
      };
    } catch (error) {
      console.error('Failed to create image variants:', error);
      return null;
    }
  }
}

export const storageService = new StorageService();