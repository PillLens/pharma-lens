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
import { Loader2, Shield, Stethoscope, Fingerprint, Lock, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
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
      <ProfessionalMobileLayout showHeader={false} className="bg-gradient-medical">
        {/* Background Elements */}
        <div className="fixed inset-0 medical-gradient opacity-30" />
        <div className="fixed top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-medical-pulse" />
        <div className="fixed bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-medical-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Scrollable Content */}
        <div className="relative z-10 min-h-screen overflow-y-auto safe-area-padding">
          {/* Hero Section */}
          <div className="px-6 pt-12 pb-8">
            <div className="text-center">
              {/* App Icon */}
              <div className="w-24 h-24 mx-auto mb-6 medical-surface rounded-3xl flex items-center justify-center shadow-medical animate-fade-in">
                <Stethoscope className="w-12 h-12 text-primary animate-medical-pulse" />
              </div>
              
              {/* Title */}
              <h1 className="text-3xl font-bold text-foreground mb-3 animate-fade-in">
                <TranslatedText translationKey="app.title" />
              </h1>
              
              {/* Subtitle */}
              <p className="text-muted-foreground text-lg mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <TranslatedText translationKey="authPage.subtitle" />
              </p>
            </div>
          </div>

          {/* Main Auth Card */}
          <div className="px-6 pb-8">
            <MobileCard 
              variant="medical" 
              className="backdrop-blur-md border-border/20 animate-scale-in"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="p-6">
                {/* Tab Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 medical-surface p-1 rounded-2xl mb-8">
                    <TabsTrigger value="signin" className="rounded-xl py-3 px-4 text-base font-medium">
                      <TranslatedText translationKey="auth.signIn" />
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-xl py-3 px-4 text-base font-medium">
                      <TranslatedText translationKey="auth.signUp" />
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Sign In Form */}
                  <TabsContent value="signin" className="mt-0">
                    {/* Google Sign In */}
                    <div className="mb-8">
                      <GoogleSignInButton 
                        onClick={handleGoogleSignIn}
                        loading={isGoogleLoading}
                        variant="sign-in"
                        className="w-full h-14 text-base font-semibold rounded-2xl"
                      />
                      
                      {/* Divider */}
                      <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-card text-muted-foreground font-medium">
                            <TranslatedText translationKey="auth.orContinueWith" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSignIn} className="space-y-6">
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
                        placeholder={t('authPage.passwordPlaceholder')}
                        label={t('auth.password')}
                        leftIcon={<Lock className="w-5 h-5" />}
                        showPasswordToggle
                        medical
                        required
                      />
                      
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
                          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <MobileButton
                        type="submit"
                        variant="medical"
                        size="lg"
                        className="w-full h-14 text-base font-semibold rounded-2xl shadow-medical"
                        disabled={isLoading}
                        loading={isLoading}
                        haptic
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isLoading ? (
                            <TranslatedText translationKey="authPage.signingIn" />
                          ) : (
                            <>
                              <TranslatedText translationKey="authPage.signInSecurely" />
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </span>
                      </MobileButton>
                    </form>
                  </TabsContent>
                  
                  {/* Sign Up Form */}
                  <TabsContent value="signup" className="mt-0">
                    {/* Google Sign Up */}
                    <div className="mb-8">
                      <GoogleSignInButton 
                        onClick={handleGoogleSignIn}
                        loading={isGoogleLoading}
                        variant="sign-up"
                        className="w-full h-14 text-base font-semibold rounded-2xl"
                      />
                      
                      {/* Divider */}
                      <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-card text-muted-foreground font-medium">
                            <TranslatedText translationKey="auth.orContinueWith" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSignUp} className="space-y-6">
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
                        placeholder={t('authPage.createPasswordPlaceholder')}
                        label={t('authPage.createPassword')}
                        leftIcon={<Lock className="w-5 h-5" />}
                        showPasswordToggle
                        medical
                        helperText={t('authPage.passwordRequirements')}
                        required
                        minLength={6}
                      />
                      
                      {error && (
                        <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
                          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <MobileButton
                        type="submit"
                        variant="medical"
                        size="lg"
                        className="w-full h-14 text-base font-semibold rounded-2xl shadow-medical"
                        disabled={isLoading}
                        loading={isLoading}
                        haptic
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isLoading ? (
                            <TranslatedText translationKey="authPage.creatingAccount" />
                          ) : (
                            <>
                              <TranslatedText translationKey="authPage.createSecureAccount" />
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </span>
                      </MobileButton>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </MobileCard>
            
            {/* Security Trust Indicator */}
            <div className="mt-6 px-2">
              <div className="flex items-center justify-center gap-3 p-4 medical-surface rounded-2xl border border-border/20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    <TranslatedText translationKey="authPage.medicalGradeSecurity" />
                  </span>
                </div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </ProfessionalMobileLayout>
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
                    <TranslatedText translationKey="auth.password" />
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
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <MobileButton type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
                  {isLoading ? <TranslatedText translationKey="authPage.creatingAccount" /> : <TranslatedText translationKey="authPage.createSecureAccount" />}
                </MobileButton>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mr-2" />
              <TranslatedText translationKey="authPage.dataEncryptedSecure" />
            </div>
          </div>
        </div>
      </MobileCard>
    </div>
  );
}