import { ArrowLeft, Shield, Heart, Lock, Database, Trash2, Baby, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              <strong>Last updated:</strong> December 5, 2024
            </p>

            {/* Medical Disclaimer - PROMINENT */}
            <Card className="p-6 mb-8 bg-warning/10 border-warning/30">
              <div className="flex items-start gap-4">
                <Heart className="w-8 h-8 text-warning flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">Important Medical Disclaimer</h2>
                  <p className="text-foreground mb-3">
                    <strong>PillLens is a medication management tool and does NOT:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-foreground space-y-2">
                    <li>Provide medical diagnosis or medical advice</li>
                    <li>Replace consultation with qualified healthcare professionals</li>
                    <li>Guarantee the accuracy of medication identification</li>
                    <li>Serve as a substitute for professional medical judgment</li>
                  </ul>
                  <p className="text-muted-foreground text-sm">
                    Always consult your doctor, pharmacist, or other qualified healthcare provider with any questions about your medications or medical conditions. Never disregard professional medical advice or delay seeking it because of information provided by this app.
                  </p>
                </div>
              </div>
            </Card>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
              </div>
              <p className="mb-4 text-foreground">
                PillLens collects information to provide medication management services. We collect:
              </p>
              
              <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Account Information</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Email address and account credentials</li>
                <li>Profile information (name, preferences)</li>
                <li>Device information for notifications</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Health & Medication Data</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Medication names, dosages, and schedules</li>
                <li>Medication scan history and images</li>
                <li>Vital signs (blood pressure, heart rate, weight, etc.)</li>
                <li>Daily health checkup data</li>
                <li>Medication adherence records</li>
                <li>Drug interaction check results</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Usage Data</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>App usage patterns and feature interactions</li>
                <li>Reminder responses and acknowledgments</li>
                <li>Camera access for medication scanning only</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
              </div>
              <p className="mb-4 text-foreground">
                We use collected information exclusively for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>Medication identification:</strong> Analyzing scanned images to identify medications</li>
                <li><strong>Reminder services:</strong> Sending medication reminders at scheduled times</li>
                <li><strong>Safety alerts:</strong> Checking for potential drug interactions</li>
                <li><strong>Adherence tracking:</strong> Helping you monitor medication compliance</li>
                <li><strong>Family coordination:</strong> Enabling caregivers to assist with medication management</li>
                <li><strong>Service improvement:</strong> Enhancing app features and user experience</li>
              </ul>
              <p className="text-muted-foreground">
                <strong>We do NOT use your health data for advertising or sell it to third parties.</strong>
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">3. Data Security</h2>
              </div>
              <p className="mb-4 text-foreground">
                Your health information is protected with industry-standard security measures:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li><strong>Secure infrastructure:</strong> Data stored on secure, SOC 2 compliant servers</li>
                <li><strong>Access controls:</strong> Strict authentication and authorization protocols</li>
                <li><strong>Regular audits:</strong> Periodic security assessments and vulnerability testing</li>
                <li><strong>Employee training:</strong> Staff trained on data protection best practices</li>
              </ul>
              <p className="text-muted-foreground">
                We follow healthcare industry security standards to protect your sensitive medical information.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">4. Data Retention</h2>
              </div>
              <p className="mb-4 text-foreground">
                We retain your information as follows:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>Active accounts:</strong> Data retained while your account is active</li>
                <li><strong>Medication history:</strong> Kept for the duration of your account for adherence tracking</li>
                <li><strong>Scan images:</strong> Processed for identification and then stored securely</li>
                <li><strong>Account deletion:</strong> All personal data permanently deleted within 30 days of account deletion request</li>
              </ul>
              <p className="text-muted-foreground">
                You can request data export or deletion at any time through the app settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Information Sharing</h2>
              <p className="mb-4 text-foreground">
                We do not sell, trade, or transfer your personal information except:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>With your consent:</strong> Family members you explicitly add to your care network</li>
                <li><strong>Service providers:</strong> Trusted partners who assist in app operations (under strict confidentiality agreements)</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect safety</li>
                <li><strong>Emergency situations:</strong> To emergency contacts you have designated</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">6. Your Rights</h2>
              </div>
              <p className="mb-4 text-foreground">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li><strong>Access:</strong> View all personal data we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request permanent deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in a portable format (PDF, CSV)</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to specific data processing activities</li>
              </ul>
              <p className="text-muted-foreground">
                Exercise these rights through Settings → Privacy & Security in the app.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Baby className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">7. Children's Privacy</h2>
              </div>
              <p className="mb-4 text-foreground">
                PillLens takes children's privacy seriously:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Users must be 13 years or older to create an account</li>
                <li>Children under 18 should use the app under parental/guardian supervision</li>
                <li>Parents/guardians can manage children's medication data through family features</li>
                <li>We do not knowingly collect personal information from children under 13</li>
              </ul>
              <p className="text-muted-foreground">
                If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Third-Party Services</h2>
              <p className="mb-4 text-muted-foreground">
                PillLens may use third-party services for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Authentication (Google Sign-In)</li>
                <li>Cloud storage and database services</li>
                <li>Push notification delivery</li>
                <li>Analytics (anonymized usage data only)</li>
              </ul>
              <p className="text-muted-foreground">
                These services have their own privacy policies and are selected for their commitment to data protection.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to This Policy</h2>
              <p className="mb-4 text-muted-foreground">
                We may update this Privacy Policy periodically. We will notify you of significant changes through:
              </p>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>In-app notifications</li>
                <li>Email notifications (for registered users)</li>
                <li>Updated "Last modified" date on this page</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
              </div>
              <p className="mb-4 text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices:
              </p>
              <p className="mb-2 text-muted-foreground"><strong>Email:</strong> privacy@pilllens.app</p>
              <p className="mb-2 text-muted-foreground"><strong>Support:</strong> support@pilllens.app</p>
            </section>

            {/* Final Disclaimer Box */}
            <Card className="p-4 bg-muted/50 border-border">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Reminder:</strong> PillLens is designed to assist with medication management and does not provide medical diagnosis or replace professional healthcare advice. Always consult qualified healthcare providers for medical decisions.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
