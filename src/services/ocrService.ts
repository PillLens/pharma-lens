
import { enhancedOcrService, type OCRResult, type SupportedLanguage } from './enhancedOcrService';

export { OCRResult } from './enhancedOcrService';

export class OCRService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialize the enhanced service with English by default
      await enhancedOcrService.initializeLanguage('eng');
      this.initialized = true;
      console.log('OCR service initialized');
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      throw error;
    }
  }

  async processImage(imageData: string, language: string = 'EN'): Promise<OCRResult> {
    await this.initialize();
    
    try {
      // Map language codes to supported languages
      const languageMap: Record<string, SupportedLanguage> = {
        'EN': 'eng',
        'AZ': 'aze',
        'RU': 'rus',
        'TR': 'tur'
      };
      
      const supportedLang = languageMap[language] || 'eng';
      
      return await enhancedOcrService.processImage(imageData, supportedLang);
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  async processImageMultiLanguage(imageData: string, languages: string[] = ['EN']): Promise<OCRResult[]> {
    await this.initialize();
    
    try {
      const languageMap: Record<string, SupportedLanguage> = {
        'EN': 'eng',
        'AZ': 'aze',
        'RU': 'rus',
        'TR': 'tur'
      };
      
      const supportedLangs = languages.map(lang => languageMap[lang] || 'eng');
      
      return await enhancedOcrService.processImageMultiLanguage(imageData, supportedLangs);
    } catch (error) {
      console.error('Multi-language OCR processing failed:', error);
      return [];
    }
  }

  async terminate() {
    if (this.initialized) {
      await enhancedOcrService.terminate();
      this.initialized = false;
    }
  }
}

// Singleton instance
export const ocrService = new OCRService();
