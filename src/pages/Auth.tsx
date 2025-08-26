import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslatedText } from '@/components/TranslatedText';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { MobileCard } from '@/components/ui/mobile/MobileCard';
import { MobileLoadingState } from '@/components/ui/mobile/MobileLoadingState';
import { TouchOptimizedInput } from '@/components/ui/mobile/TouchOptimizedInput';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, Stethoscope, Fingerprint, Lock, Eye, EyeOff, Mail, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export default function Auth() {
  const { signUp, signIn, signInWithGoogle, user, loading } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('signin');

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: t('toast.accountCreated'),
        description: t('toast.checkEmail'),
      });
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: t('toast.welcomeBack'),
        description: t('toast.signedIn'),
      });
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');

    const { error } = await signInWithGoogle();
    
    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
    // Note: Don't set loading to false here as the redirect will happen
  };

  if (loading) {
    return <MobileLoadingState message={t('common.initializing')} type="medical" />;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary-light/10 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="fixed inset-0 medical-gradient opacity-40" />
        <div className="fixed top-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="fixed bottom-10 left-10 w-80 h-80 bg-primary-light/10 rounded-full blur-3xl" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen bg-gradient-to-r from-primary/5 via-transparent to-primary-light/5 rounded-full blur-3xl" />
        
        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Hero Header */}
          <div className="flex-none px-8 pt-16 pb-8">
            <div className="text-center space-y-6">
              {/* Premium App Icon */}
              <div className="w-32 h-32 mx-auto medical-surface rounded-3xl flex items-center justify-center shadow-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary-light/10" />
                <Stethoscope className="w-16 h-16 text-primary relative z-10" />
                <div className="absolute top-2 right-2 w-3 h-3 bg-success rounded-full shadow-success" />
              </div>
              
              {/* Enhanced Title */}
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground leading-tight">
                  <TranslatedText translationKey="app.title" />
                </h1>
                <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
                  <TranslatedText translationKey="authPage.subtitle" />
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">HIPAA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm font-semibold text-success">Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-light" />
                  <span className="text-sm font-semibold text-primary-light">AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Native Mobile Auth Section */}
          <div className="flex-1 px-6">
            {/* Native Segmented Control */}
            <div className="mb-8">
              <div className="medical-surface p-2 rounded-3xl shadow-soft border border-border/20">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('signin')}
                    className={`h-12 rounded-2xl font-semibold text-base relative overflow-hidden ${
                      activeTab === 'signin'
                        ? 'bg-primary text-primary-foreground shadow-medical'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <TranslatedText translationKey="auth.signIn" />
                  </button>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`h-12 rounded-2xl font-semibold text-base relative overflow-hidden ${
                      activeTab === 'signup'
                        ? 'bg-primary text-primary-foreground shadow-medical'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <TranslatedText translationKey="auth.signUp" />
                  </button>
                </div>
              </div>
            </div>

            {/* Auth Form Container */}
            <MobileCard variant="medical" className="backdrop-blur-xl border-border/20 shadow-elevated">
              <div className="p-8 space-y-8">
                {/* Google Sign In - More Prominent */}
                <div className="space-y-4">
                  <GoogleSignInButton 
                    onClick={handleGoogleSignIn}
                    loading={isGoogleLoading}
                    variant={activeTab === 'signin' ? 'sign-in' : 'sign-up'}
                    className="w-full h-16 text-lg font-bold rounded-3xl shadow-elevated"
                  />
                  
                  {/* Enhanced Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-6 bg-card text-muted-foreground font-semibold text-sm">
                        <TranslatedText translationKey="auth.orContinueWith" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp} className="space-y-6">
                  <TouchOptimizedInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('authPage.emailPlaceholder')}
                    label={t('authPage.emailAddress')}
                    leftIcon={<Mail className="w-5 h-5" />}
                    medical
                    required
                  />
                  
                  <TouchOptimizedInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeTab === 'signin' ? t('authPage.passwordPlaceholder') : t('authPage.createPasswordPlaceholder')}
                    label={activeTab === 'signin' ? t('auth.password') : t('authPage.createPassword')}
                    leftIcon={<Lock className="w-5 h-5" />}
                    showPasswordToggle
                    medical
                    helperText={activeTab === 'signup' ? t('authPage.passwordRequirements') : undefined}
                    required
                    minLength={6}
                  />
                  
                  {error && (
                    <Alert variant="destructive" className="rounded-3xl border-destructive/30 bg-destructive/10 p-4">
                      <AlertDescription className="font-medium text-center">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Enhanced Primary Button */}
                  <MobileButton
                    type="submit"
                    variant="medical"
                    size="xl"
                    className="w-full h-16 text-lg font-bold rounded-3xl shadow-glow medical-button"
                    disabled={isLoading}
                    loading={isLoading}
                    haptic
                  >
                    <span className="flex items-center justify-center gap-3">
                      {isLoading ? (
                        <TranslatedText translationKey={activeTab === 'signin' ? 'authPage.signingIn' : 'authPage.creatingAccount'} />
                      ) : (
                        <>
                          <TranslatedText translationKey={activeTab === 'signin' ? 'authPage.signInSecurely' : 'authPage.createSecureAccount'} />
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </span>
                  </MobileButton>
                </form>
              </div>
            </MobileCard>
          </div>

          {/* Enhanced Security Footer */}
          <div className="flex-none px-6 py-8">
            <div className="medical-surface rounded-3xl p-6 border border-border/20 shadow-soft">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">
                      <TranslatedText translationKey="authPage.medicalGradeSecurity" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      End-to-end encrypted
                    </p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-success rounded-full shadow-success" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-accent p-4">
      <MobileCard className="w-full max-w-md shadow-elevated">
        <div className="p-6">
            <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <Stethoscope className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-primary">
                <TranslatedText translationKey="app.title" />
              </h1>
            </div>
             <h2 className="text-xl font-semibold">
               <TranslatedText translationKey="authPage.welcomeMessage" />
             </h2>
             <p className="text-muted-foreground mt-2">
               <TranslatedText translationKey="authPage.welcomeDescription" />
             </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">
                <TranslatedText translationKey="auth.signIn" />
              </TabsTrigger>
              <TabsTrigger value="signup">
                <TranslatedText translationKey="auth.signUp" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {/* Google Sign In Button */}
              <div className="mt-4 space-y-4">
                <GoogleSignInButton 
                  onClick={handleGoogleSignIn}
                  loading={isGoogleLoading}
                  variant="sign-in"
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">
                      <TranslatedText translationKey="auth.orContinueWith" />
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="desktop-email">
                    <TranslatedText translationKey="auth.email" />
                  </Label>
                  <Input
                    id="desktop-email"
                    type="email"
                     placeholder={t('authPage.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desktop-password">
                    <TranslatedText translationKey="auth.password" />
                  </Label>
                  <Input
                    id="desktop-password"
                    type="password"
                    placeholder={t('authPage.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <MobileButton type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
                  {isLoading ? <TranslatedText translationKey="authPage.signingIn" /> : <TranslatedText translationKey="auth.signIn" />}
                </MobileButton>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {/* Google Sign Up Button */}
              <div className="mt-4 space-y-4">
                <GoogleSignInButton 
                  onClick={handleGoogleSignIn}
                  loading={isGoogleLoading}
                  variant="sign-up"
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">
                      <TranslatedText translationKey="auth.orContinueWith" />
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="desktop-signup-email">
                    <TranslatedText translationKey="auth.email" />
                  </Label>
                  <Input
                    id="desktop-signup-email"
                    type="email"
                    placeholder={t('authPage.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desktop-signup-password">
                    <TranslatedText translationKey="authPage.createPassword" />
                  </Label>
                  <Input
                    id="desktop-signup-password"
                    type="password"
                    placeholder={t('authPage.createPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    <TranslatedText translationKey="authPage.passwordRequirements" />
                  </p>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <MobileButton type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
                  {isLoading ? <TranslatedText translationKey="authPage.creatingAccount" /> : <TranslatedText translationKey="auth.signUp" />}
                </MobileButton>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* Desktop Security Indicator */}
          <div className="mt-6 p-4 medical-surface rounded-lg border border-border/20 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              <TranslatedText translationKey="authPage.dataEncryption" />
            </span>
            <span className="text-xs text-muted-foreground">
              <TranslatedText translationKey="authPage.medicalGradeSecurity" />
            </span>
          </div>
        </div>
      </MobileCard>
    </div>
  );
}