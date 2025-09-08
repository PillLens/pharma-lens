import { useState } from 'react';
import { dataExportService, ExportResult } from '@/services/dataExportService';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

export const useDataExport = () => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const exportData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      toast.info(t('toast.export.preparing'));
      
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
          toast.error(t('toast.export.rateLimitError'));
        } else {
          toast.error(`${t('toast.export.failed')}: ${error.message}`);
        }
      } else {
        toast.error(t('toast.export.failed'));
      }
      
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = async (result: ExportResult = exportResult!) => {
    if (!result?.downloadUrl) {
      toast.error(t('toast.export.noExportAvailable'));
      return;
    }

    try {
      await dataExportService.downloadFile(result.downloadUrl, result.fileName);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toast.export.downloadError'));
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