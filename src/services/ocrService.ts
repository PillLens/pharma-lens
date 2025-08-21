import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (this.worker) return;
    
    this.worker = await createWorker('eng');
    await this.worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()-/% ',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });
  }

  async processImage(imageData: string): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    try {
      // Preprocess the image for better OCR results
      const processedImage = await this.preprocessImage(imageData);
      
      // Perform OCR on the preprocessed image
      const { data } = await this.worker!.recognize(processedImage.canvas);
      
      return {
        text: data.text.trim(),
        confidence: data.confidence / 100 // Convert to 0-1 range
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to process image with OCR');
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