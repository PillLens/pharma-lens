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
      <div className="h-screen bg-gradient-to-br from-background via-primary/5 to-primary-light/10 relative overflow-hidden flex flex-col">
        {/* Background Elements */}
        <div className="fixed inset-0 medical-gradient opacity-30" />
        <div className="fixed -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-primary-light/5 rounded-full blur-3xl" />
        
        {/* Compact Header - 20% */}
        <div className="relative z-10 flex-none px-6 pt-12 pb-4">
          <div className="text-center space-y-3">
            {/* Compact App Icon */}
            <div className="w-16 h-16 mx-auto medical-surface rounded-2xl flex items-center justify-center shadow-soft">
              <Stethoscope className="w-8 h-8 text-primary" />
            </div>
            
            {/* Compact Title */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                <TranslatedText translationKey="app.title" />
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                <TranslatedText translationKey="authPage.subtitle" />
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Area - 65% */}
        <div className="relative z-10 flex-1 px-6 flex flex-col">
          {/* Native Segmented Control */}
          <div className="mb-6">
            <div className="medical-surface p-1.5 rounded-2xl shadow-soft border border-border/20">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActiveTab('signin')}
                  className={`h-11 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === 'signin'
                      ? 'bg-primary text-primary-foreground shadow-medical'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TranslatedText translationKey="auth.signIn" />
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`h-11 rounded-xl font-semibold text-sm transition-all ${
                    activeTab === 'signup'
                      ? 'bg-primary text-primary-foreground shadow-medical'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TranslatedText translationKey="auth.signUp" />
                </button>
              </div>
            </div>
          </div>

          {/* Seamless Form Content */}
          <div className="flex-1 space-y-5">
            {/* Google Sign In */}
            <GoogleSignInButton 
              onClick={handleGoogleSignIn}
              loading={isGoogleLoading}
              variant={activeTab === 'signin' ? 'sign-in' : 'sign-up'}
              className="w-full h-14 text-base font-semibold rounded-2xl shadow-soft"
            />
            
            {/* Compact Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-background text-muted-foreground text-xs font-medium">
                  <TranslatedText translationKey="auth.orContinueWith" />
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp} className="space-y-4 flex-1">
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
                <Alert variant="destructive" className="rounded-2xl border-destructive/30 bg-destructive/10 p-3">
                  <AlertDescription className="font-medium text-center text-sm">{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Action Area - 15% */}
        <div className="relative z-10 flex-none px-6 pb-8 pt-4 space-y-4">
          {/* Primary Action Button */}
          <MobileButton
            type="submit"
            variant="medical"
            size="xl"
            className="w-full h-14 text-base font-bold rounded-2xl shadow-glow medical-button"
            disabled={isLoading}
            loading={isLoading}
            haptic
            onClick={activeTab === 'signin' ? handleSignIn : handleSignUp}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <TranslatedText translationKey={activeTab === 'signin' ? 'authPage.signingIn' : 'authPage.creatingAccount'} />
              ) : (
                <>
                  <TranslatedText translationKey={activeTab === 'signin' ? 'authPage.signInSecurely' : 'authPage.createSecureAccount'} />
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </span>
          </MobileButton>

          {/* Compact Security Indicator */}
          <div className="flex items-center justify-center gap-3 opacity-70">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">
              <TranslatedText translationKey="authPage.medicalGradeSecurity" />
            </span>
            <div className="w-2 h-2 bg-success rounded-full" />
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