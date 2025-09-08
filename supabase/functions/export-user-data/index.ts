import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";
import { format } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generatePDFReport(userData: any): Promise<Uint8Array> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PillLens - Personal Health Data Export', pageWidth / 2, 25, { align: 'center' });
  
  // Date and user info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth - 20, 35, { align: 'right' });
  doc.text(`User: ${userData.profile?.email || 'N/A'}`, pageWidth - 20, 42, { align: 'right' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 50, pageWidth - 20, 50);
  
  let yPos = 65;
  
  // Profile Information
  if (userData.profile) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFILE INFORMATION', 20, yPos);
    
    const profileData = [
      ['Email:', userData.profile.email || 'N/A'],
      ['Display Name:', userData.profile.display_name || 'N/A'],
      ['Plan:', userData.profile.plan || 'Free'],
      ['Member Since:', userData.profile.created_at ? format(new Date(userData.profile.created_at), 'MMM dd, yyyy') : 'N/A'],
      ['Trial Status:', userData.profile.trial_expires_at ? 
        (new Date(userData.profile.trial_expires_at) > new Date() ? 'Active' : 'Expired') : 'N/A'],
    ];
    
    autoTable(doc, {
      startY: yPos + 10,
      head: [],
      body: profileData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { cellWidth: 'auto' },
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Medications
  if (userData.medications && userData.medications.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICATIONS', 20, yPos);
    
    const medData = userData.medications.map((med: any, index: number) => [
      (index + 1).toString(),
      med.name || 'N/A',
      med.dosage || 'N/A',
      med.frequency || 'N/A',
      med.created_at ? format(new Date(med.created_at), 'MMM dd, yyyy') : 'N/A',
      med.is_active ? 'Active' : 'Inactive',
    ]);
    
    autoTable(doc, {
      startY: yPos + 10,
      head: [['#', 'Medication', 'Dosage', 'Frequency', 'Added', 'Status']],
      body: medData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Adherence Summary
  if (userData.adherenceLog && userData.adherenceLog.length > 0) {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ADHERENCE SUMMARY', 20, yPos);
    
    const totalDoses = userData.adherenceLog.length;
    const takenDoses = userData.adherenceLog.filter((log: any) => log.status === 'taken').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
    
    const summaryData = [
      ['Total Scheduled Doses:', totalDoses.toString()],
      ['Doses Taken:', takenDoses.toString()],
      ['Adherence Rate:', `${adherenceRate}%`],
      ['Recent Activity:', userData.adherenceLog.length > 0 ? 
        format(new Date(userData.adherenceLog[0].created_at), 'MMM dd, yyyy') : 'N/A'],
    ];
    
    autoTable(doc, {
      startY: yPos + 10,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 'auto' },
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Family Groups
  if (userData.familyGroups && userData.familyGroups.length > 0) {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 30;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FAMILY GROUPS', 20, yPos);
    
    const groupData = userData.familyGroups.map((group: any, index: number) => [
      (index + 1).toString(),
      group.name || 'Unnamed Group',
      format(new Date(group.created_at), 'MMM dd, yyyy'),
      'Creator',
    ]);
    
    autoTable(doc, {
      startY: yPos + 10,
      head: [['#', 'Group Name', 'Created', 'Role']],
      body: groupData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Footer with disclaimer
  const finalY = Math.max(yPos, pageHeight - 40);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const disclaimer = 'This report contains personal health information. Please store securely and share only with authorized healthcare providers.';
  doc.text(disclaimer, pageWidth / 2, finalY, { 
    align: 'center',
    maxWidth: pageWidth - 40,
  });
  
  return doc.output('arraybuffer') as Uint8Array;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    // Check rate limit using the database function (5 exports per hour)
    const { data: canProceed, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        p_identifier: user.id,
        p_endpoint: 'export-user-data',
        p_limit: 5,
        p_window_minutes: 60 // 1 hour window
      });

    if (rateLimitError || !canProceed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. You can export your data up to 5 times per hour. Please try again later.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch comprehensive user data
    const [
      { data: profile },
      { data: medications },
      { data: adherenceLog },
      { data: sessions },
      { data: familyGroups },
      { data: familyMembers },
      { data: deviceTokens },
      { data: feedback },
      { data: healthCheckups }
    ] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabaseClient.from('user_medications').select('*').eq('user_id', user.id),
      supabaseClient.from('medication_adherence_log').select('*').eq('user_id', user.id),
      supabaseClient.from('sessions').select('*').eq('user_id', user.id),
      supabaseClient.from('family_groups').select('*').eq('creator_id', user.id),
      supabaseClient.from('family_members').select('*').eq('user_id', user.id),
      supabaseClient.from('device_tokens').select('*').eq('user_id', user.id),
      supabaseClient.from('feedback').select('*').eq('user_id', user.id),
      supabaseClient.from('daily_health_checkups').select('*').eq('user_id', user.id)
    ]);

    const completeUserData = {
      profile,
      medications: medications || [],
      adherenceLog: adherenceLog || [],
      sessions: sessions || [],
      familyGroups: familyGroups || [],
      familyMembers: familyMembers || [],
      deviceTokens: deviceTokens || [],
      feedback: feedback || [],
      healthCheckups: healthCheckups || []
    };

    // Generate PDF content
    console.log('Generating PDF report...');
    const pdfBuffer = await generatePDFReport(completeUserData);
    const fileName = `pilllens-export-${user.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Upload PDF to storage
    console.log('Uploading PDF to storage...');
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('user-exports')
      .upload(`${user.id}/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload export file: ${uploadError.message}`);
    }
    
    console.log('PDF uploaded successfully:', uploadData?.path);

    // Generate signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabaseClient.storage
      .from('user-exports')
      .createSignedUrl(`${user.id}/${fileName}`, 3600);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('URL generation error:', urlError);
      throw new Error('Failed to generate download link');
    }

    // Log export for audit purposes
    await supabaseClient.from('usage_analytics').insert({
      user_id: user.id,
      event_type: 'data_export',
      event_data: {
        format: 'pdf',
        fileName,
        recordCounts: {
          medications: medications?.length || 0,
          adherenceLog: adherenceLog?.length || 0,
          sessions: sessions?.length || 0,
          familyGroups: familyGroups?.length || 0,
          feedback: feedback?.length || 0,
          healthCheckups: healthCheckups?.length || 0
        }
      }
    });

    return new Response(JSON.stringify({ 
      downloadUrl: signedUrlData.signedUrl,
      fileName,
      format: 'pdf',
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      message: 'Your PDF data export is ready for download. Link expires in 1 hour.',
      recordCounts: {
        medications: medications?.length || 0,
        adherenceRecords: adherenceLog?.length || 0,
        scanSessions: sessions?.length || 0,
        familyGroups: familyGroups?.length || 0,
        feedback: feedback?.length || 0,
        healthCheckups: healthCheckups?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to export data. Please try again later.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});