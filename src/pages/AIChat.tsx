import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { EnhancedVoiceInterface } from '@/components/voice/EnhancedVoiceInterface';
import { EnhancedMobileVoiceInterface } from '@/components/mobile/EnhancedMobileVoiceInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Mic, Shield, Sparkles } from 'lucide-react';
import { TranslatedText } from '@/components/TranslatedText';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const AIChat = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <PageSEO
        title="AI Chat Assistant - PillLens"
        description="Speak with PillLens AI assistant using voice. Get instant answers about your medications, health questions, and medication management."
        keywords={['AI chat', 'voice assistant', 'medication AI', 'health chatbot', 'ElevenLabs', 'voice chat']}
        path="/ai-chat"
      />

      <div className={cn(
        "container mx-auto px-4 py-6",
        isMobile ? "max-w-full pb-32" : "max-w-7xl"
      )}>
        {/* Header */}
        <div className={cn("mb-6", isMobile && "mb-4")}>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "rounded-full bg-primary/10 flex items-center justify-center",
              isMobile ? "w-8 h-8" : "w-10 h-10"
            )}>
              <Bot className={cn("text-primary", isMobile ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <h1 className={cn(
              "font-bold text-foreground",
              isMobile ? "text-xl" : "text-3xl"
            )}>
              <TranslatedText translationKey="navigation.aiChat" />
            </h1>
          </div>
          {!isMobile && (
            <p className="text-muted-foreground">
              Speak naturally with PillLens AI. Ask questions about your medications, get health guidance, and manage your care.
            </p>
          )}
        </div>

        {/* Feature Highlights - Desktop Only */}
        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Voice-First</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Natural voice conversations powered by OpenAI and ElevenLabs premium voices
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Smart Assistant</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Get medication info, drug interactions, reminders, and health guidance
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Private & Secure</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Your conversations are encrypted and never shared with third parties
              </CardDescription>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Voice Interface - Conditional Rendering */}
        {isMobile ? (
          <EnhancedMobileVoiceInterface />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Voice Chat
              </CardTitle>
              <CardDescription>
                Click "Start Voice Chat" below to begin your conversation. Grant microphone access when prompted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedVoiceInterface />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AIChat;
