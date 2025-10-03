import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export const VideoDemoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const highlights = [
    'Scan any medication in seconds',
    'Get instant, accurate information',
    'Set smart reminders automatically',
    'Share with family members'
  ];

  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          See PillLens in Action
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Watch how easy it is to manage your medications with our intelligent app
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Video Player */}
        <Card className="relative overflow-hidden border-border/50 shadow-elegant">
          <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary-light/10 flex items-center justify-center">
            {!isPlaying ? (
              <Button
                size="lg"
                onClick={() => setIsPlaying(true)}
                className="w-20 h-20 rounded-full bg-primary hover:bg-primary-dark shadow-elegant"
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </Button>
            ) : (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <p className="text-lg mb-2">Video Demo</p>
                  <p className="text-sm text-white/70">
                    Connect your demo video here
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 text-white border-white/20 hover:bg-white/10"
                    onClick={() => setIsPlaying(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Video Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-foreground">2 minute overview</span>
            </div>
          </div>
        </Card>

        {/* Key Features */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Everything you need in one app
          </h3>

          {highlights.map((highlight, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  {highlight}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {index === 0 && "Use your camera to instantly identify any pill bottle or package"}
                  {index === 1 && "Access FDA-approved data with 99.2% accuracy in real-time"}
                  {index === 2 && "AI-powered scheduling adapts to your daily routine"}
                  {index === 3 && "Coordinate care with loved ones and caregivers securely"}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Button size="lg" className="w-full sm:w-auto">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
