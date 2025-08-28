import { createWorker, PSM } from 'tesseract.js';

// Configure tesseract.js for browser security
const workerConfig = {
  workerPath: 'https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js',
  langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
  corePath: 'https://unpkg.com/tesseract.js-core@5.1.0/tesseract-core-simd.wasm.js',
  logger: (m: any) => {
    if (m.status === 'recognizing text') {
      console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
    }
  }
};

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

export type SupportedLanguage = 'eng' | 'aze' | 'rus' | 'tur';

export class EnhancedOCRService {
  private workers: Map<SupportedLanguage, Tesseract.Worker> = new Map();
  private loadedLanguages: Set<SupportedLanguage> = new Set();

  private languageConfig: Record<SupportedLanguage, {
    charWhitelist: string;
    name: string;
  }> = {
    eng: {
      charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()-/% ',
      name: 'English'
    },
    aze: {
      charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÇçĞğIıÖöŞşÜü0123456789.,()-/% ',
      name: 'Azerbaijani'
    },
    rus: {
      charWhitelist: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя0123456789.,()-/% ',
      name: 'Russian'
    },
    tur: {
      charWhitelist: 'ABCDEFGHIJKLMNOPRSTUVWXYZabcdefghijklmnopqrstuvwxyzÇçĞğIıİiÖöŞşÜü0123456789.,()-/% ',
      name: 'Turkish'
    }
  };

  async initializeLanguage(language: SupportedLanguage): Promise<void> {
    console.log('Enhanced OCR: initializeLanguage called for:', language);
    
    if (this.loadedLanguages.has(language)) {
      console.log('Enhanced OCR: Language already loaded:', language);
      return;
    }
    
    try {
      console.log('Enhanced OCR: Creating worker for language:', language);
      const worker = await createWorker(language, 1, workerConfig);
      const config = this.languageConfig[language];
      
      console.log('Enhanced OCR: Setting parameters for worker...');
      await worker.setParameters({
        tessedit_char_whitelist: config.charWhitelist,
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: 1, // LSTM only
      });
      
      this.workers.set(language, worker);
      this.loadedLanguages.add(language);
      console.log(`OCR language ${config.name} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize OCR for ${language}:`, error);
      console.error('Error details:', error.message, error.stack);
      throw new Error(`Failed to initialize OCR for ${language}: ${error.message}`);
    }
  }

  async processImage(imageData: string, language: SupportedLanguage = 'eng'): Promise<OCRResult> {
    console.log('Enhanced OCR: Starting processImage with language:', language);
    
    try {
      console.log('Enhanced OCR: Initializing language...');
      await this.initializeLanguage(language);
      console.log('Enhanced OCR: Language initialized successfully');
      
      const worker = this.workers.get(language);
      
      if (!worker) {
        console.error('Enhanced OCR: Worker not found for language:', language);
        throw new Error(`Worker not initialized for language: ${language}`);
      }
      
      console.log('Enhanced OCR: Worker found, preprocessing image...');
      
      // Preprocess the image for better OCR results
      const processedImage = await this.preprocessImage(imageData, language);
      console.log('Enhanced OCR: Image preprocessed successfully');
      
      // Perform OCR on the preprocessed image
      console.log('Enhanced OCR: Starting recognition...');
      const { data } = await worker.recognize(processedImage.canvas);
      console.log('Enhanced OCR: Recognition completed. Text length:', data.text?.length, 'Confidence:', data.confidence);
      
      const result = {
        text: data.text.trim(),
        confidence: data.confidence / 100, // Convert to 0-1 range
        language: this.languageConfig[language].name
      };
      
      console.log('Enhanced OCR: Final result:', result);
      return result;
      
    } catch (error) {
      console.error('Enhanced OCR processing failed - detailed error:', error);
      console.error('Enhanced OCR processing failed - error message:', error.message);
      console.error('Enhanced OCR processing failed - error stack:', error.stack);
      throw new Error(`Failed to process image with enhanced OCR: ${error.message}`);
    }
  }

