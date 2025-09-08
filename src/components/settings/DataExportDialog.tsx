import React from 'react';
import { Download, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ExportResult } from '@/services/dataExportService';
import { useTranslation } from '@/hooks/useTranslation';

interface DataExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isExporting: boolean;
  exportResult: ExportResult | null;
  onDownload: () => void;
  formatRecordSummary: (counts: ExportResult['recordCounts']) => string;
}

export const DataExportDialog: React.FC<DataExportDialogProps> = ({
  isOpen,
  onClose,
  isExporting,
  exportResult,
  onDownload,
  formatRecordSummary
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t('settings.privacy.exportData')}
          </DialogTitle>
          <DialogDescription>
            {isExporting 
              ? 'Generating your comprehensive health data PDF report...'
              : exportResult 
                ? 'Your PDF health report is ready for download'
                : 'Export your complete health data as a secure PDF document'
            }
          </DialogDescription>
        </DialogHeader>

        {isExporting && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Creating PDF Report</p>
                  <p className="text-sm text-muted-foreground">
                    Compiling your medications, adherence data, and health information...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {exportResult && !isExporting && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span className="font-medium">{exportResult.fileName}</span>
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      PDF
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {formatRecordSummary(exportResult.recordCounts)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-3 h-3" />
                    <span>
                      {t('settings.privacy.exportExpires')} {new Date(exportResult.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={onDownload} 
                className="w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('common.download')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isExporting && !exportResult && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium mb-1">Export Your Health Data</p>
                  <p className="text-sm text-muted-foreground">
                    Generate a comprehensive PDF report of your medications, adherence records, and health data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExporting}
          >
            {exportResult ? t('common.close') : t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};