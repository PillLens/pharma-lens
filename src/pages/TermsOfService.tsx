import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-accent">
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
          <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Agreement to Terms</h2>
              <p className="mb-4">
                By accessing and using PillLens, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Medical Disclaimer</h2>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
                <p className="font-semibold text-amber-800 mb-2">Important Medical Notice</p>
                <p className="text-amber-700">
                  PillLens is designed to assist with medication identification and management but is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before making any decisions about your medications.
                </p>
              </div>
              <ul className="list-disc pl-6 mb-4">
                <li>This app does not provide medical advice or diagnosis</li>
                <li>Information provided is for educational purposes only</li>
                <li>Always verify medication information with your healthcare provider</li>
                <li>In case of medical emergency, contact emergency services immediately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">3. Acceptable Use</h2>
              <p className="mb-4">
                You agree to use PillLens only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Use the service for any unlawful purpose or activity</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Share false or misleading medication information</li>
                <li>Use the service to distribute malware or harmful content</li>
                <li>Violate any applicable local, national, or international law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">4. User Accounts</h2>
              <p className="mb-4">
                When you create an account with us, you must provide accurate and complete information. You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Safeguarding your password and account information</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Maintaining accurate and up-to-date account information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Limitation of Liability</h2>
              <p className="mb-4">
                To the fullest extent permitted by law, PillLens shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
              </p>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="font-semibold text-red-800 mb-2">Medication Safety Warning</p>
                <p className="text-red-700">
                  Users are solely responsible for verifying medication information and consulting healthcare professionals. PillLens is not liable for medication errors, adverse reactions, or health consequences resulting from app use.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Subscription and Payment</h2>
              <p className="mb-4">
                Some features of PillLens require a paid subscription:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Subscription fees are billed in advance</li>
                <li>You may cancel your subscription at any time</li>
                <li>Refunds are provided according to our refund policy</li>
                <li>Prices may change with advance notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Intellectual Property</h2>
              <p className="mb-4">
                The PillLens service and its original content, features, and functionality are owned by PillLens and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever including but not limited to breach of the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">10. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="mb-2"><strong>Email:</strong> legal@pilllens.com</p>
              <p className="mb-2"><strong>Address:</strong> 123 Health Tech Ave, Medical District, MD 12345</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}