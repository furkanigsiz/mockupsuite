import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import PasswordResetForm from './PasswordResetForm';

type AuthView = 'login' | 'signup' | 'reset';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
      <div className="w-full">
        {view === 'login' && (
          <LoginForm
            onSwitchToSignUp={() => setView('signup')}
            onSwitchToReset={() => setView('reset')}
          />
        )}
        {view === 'signup' && (
          <SignUpForm onSwitchToSignIn={() => setView('login')} />
        )}
        {view === 'reset' && (
          <PasswordResetForm onSwitchToSignIn={() => setView('login')} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
