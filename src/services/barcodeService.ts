import Quagga from '@ericblade/quagga2';

export interface BarcodeResult {
  code: string;
  format: string;
  confidence: number;
}

export class BarcodeService {
  async scanBarcode(imageData: string): Promise<BarcodeResult | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Configure Quagga for barcode detection
        Quagga.decodeSingle({
          src: canvas.toDataURL(),
          numOfWorkers: 0,
          inputStream: {
            size: canvas.width && canvas.height ? canvas.width : 800,
          },
          decoder: {
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'code_39_reader',
              'code_39_vin_reader',
              'codabar_reader',
              'upc_reader',
              'upc_e_reader',
              'i2of5_reader'
            ]
          },
          locate: true,
          locator: {
            patchSize: 'medium',
            halfSample: true
          }
        }, (result) => {
          if (result && result.codeResult) {
            resolve({
              code: result.codeResult.code,
              format: result.codeResult.format,
              confidence: result.codeResult.decodedCodes.reduce((acc, code) => acc + (code.error || 0), 0) / result.codeResult.decodedCodes.length
            });
          } else {
            resolve(null);
          }
        });
      };
      
      img.onerror = () => resolve(null);
      img.src = imageData;
    });
  }

  async detectBarcodeInVideo(videoElement: HTMLVideoElement): Promise<BarcodeResult | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      Quagga.decodeSingle({
        src: canvas.toDataURL(),
        numOfWorkers: 0,
        inputStream: {
          size: canvas.width || 800,
        },
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'upc_reader'
          ]
        },
        locate: true,
        locator: {
          patchSize: 'medium',
          halfSample: true
        }
      }, (result) => {
        if (result && result.codeResult) {
          resolve({
            code: result.codeResult.code,
            format: result.codeResult.format,
            confidence: 1 - (result.codeResult.decodedCodes.reduce((acc, code) => acc + (code.error || 0), 0) / result.codeResult.decodedCodes.length)
          });
        } else {
          resolve(null);
        }
      });
    });
  }
}

export const barcodeService = new BarcodeService();