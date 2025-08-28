import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}

export class OCRService {
  private worker: any = null;

  async initialize() {
    if (this.worker) return;
    
    try {
      this.worker = await createWorker('eng');
      console.log('OCR service initialized');
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      throw error;
    }
  }

  async processImage(imageData: string, language: string = 'EN'): Promise<OCRResult> {
    await this.initialize();
    
    try {
      const { data } = await this.worker.recognize(imageData);
      
      return {
        text: data.text.trim(),
        confidence: data.confidence / 100, // Convert to 0-1 range
        language: 'English'
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  async processImageMultiLanguage(imageData: string, languages: string[] = ['EN']): Promise<OCRResult[]> {
    // For now, just use single language processing
    const result = await this.processImage(imageData, languages[0]);
    return [result];
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