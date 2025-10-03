import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { Activity, Pill } from 'lucide-react';

interface MedicationStats {
  category: string;
  count: number;
  color: string;
}

interface MedicationStatsChartProps {
  data: MedicationStats[];
  className?: string;
}

export const MedicationStatsChart: React.FC<MedicationStatsChartProps> = ({ data, className }) => {
  const totalMedications = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = totalMedications > 0 
        ? Math.round((payload[0].value / totalMedications) * 100)
        : 0;
      
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{payload[0].payload.category}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-semibold">{payload[0].value}</span> medications
            </p>
            <p className="text-xs text-muted-foreground">
              {percentage}% of total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">
            <TranslatedText translationKey="dashboard.stats.byCategory" fallback="Medications by Category" />
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="text-2xl font-bold text-foreground">{totalMedications}</div>
          <div className="text-sm text-muted-foreground">
            <TranslatedText translationKey="dashboard.stats.total" fallback="total medications" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                <TranslatedText 
                  translationKey="dashboard.stats.noData" 
                  fallback="No medication data available" 
                />
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.map((item) => (
              <div key={item.category} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground truncate">
                  {item.category} ({item.count})
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
