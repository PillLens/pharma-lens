import React, { useState, useEffect } from 'react';
import { Activity, Heart, ThermometerSun, Scale, Moon, Smile, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { familySharingService, FamilyGroup } from '@/services/familySharingService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DailyCheckupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  familyGroups: FamilyGroup[];
  selectedMember?: string;
}

interface DailyCheckupData {
  mood: number;
  energy: number;
  pain: number;
  sleep: number;
  appetite: number;
  stress: number;
  symptoms: string;
  notes: string;
  medications_taken: boolean;
}

export const DailyCheckupSheet: React.FC<DailyCheckupSheetProps> = ({
  isOpen,
  onClose,
  familyGroups,
  selectedMember
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkupData, setCheckupData] = useState<DailyCheckupData>({
    mood: 5,
    energy: 5,
    pain: 1,
    sleep: 5,
    appetite: 5,
    stress: 3,
    symptoms: '',
    notes: '',
    medications_taken: true
  });

  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      checkTodaysCheckup();
    }
  }, [isOpen, user]);

  const checkTodaysCheckup = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check database first
      const { data: existingCheckup, error } = await supabase
        .from('daily_health_checkups')
        .select('*')
        .eq('user_id', user.id)
        .eq('checkup_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching checkup from database:', error);
        return;
      }

      if (existingCheckup) {
        setHasCompletedToday(true);
        setCheckupData({
          mood: existingCheckup.mood_score,
          energy: existingCheckup.energy_level,
          pain: existingCheckup.pain_level,
          sleep: existingCheckup.sleep_quality,
          appetite: existingCheckup.appetite_level,
          stress: existingCheckup.stress_level,
          symptoms: existingCheckup.symptoms || '',
          notes: existingCheckup.notes || '',
          medications_taken: existingCheckup.medications_taken
        });
      } else {
        setHasCompletedToday(false);
      }
    } catch (error) {
      console.error('Error checking today\'s checkup:', error);
    }
  };

  const handleSubmitCheckup = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const overallWellnessScore = Math.round(
        (checkupData.mood + checkupData.energy + (10 - checkupData.pain) + 
         checkupData.sleep + checkupData.appetite + (10 - checkupData.stress)) / 6
      );

      const checkupRecord = {
        user_id: user.id,
        checkup_date: today,
        mood_score: checkupData.mood,
        energy_level: checkupData.energy,
        pain_level: checkupData.pain,
        sleep_quality: checkupData.sleep,
        appetite_level: checkupData.appetite,
        stress_level: checkupData.stress,
        symptoms: checkupData.symptoms || null,
        notes: checkupData.notes || null,
        medications_taken: checkupData.medications_taken,
        overall_wellness_score: overallWellnessScore
      };

      // Save to database - upsert to handle both insert and update
      const { error: dbError } = await supabase
        .from('daily_health_checkups')
        .upsert(checkupRecord, {
          onConflict: 'user_id,checkup_date'
        });

      if (dbError) {
        console.error('Database error saving checkup:', dbError);
        throw new Error('Failed to save checkup to database');
      }
      
      toast({
        title: hasCompletedToday ? 'Daily Checkup Updated' : 'Daily Checkup Completed',
        description: hasCompletedToday 
          ? 'Your health checkup has been updated successfully.'
          : 'Your health checkup has been recorded successfully.',
      });

      // Notify family members if any
      if (familyGroups.length > 0) {
        for (const group of familyGroups) {
          if (group.members) {
            for (const member of group.members) {
              if (member.user_id !== user.id && member.permissions.receive_alerts) {
                // Send notification to family member
                await supabase.functions.invoke('send-push-notification', {
                  body: {
                    user_id: member.user_id,
                    title: 'Daily Health Update',
                    body: `${user.email} completed their daily health checkup`,
                    data: { 
                      type: 'daily_checkup',
                      family_group_id: group.id,
                      wellness_score: checkupRecord.overall_wellness_score
                    }
                  }
                });
              }
            }
          }
        }
      }

      setHasCompletedToday(true);
      onClose();
    } catch (error) {
      console.error('Error submitting checkup:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your daily checkup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (value: number, isReverse: boolean = false) => {
    if (isReverse) {
      if (value <= 3) return 'text-success';
      if (value <= 6) return 'text-warning';
      return 'text-destructive';
    } else {
      if (value >= 7) return 'text-success';
      if (value >= 4) return 'text-warning';
      return 'text-destructive';
    }
  };

  const getScoreBadge = (value: number, isReverse: boolean = false) => {
    if (isReverse) {
      if (value <= 3) return { text: 'Good', color: 'bg-success/10 text-success' };
      if (value <= 6) return { text: 'Moderate', color: 'bg-warning/10 text-warning' };
      return { text: 'High', color: 'bg-destructive/10 text-destructive' };
    } else {
      if (value >= 7) return { text: 'Great', color: 'bg-success/10 text-success' };
      if (value >= 4) return { text: 'Good', color: 'bg-warning/10 text-warning' };
      return { text: 'Low', color: 'bg-destructive/10 text-destructive' };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Daily Wellness Check-up
            {hasCompletedToday && (
              <Badge className="bg-success/10 text-success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed Today
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="text-sm text-muted-foreground">
            Track your daily wellness and share updates with your family care network.
          </div>

          {/* Wellness Metrics */}
          <div className="space-y-6">
            {/* Mood */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smile className="w-4 h-4" />
                  Mood
                  <Badge className={getScoreBadge(checkupData.mood).color}>
                    {getScoreBadge(checkupData.mood).text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Slider
                    value={[checkupData.mood]}
                    onValueChange={([value]) => setCheckupData(prev => ({ ...prev, mood: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Very Low</span>
                    <span className={getScoreColor(checkupData.mood)}>{checkupData.mood}/10</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Energy Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Energy Level
                  <Badge className={getScoreBadge(checkupData.energy).color}>
                    {getScoreBadge(checkupData.energy).text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Slider
                    value={[checkupData.energy]}
                    onValueChange={([value]) => setCheckupData(prev => ({ ...prev, energy: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Exhausted</span>
                    <span className={getScoreColor(checkupData.energy)}>{checkupData.energy}/10</span>
                    <span>Energetic</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pain Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pain Level
                  <Badge className={getScoreBadge(checkupData.pain, true).color}>
                    {getScoreBadge(checkupData.pain, true).text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Slider
                    value={[checkupData.pain]}
                    onValueChange={([value]) => setCheckupData(prev => ({ ...prev, pain: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>No Pain</span>
                    <span className={getScoreColor(checkupData.pain, true)}>{checkupData.pain}/10</span>
                    <span>Severe</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sleep Quality */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Sleep Quality
                  <Badge className={getScoreBadge(checkupData.sleep).color}>
                    {getScoreBadge(checkupData.sleep).text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Slider
                    value={[checkupData.sleep]}
                    onValueChange={([value]) => setCheckupData(prev => ({ ...prev, sleep: value }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Poor</span>
                    <span className={getScoreColor(checkupData.sleep)}>{checkupData.sleep}/10</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Symptoms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Any Symptoms Today?</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe any symptoms you're experiencing..."
                  value={checkupData.symptoms}
                  onChange={(e) => setCheckupData(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any other observations about your health today..."
                  value={checkupData.notes}
                  onChange={(e) => setCheckupData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitCheckup} 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Saving...' : hasCompletedToday ? 'Update Checkup' : 'Complete Daily Checkup'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DailyCheckupSheet;