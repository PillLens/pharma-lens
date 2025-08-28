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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, Stethoscope, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="h-screen bg-background relative overflow-hidden flex flex-col">
        {/* Background Elements */}
        <div className="fixed inset-0 medical-gradient opacity-30" />
        <div className="fixed -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-primary-light/5 rounded-full blur-3xl" />
        
        {/* Ultra-Compact Header - 10% */}
        <div className="relative z-10 flex-none px-6 pt-8 pb-2">
          <div className="text-center space-y-2">
            {/* Minimized App Icon */}
            <div className="w-12 h-12 mx-auto medical-surface rounded-xl flex items-center justify-center shadow-soft">
              <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            
            {/* Minimized Title */}
            <h1 className="text-xl font-bold text-foreground">
              <TranslatedText translationKey="app.title" />
            </h1>
          </div>
        </div>

        {/* Main Form Area - 65% */}
        <div className="relative z-10 flex-1 px-6 flex flex-col">
          {/* Compact Segmented Control */}
          <div className="mb-4">
            <div className="medical-surface p-1 rounded-xl shadow-soft border border-border/20">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActiveTab('signin')}
                  className={`h-10 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'signin'
                      ? 'bg-primary text-primary-foreground shadow-medical'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TranslatedText translationKey="auth.signIn" />
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`h-10 rounded-lg font-semibold text-sm transition-all ${
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

          {/* Ultra-Compact Form Content */}
          <div className="flex-1 space-y-3">
            {/* Compact Google Sign In */}
            <GoogleSignInButton 
              onClick={handleGoogleSignIn}
              loading={isGoogleLoading}
              variant={activeTab === 'signin' ? 'sign-in' : 'sign-up'}
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-soft"
            />
            
            {/* Enhanced Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-primary/20 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gradient-to-r from-background via-primary/5 to-background text-muted-foreground text-xs font-medium rounded-full border border-primary/10 shadow-soft">
                  <TranslatedText translationKey="auth.orContinueWith" />
                </span>
              </div>
            </div>

            {/* Ultra-Compact Form */}
            <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp} className="space-y-3 flex-1 flex flex-col">
              <div className="space-y-3">
                <div className="space-y-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('authPage.emailPlaceholder')}
                    className="w-full h-11 px-4 text-base rounded-xl border-2 border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground"
                    required
                  />
                </div>
                
                <div className="space-y-1 relative">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={activeTab === 'signin' ? t('authPage.passwordPlaceholder') : t('authPage.createPasswordPlaceholder')}
                      className="w-full h-11 px-4 pr-12 text-base rounded-xl border-2 border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {activeTab === 'signup' && (
                    <p className="text-xs text-muted-foreground px-1 mt-1">
                      {t('authPage.passwordRequirements')}
                    </p>
                  )}
                </div>
                
                {error && (
                  <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10 p-2">
                    <AlertDescription className="font-medium text-center text-xs">{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Form Action Section */}
              <div className="mt-auto pt-4 space-y-3">
                {/* Compact Primary Action Button */}
                <MobileButton
                  type="submit"
                  variant="medical"
                  size="lg"
                  className="w-full h-12 text-sm font-bold rounded-xl shadow-glow medical-button"
                  disabled={isLoading}
                  loading={isLoading}
                  haptic
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <TranslatedText translationKey={activeTab === 'signin' ? 'authPage.signingIn' : 'authPage.creatingAccount'} />
                    ) : (
                      <>
                        <TranslatedText translationKey={activeTab === 'signin' ? 'auth.signIn' : 'auth.signUp'} />
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </MobileButton>

                {/* Minimal Security Indicator */}
                <div className="flex items-center justify-center gap-2 opacity-70 pb-6">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary">
                    Secure
                  </span>
                  <div className="w-1.5 h-1.5 bg-success rounded-full" />
                </div>
              </div>
            </form>
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
            <div className="w-16 h-16 mx-auto mb-4">
              <img src="/lovable-uploads/39c4089d-d2bb-4326-941f-1de6a17a137c.png" alt="PillLens" className="w-16 h-16 rounded-xl" />
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