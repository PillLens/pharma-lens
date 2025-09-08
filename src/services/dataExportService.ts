import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExportResult {
  downloadUrl: string;
  fileName: string;
  format: string;
  expiresAt: string;
  recordCounts: {
    medications: number;
    adherenceRecords: number;
    scanSessions: number;
    familyGroups: number;
    feedback: number;
    healthCheckups: number;
  };
}

export class DataExportService {
  async exportUserData(): Promise<ExportResult> {
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        method: 'POST',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.downloadUrl) {
        throw new Error('No download URL received from server');
      }

      return data;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  async downloadFile(url: string, fileName: string): Promise<void> {
    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download');
      throw error;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatRecordSummary(recordCounts: ExportResult['recordCounts']): string {
    const total = Object.values(recordCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 'No records found';
    
    const parts = [];
    if (recordCounts.medications > 0) parts.push(`${recordCounts.medications} medications`);
    if (recordCounts.adherenceRecords > 0) parts.push(`${recordCounts.adherenceRecords} adherence records`);
    if (recordCounts.scanSessions > 0) parts.push(`${recordCounts.scanSessions} scan sessions`);
    if (recordCounts.familyGroups > 0) parts.push(`${recordCounts.familyGroups} family groups`);
    if (recordCounts.feedback > 0) parts.push(`${recordCounts.feedback} feedback entries`);
    if (recordCounts.healthCheckups > 0) parts.push(`${recordCounts.healthCheckups} health checkups`);
    
    return parts.join(', ');
  }
}

export const dataExportService = new DataExportService();