import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdherenceData {
  date: string;
  rate: number;
  taken: number;
  total: number;
}

interface AdherenceTrendChartProps {
  data: AdherenceData[];
  className?: string;
}

export const AdherenceTrendChart: React.FC<AdherenceTrendChartProps> = ({ data, className }) => {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7');

  const filteredData = data.slice(-parseInt(timeRange));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{payload[0].payload.date}</p>
          <div className="space-y-1">
            <p className="text-sm text-success">
              <span className="font-semibold">{payload[0].value}%</span> adherence
            </p>
            <p className="text-xs text-muted-foreground">
              {payload[0].payload.taken}/{payload[0].payload.total} doses taken
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const averageRate = filteredData.length > 0 
    ? Math.round(filteredData.reduce((sum, d) => sum + d.rate, 0) / filteredData.length)
    : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              <TranslatedText translationKey="dashboard.trends.adherence" fallback="Adherence Trend" />
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {(['7', '30', '90'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="h-8 text-xs"
              >
                {range}d
              </Button>
            ))}
          </div>
        </div>
        
        {/* Average rate badge */}
        <div className="flex items-center gap-2 mt-2">
          <div className="text-2xl font-bold text-foreground">{averageRate}%</div>
          <div className="text-sm text-muted-foreground">
            <TranslatedText translationKey="dashboard.trends.average" fallback="avg. adherence" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                <TranslatedText 
                  translationKey="dashboard.trends.noData" 
                  fallback="No adherence data available" 
                />
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                fill="url(#colorRate)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>
                <TranslatedText translationKey="dashboard.trends.adherenceRate" fallback="Adherence Rate" />
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
