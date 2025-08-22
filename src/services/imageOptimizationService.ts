export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  enableProgressive?: boolean;
}

export interface OptimizationResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  file: File;
  metadata: {
    width: number;
    height: number;
    format: string;
    hasTransparency: boolean;
  };
}

class ImageOptimizationService {
  private readonly DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'webp',
    enableProgressive: true
  };

  // Main optimization function
  async optimizeImage(file: File, options: ImageOptimizationOptions = {}): Promise<OptimizationResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Create image element to analyze
    const img = await this.createImageElement(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Calculate new dimensions
    const { width, height } = this.calculateOptimalDimensions(
      img.width, 
      img.height, 
      config.maxWidth, 
      config.maxHeight
    );

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw image on canvas with new dimensions
    ctx.drawImage(img, 0, 0, width, height);

    // Get optimized blob
    const blob = await this.canvasToBlob(canvas, config);
    
    // Create metadata
    const metadata = {
      width,
      height,
      format: config.format,
      hasTransparency: this.detectTransparency(canvas)
    };

    // Create optimized file
    const optimizedFile = new File([blob], this.generateOptimizedFilename(file.name, config.format), {
      type: blob.type,
      lastModified: Date.now()
    });

    return {
      originalSize: file.size,
      compressedSize: blob.size,
      compressionRatio: Math.round((1 - blob.size / file.size) * 100),
      file: optimizedFile,
      metadata
    };
  }

  // Optimize specifically for medical images (higher quality, preserve details)
  async optimizeMedicalImage(file: File): Promise<OptimizationResult> {
    return this.optimizeImage(file, {
      maxWidth: 2048,
      maxHeight: 1536,
      quality: 0.9,
      format: 'jpeg', // Better for medical images with lots of detail
      enableProgressive: true
    });
  }

  // Optimize for thumbnails
  async createThumbnail(file: File, size: number = 200): Promise<OptimizationResult> {
    return this.optimizeImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'webp',
      enableProgressive: false
    });
  }

  // Batch optimization for multiple images
  async optimizeBatch(
    files: File[], 
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult[]> {
    const results = await Promise.allSettled(
      files.map(file => this.optimizeImage(file, options))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<OptimizationResult> => 
        result.status === 'fulfilled')
      .map(result => result.value);
  }

  // Check if image needs optimization
  shouldOptimize(file: File, maxSizeKB: number = 500): boolean {
    const sizeKB = file.size / 1024;
    return sizeKB > maxSizeKB || !['image/webp', 'image/avif'].includes(file.type);
  }

  // Get image dimensions without loading full image
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    const img = await this.createImageElement(file);
    return { width: img.width, height: img.height };
  }

  // Validate image file
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const maxSizeMB = 10;
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, WebP, or AVIF.' };
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, error: `File too large. Maximum size is ${maxSizeMB}MB.` };
    }
    
    return { valid: true };
  }

  // Private helper methods
  private createImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    // Scale down if necessary
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  private canvasToBlob(canvas: HTMLCanvasElement, config: Required<ImageOptimizationOptions>): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = `image/${config.format}`;
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, mimeType, config.quality);
    });
  }

  private detectTransparency(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check alpha channel
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    
    return false;
  }

  private generateOptimizedFilename(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}_opt_${timestamp}.${format}`;
  }

  // Progressive JPEG support check
  supportsProgressiveJPEG(): boolean {
    return typeof HTMLCanvasElement.prototype.toBlob !== 'undefined';
  }

  // WebP support check
  supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Get optimal format based on browser support and image content
  getOptimalFormat(hasTransparency: boolean): 'webp' | 'jpeg' | 'png' {
    if (this.supportsWebP()) {
      return 'webp';
    }
    
    return hasTransparency ? 'png' : 'jpeg';
  }
}

export const imageOptimizationService = new ImageOptimizationService();