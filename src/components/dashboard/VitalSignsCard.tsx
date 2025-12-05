import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Plus, Heart, Droplet, TrendingUp } from 'lucide-react';
import { useVitalSigns } from '@/hooks/useVitalSigns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { VitalSignsFormSheet } from './VitalSignsFormSheet';

export function VitalSignsCard() {
  const { vitalSigns, loading, refetch } = useVitalSigns(7);
  const [showForm, setShowForm] = useState(false);

  const bloodPressureData = vitalSigns
    .filter(vs => vs.blood_pressure_systolic && vs.blood_pressure_diastolic)
    .map(vs => ({
      date: format(new Date(vs.recorded_at), 'MMM dd'),
      systolic: vs.blood_pressure_systolic,
      diastolic: vs.blood_pressure_diastolic,
    }))
    .reverse();

  const latestVitalSign = vitalSigns[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Vital Signs</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record
          </Button>
        </div>
        <CardDescription>Track your health measurements</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-4">Loading vital signs...</div>
        ) : vitalSigns.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vital signs recorded yet</p>
            <p className="text-sm mt-2">Start tracking your health measurements</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest readings */}
            {latestVitalSign && (
              <div className="grid grid-cols-2 gap-4">
                {latestVitalSign.blood_pressure_systolic && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Pressure</p>
                      <p className="text-sm font-semibold">
                        {latestVitalSign.blood_pressure_systolic}/{latestVitalSign.blood_pressure_diastolic}
                      </p>
                    </div>
                  </div>
                )}
                {latestVitalSign.heart_rate && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Activity className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="text-sm font-semibold">{latestVitalSign.heart_rate} bpm</p>
                    </div>
                  </div>
                )}
                {latestVitalSign.blood_glucose && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Droplet className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Glucose</p>
                      <p className="text-sm font-semibold">{latestVitalSign.blood_glucose} mg/dL</p>
                    </div>
                  </div>
                )}
                {latestVitalSign.weight && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="text-sm font-semibold">{latestVitalSign.weight} kg</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blood pressure trend */}
            {bloodPressureData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Blood Pressure Trend (7 days)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={bloodPressureData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Systolic"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Diastolic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <VitalSignsFormSheet 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onSuccess={refetch}
      />
    </Card>
  );
}
