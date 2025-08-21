// PDF generation service for medication reports
// Note: This is a simplified implementation. For production, consider using libraries like jsPDF or Puppeteer

export interface MedicationReport {
  patientInfo?: {
    name?: string;
    age?: number;
    conditions?: string[];
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescriber?: string;
    notes?: string;
  }>;
  safetyAlerts: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  interactions: Array<{
    medications: string[];
    severity: string;
    description: string;
  }>;
  generatedAt: string;
}

class PDFService {
  async generateMedicationReport(reportData: MedicationReport): Promise<string> {
    // For now, generate HTML that can be printed to PDF
    // In production, you'd use a proper PDF library
    
    const htmlContent = this.generateReportHTML(reportData);
    
    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    return url;
  }

  private generateReportHTML(data: MedicationReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medication Report</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .medication-card {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9fafb;
        }
        .medication-name {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .medication-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .detail-item {
            margin-bottom: 5px;
        }
        .detail-label {
            font-weight: bold;
            color: #374151;
        }
        .alert {
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 10px;
        }
        .alert-high { background-color: #fef2f2; border-left: 4px solid #ef4444; }
        .alert-medium { background-color: #fffbeb; border-left: 4px solid #f59e0b; }
        .alert-low { background-color: #f0f9ff; border-left: 4px solid #3b82f6; }
        .interaction {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .disclaimer {
            background-color: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        @media print {
            body { font-size: 12px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Care Capsule</div>
        <div class="subtitle">Medication Safety Report</div>
        <div style="margin-top: 10px; color: #666; font-size: 14px;">
            Generated on: ${new Date(data.generatedAt).toLocaleDateString()}
        </div>
    </div>

    ${data.patientInfo ? `
    <div class="section">
        <h2 class="section-title">Patient Information</h2>
        ${data.patientInfo.name ? `<p><span class="detail-label">Name:</span> ${data.patientInfo.name}</p>` : ''}
        ${data.patientInfo.age ? `<p><span class="detail-label">Age:</span> ${data.patientInfo.age} years</p>` : ''}
        ${data.patientInfo.conditions?.length ? `
            <p><span class="detail-label">Medical Conditions:</span> ${data.patientInfo.conditions.join(', ')}</p>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2 class="section-title">Current Medications (${data.medications.length})</h2>
        ${data.medications.map(med => `
            <div class="medication-card">
                <div class="medication-name">${med.name}</div>
                <div class="medication-details">
                    <div class="detail-item">
                        <span class="detail-label">Dosage:</span> ${med.dosage}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Frequency:</span> ${med.frequency}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Start Date:</span> ${new Date(med.startDate).toLocaleDateString()}
                    </div>
                    ${med.endDate ? `
                        <div class="detail-item">
                            <span class="detail-label">End Date:</span> ${new Date(med.endDate).toLocaleDateString()}
                        </div>
                    ` : ''}
                    ${med.prescriber ? `
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <span class="detail-label">Prescriber:</span> ${med.prescriber}
                        </div>
                    ` : ''}
                    ${med.notes ? `
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <span class="detail-label">Notes:</span> ${med.notes}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>

    ${data.safetyAlerts.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Safety Alerts (${data.safetyAlerts.length})</h2>
        ${data.safetyAlerts.map(alert => `
            <div class="alert alert-${alert.severity.toLowerCase()}">
                <div style="font-weight: bold; margin-bottom: 5px;">
                    ${alert.type} - ${alert.severity.toUpperCase()} SEVERITY
                </div>
                <div>${alert.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.interactions.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Drug Interactions (${data.interactions.length})</h2>
        ${data.interactions.map(interaction => `
            <div class="interaction">
                <div style="font-weight: bold; margin-bottom: 5px;">
                    ${interaction.medications.join(' + ')} - ${interaction.severity.toUpperCase()}
                </div>
                <div>${interaction.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="disclaimer">
        <strong>Important Disclaimer:</strong> This report is generated based on medication scanning and database matching. 
        It should not replace professional medical advice. Always consult with your healthcare provider before making 
        any changes to your medication regimen. The accuracy of this information depends on correct medication 
        identification and complete medical history.
    </div>

    <div class="footer">
        <p>Generated by Care Capsule - Medication Safety Scanner</p>
        <p>This report contains confidential medical information. Handle with care.</p>
    </div>
</body>
</html>`;
  }

  async printReport(htmlContent: string): Promise<void> {
    // Open the HTML in a new window and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  async downloadReport(reportData: MedicationReport, filename?: string): Promise<void> {
    const htmlContent = this.generateReportHTML(reportData);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `medication-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const pdfService = new PDFService();