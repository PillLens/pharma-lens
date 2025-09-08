import { useState } from 'react';
import { dataExportService, ExportResult } from '@/services/dataExportService';
import { toast } from 'sonner';

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const exportData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      toast.info('Preparing your data export...');
      
      const result = await dataExportService.exportUserData();
      
      setExportResult(result);
      
      toast.success(
        `Export ready! ${dataExportService.formatRecordSummary(result.recordCounts)}`,
        {
          duration: 5000,
          action: {
            label: 'Download',
            onClick: () => downloadExport(result)
          }
        }
      );
      
      return result;
    } catch (error) {
      console.error('Export failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          toast.error('You can only export your data once per hour. Please try again later.');
        } else {
          toast.error(`Export failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to export data. Please try again.');
      }
      
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = async (result: ExportResult = exportResult!) => {
    if (!result?.downloadUrl) {
      toast.error('No export available to download');
      return;
    }

    try {
      await dataExportService.downloadFile(result.downloadUrl, result.fileName);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download export file');
    }
  };

  const clearExport = () => {
    setExportResult(null);
  };

  return {
    isExporting,
    exportResult,
    exportData,
    downloadExport,
    clearExport,
    formatRecordSummary: dataExportService.formatRecordSummary
  };
};