import React from 'react';
import { AppMetadata } from '@/components/seo/AppMetadata';

/**
 * Dedicated page for app information and metadata - accessible to AI crawlers
 */
const AppInfo = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppMetadata />
      
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">PillLens</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Scan, understand, and never miss a dose with PillLens.
          </p>
          <p className="text-lg text-muted-foreground">
            Advanced medication management app for better health outcomes
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Core Features</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-primary mr-2">📸</span>
                <div>
                  <strong>Pill Scanner:</strong> Scan medication pills using camera to identify them instantly
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">📋</span>
                <div>
                  <strong>Usage Instructions:</strong> Get detailed information on how to take medications and what they're for
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">⏰</span>
                <div>
                  <strong>Smart Reminders:</strong> Set up intelligent medication reminders with customizable schedules
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">👨‍👩‍👧‍👦</span>
                <div>
                  <strong>Family Plan Support:</strong> Manage medication schedules for multiple family members from one account
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">🌍</span>
                <div>
                  <strong>Multi-language Support:</strong> Available in English, Azerbaijani, Russian, and Turkish
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Use Cases</h2>
            <ul className="space-y-3">
              <li>
                <strong>Medication Identification:</strong> Scan unknown pills to instantly identify them and get safety information
              </li>
              <li>
                <strong>Adherence Management:</strong> Set up smart reminders to never miss medication doses and track compliance
              </li>
              <li>
                <strong>Family Caregiving:</strong> Manage medication schedules for multiple family members, especially elderly relatives
              </li>
              <li>
                <strong>Multilingual Support:</strong> Access medication information in preferred language for non-English speakers
              </li>
              <li>
                <strong>Healthcare Coordination:</strong> Share medication schedules with healthcare providers and caregivers
              </li>
            </ul>
          </section>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Target Audience</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Patients</h3>
              <p className="text-sm text-muted-foreground">Managing multiple medications and chronic conditions</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Caregivers</h3>
              <p className="text-sm text-muted-foreground">Managing family health and elderly care</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Healthcare Providers</h3>
              <p className="text-sm text-muted-foreground">Supporting patient medication adherence</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Elderly Users</h3>
              <p className="text-sm text-muted-foreground">Needing medication reminders and assistance</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Multilingual Families</h3>
              <p className="text-sm text-muted-foreground">Accessing health information in native languages</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Chronic Condition Patients</h3>
              <p className="text-sm text-muted-foreground">Requiring consistent medication management</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Platform Availability</h2>
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-primary/10 rounded-lg">
              📱 Android
            </div>
            <div className="px-4 py-2 bg-primary/10 rounded-lg">
              🍎 iOS
            </div>
            <div className="px-4 py-2 bg-primary/10 rounded-lg">
              🌐 Web App
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Keywords for AI Discovery</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'pill scanner app',
              'medication reminder',
              'pill identifier',
              'medication management',
              'family health app',
              'medication adherence',
              'pill recognition',
              'healthcare app',
              'elderly care app',
              'multilingual medication app'
            ].map((keyword) => (
              <span key={keyword} className="px-3 py-1 bg-muted rounded-full text-sm">
                {keyword}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AppInfo;