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
import { Loader2, Shield, Stethoscope, Fingerprint, Lock, Eye, EyeOff } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-medical relative">
        {/* Background Elements */}
        <div className="fixed inset-0 medical-gradient opacity-30" />
        <div className="fixed top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-medical-pulse" />
        <div className="fixed bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-medical-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Scrollable Content */}
        <div className="relative z-10 min-h-screen overflow-y-auto">
          {/* Header */}
          <div className="pt-safe-area-top px-6">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 medical-surface rounded-3xl flex items-center justify-center shadow-medical">
                <Stethoscope className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                <TranslatedText translationKey="app.title" />
              </h1>
              <p className="text-muted-foreground">
                <TranslatedText translationKey="authPage.subtitle" />
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 pb-safe-area-bottom">
            <MobileCard variant="medical" className="backdrop-blur-md border-border/20">
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 medical-surface p-1 rounded-2xl">
                    <TabsTrigger value="signin" className="rounded-xl">
                      <TranslatedText translationKey="auth.signIn" />
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-xl">
                      <TranslatedText translationKey="auth.signUp" />
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="mt-6">
                    {/* Google Sign In Button */}
                    <div className="mb-6">
                      <GoogleSignInButton 
                        onClick={handleGoogleSignIn}
                        loading={isGoogleLoading}
                        variant="sign-in"
                        className="h-12 text-base"
                      />
                      
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-card text-muted-foreground">
                            <TranslatedText translationKey="auth.orContinueWith" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          <TranslatedText translationKey="authPage.emailAddress" />
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t('authPage.emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 text-base medical-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          <TranslatedText translationKey="auth.password" />
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t('authPage.passwordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 text-base pr-12 medical-input"
                            required
                          />
                          <MobileButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </MobileButton>
                        </div>
                      </div>
                      
                      {error && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <MobileButton
                        type="submit"
                        variant="medical"
                        size="lg"
                        className="w-full h-12 text-base font-semibold"
                        disabled={isLoading}
                        loading={isLoading}
                      >
                        {isLoading ? <TranslatedText translationKey="authPage.signingIn" /> : <TranslatedText translationKey="authPage.signInSecurely" />}
                      </MobileButton>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="mt-6">
                    {/* Google Sign Up Button */}
                    <div className="mb-6">
                      <GoogleSignInButton 
                        onClick={handleGoogleSignIn}
                        loading={isGoogleLoading}
                        variant="sign-up"
                        className="h-12 text-base"
                      />
                      
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/20" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-card text-muted-foreground">
                            <TranslatedText translationKey="auth.orContinueWith" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">
                          <TranslatedText translationKey="authPage.emailAddress" />
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder={t('authPage.emailPlaceholder')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 text-base medical-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">
                          <TranslatedText translationKey="authPage.createPassword" />
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t('authPage.createPasswordPlaceholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 text-base pr-12 medical-input"
                            required
                            minLength={6}
                          />
                          <MobileButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </MobileButton>
                        </div>
                      </div>
                      
                      {error && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <MobileButton
                        type="submit"
                        variant="medical"
                        size="lg"
                        className="w-full h-12 text-base font-semibold"
                        disabled={isLoading}
                        loading={isLoading}
                      >
                        {isLoading ? <TranslatedText translationKey="authPage.creatingAccount" /> : <TranslatedText translationKey="authPage.createSecureAccount" />}
                      </MobileButton>
                    </form>
                  </TabsContent>
                </Tabs>
                
                {/* Security Notice */}
                <div className="mt-8 p-4 medical-surface rounded-2xl border border-border/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        <TranslatedText translationKey="authPage.medicalGradeSecurity" />
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <TranslatedText translationKey="authPage.securityNotice" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </MobileCard>
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