  async processImageMultiLanguage(imageData: string, languages: SupportedLanguage[] = ['eng']): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const language of languages) {
      try {
        const result = await this.processImage(imageData, language);
        results.push(result);
      } catch (error) {
        console.warn(`OCR failed for language ${language}:`, error);
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  async detectBestLanguage(imageData: string): Promise<SupportedLanguage> {
    const testLanguages: SupportedLanguage[] = ['eng', 'aze', 'rus', 'tur'];
    const results = await this.processImageMultiLanguage(imageData, testLanguages);
    
    if (results.length === 0) {
      return 'eng'; // fallback
    }
    
    const bestResult = results[0];
    const languageKey = Object.keys(this.languageConfig).find(
      key => this.languageConfig[key as SupportedLanguage].name === bestResult.language
    ) as SupportedLanguage;
    
    return languageKey || 'eng';
  }

  private async preprocessImage(imageData: string, language: SupportedLanguage): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Set canvas size with optimal dimensions for OCR
          const maxDimension = 1200;
          let { width, height } = img;
          
          if (width > maxDimension || height > maxDimension) {
            const scale = maxDimension / Math.max(width, height);
            width *= scale;
            height *= scale;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw original image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply language-specific preprocessing
          this.applyLanguageSpecificProcessing(data, language);
          this.enhanceContrast(data);
          this.convertToGrayscale(data);
          this.applyAdaptiveThreshold(data);
          
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

  private applyLanguageSpecificProcessing(data: Uint8ClampedArray, language: SupportedLanguage) {
    // Apply language-specific image enhancements
    switch (language) {
      case 'aze':
      case 'tur':
        // Enhance for diacritical marks
        this.enhanceForDiacritics(data);
        break;
      case 'rus':
        // Enhance for Cyrillic characters
        this.enhanceForCyrillic(data);
        break;
      default:
        // Standard processing for English
        break;
    }
  }

  private enhanceForDiacritics(data: Uint8ClampedArray) {
    // Slightly sharpen to better detect diacritical marks
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const sharpened = Math.min(255, avg * 1.1);
      data[i] = data[i + 1] = data[i + 2] = sharpened;
    }
  }

  private enhanceForCyrillic(data: Uint8ClampedArray) {
    // Enhance contrast for better Cyrillic character recognition
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const enhanced = avg > 128 ? Math.min(255, avg * 1.2) : Math.max(0, avg * 0.8);
      data[i] = data[i + 1] = data[i + 2] = enhanced;
    }
  }

  private enhanceContrast(data: Uint8ClampedArray) {
    const factor = 1.3;
    const intercept = 128 * (1 - factor);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * factor + intercept));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor + intercept));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor + intercept));
    }
  }

  private convertToGrayscale(data: Uint8ClampedArray) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  }

  private applyAdaptiveThreshold(data: Uint8ClampedArray, blockSize: number = 15) {
    // Simple adaptive thresholding for better text recognition
    const width = Math.sqrt(data.length / 4);
    const threshold = 128;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
    }
  }

  async terminate() {
    for (const [language, worker] of this.workers) {
      try {
        await worker.terminate();
        console.log(`OCR worker for ${language} terminated`);
      } catch (error) {
        console.error(`Error terminating OCR worker for ${language}:`, error);
      }
    }
    
    this.workers.clear();
    this.loadedLanguages.clear();
  }

  getLoadedLanguages(): SupportedLanguage[] {
    return Array.from(this.loadedLanguages);
  }

  getSupportedLanguages(): { code: SupportedLanguage; name: string }[] {
    return Object.entries(this.languageConfig).map(([code, config]) => ({
      code: code as SupportedLanguage,
      name: config.name
    }));
  }
}

// Singleton instance
export const enhancedOcrService = new EnhancedOCRService();