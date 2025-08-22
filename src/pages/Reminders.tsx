import React from 'react';
import { MedicationReminders } from '@/components/MedicationReminders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock, Pill } from 'lucide-react';

const Reminders = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/30 to-secondary-light/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medication Reminders</h1>
              <p className="text-muted-foreground">Never miss a dose with smart notifications</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">0</h3>
                  <p className="text-muted-foreground">Active Reminders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-light flex items-center justify-center">
                  <Pill className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">0</h3>
                  <p className="text-muted-foreground">Medications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
                  <Bell className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">0</h3>
                  <p className="text-muted-foreground">Today's Doses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <MedicationReminders />
      </div>
    </div>
  );
};

export default Reminders;