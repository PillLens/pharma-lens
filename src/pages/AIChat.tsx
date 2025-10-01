import React from 'react';
import { PageSEO } from '@/components/seo/PageSEO';
import { EnhancedVoiceInterface } from '@/components/voice/EnhancedVoiceInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Mic, Shield, Sparkles } from 'lucide-react';
import { TranslatedText } from '@/components/TranslatedText';

const AIChat = () => {
  return (
    <>
      <PageSEO
        title="AI Chat Assistant - PillLens"
        description="Speak with PillLens AI assistant using voice. Get instant answers about your medications, health questions, and medication management."
        keywords={['AI chat', 'voice assistant', 'medication AI', 'health chatbot', 'ElevenLabs', 'voice chat']}
        path="/ai-chat"
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              <TranslatedText translationKey="navigation.aiChat" />
            </h1>
          </div>
          <p className="text-muted-foreground">
            Speak naturally with PillLens AI. Ask questions about your medications, get health guidance, and manage your care.
          </p>
        </div>

        {/* Feature Highlights */}
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

        {/* Voice Interface */}
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
      </div>
    </>
  );
};

export default AIChat;
