import { enhancedOcrService, SupportedLanguage } from './enhancedOcrService';

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

export class OCRService {
  private worker: any = null;

  async initialize() {
    // Delegated to enhanced service
  }

  async processImage(imageData: string, language: string = 'EN'): Promise<OCRResult> {
    try {
      console.log('OCR Service: Starting processImage with language:', language);
      console.log('OCR Service: Image data length:', imageData.length);
      console.log('OCR Service: Image data prefix:', imageData.substring(0, 50));
      
      // Map UI language codes to OCR language codes
      const languageMap: Record<string, SupportedLanguage> = {
        'EN': 'eng',
        'AZ': 'aze',
        'RU': 'rus',
        'TR': 'tur'
      };

      const ocrLanguage = languageMap[language] || 'eng';
      console.log('OCR Service: Mapped to OCR language:', ocrLanguage);
      
      // Use enhanced OCR service
      console.log('OCR Service: Calling enhanced OCR service...');
      const result = await enhancedOcrService.processImage(imageData, ocrLanguage);
      console.log('OCR Service: Enhanced OCR result:', result);
      
      return {
        text: result.text,
        confidence: result.confidence,
        language: result.language
      };
    } catch (error) {
      console.error('OCR processing failed - detailed error:', error);
      console.error('OCR processing failed - error message:', error?.message);
      console.error('OCR processing failed - error name:', error?.name);
      
      // Return fallback result instead of throwing
      console.log('OCR Service: Using fallback mode due to error');
      return {
        text: "OCR temporarily unavailable - please try camera capture",
        confidence: 0.1,
        language: language
      };
    }
  }

  async processImageMultiLanguage(imageData: string, languages: string[] = ['EN']): Promise<OCRResult[]> {
    try {
      const languageMap: Record<string, SupportedLanguage> = {
        'EN': 'eng',
        'AZ': 'aze',
        'RU': 'rus',
        'TR': 'tur'
      };

      const ocrLanguages = languages.map(lang => languageMap[lang] || 'eng');
      const results = await enhancedOcrService.processImageMultiLanguage(imageData, ocrLanguages);
      
      return results.map(result => ({
        text: result.text,
        confidence: result.confidence,
        language: result.language
      }));
    } catch (error) {
      console.error('Multi-language OCR processing failed:', error);
      throw new Error('Failed to process image with multi-language OCR');
    }
  }

  private async preprocessImage(imageData: string): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply preprocessing filters
          this.enhanceContrast(data);
          this.convertToGrayscale(data);
          this.applyThreshold(data);
          
          // Put processed data back
          ctx.putImageData(imageData, 0, 0);
          
          resolve({
            canvas,
            dataUrl: canvas.toDataURL('image/png')
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = imageData;
    });
  }

  private enhanceContrast(data: Uint8ClampedArray) {
    const factor = 1.5; // Contrast enhancement factor
    const intercept = 128 * (1 - factor);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * factor + intercept));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor + intercept)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor + intercept)); // B
    }
  }

  private convertToGrayscale(data: Uint8ClampedArray) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
    }
  }

  private applyThreshold(data: Uint8ClampedArray, threshold: number = 128) {
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] > threshold ? 255 : 0;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const ocrService = new OCRService();