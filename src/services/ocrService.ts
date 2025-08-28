import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
}

export class OCRService {
  private worker: Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
  }

  async processImage(imageData: string, language: string = 'EN'): Promise<OCRResult> {
    try {
      await this.initialize();
      
      const { data } = await this.worker!.recognize(imageData);
      
      return {
        text: data.text.trim(),
        confidence: data.confidence || 0,
        language: 'eng'
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        text: '',
        confidence: 0,
        language: 'eng'
      };
    }
  }

  async processImageMultiLanguage(imageData: string, languages: string[] = ['EN']): Promise<OCRResult[]> {
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