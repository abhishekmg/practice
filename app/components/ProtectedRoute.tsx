'use client';

import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ProtectedRouteProps {
  readonly children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login screen
  if (!user) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');
      setIsLoadingAuth(true);

      try {
        if (mode === 'signin') {
          const { error } = await signIn(email, password);
          if (error) {
            setError(error);
          } else {
            setEmail('');
            setPassword('');
          }
        } else {
          const { error } = await signUp(email, password);
          if (error) {
            setError(error);
          } else {
            setSuccessMessage('Check your email to confirm your account!');
            setEmail('');
            setPassword('');
          }
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="w-full max-w-md space-y-6 px-4">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
                AI
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-zinc-100">
              Welcome to Interview Mentor
            </h1>
            <p className="text-sm text-zinc-400">
              Sign in to access your practice sessions, track progress, and start coding interviews.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="mb-6 text-xl font-semibold text-zinc-100">
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="protected-email" className="mb-1 block text-sm text-zinc-400">
                  Email
                </label>
                <Input
                  id="protected-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border-slate-700 bg-slate-800 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label htmlFor="protected-password" className="mb-1 block text-sm text-zinc-400">
                  Password
                </label>
                <Input
                  id="protected-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="border-slate-700 bg-slate-800 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-400">
                  {successMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoadingAuth}
                className="w-full"
              >
                {isLoadingAuth
                  ? 'Loading...'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-zinc-400">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signin');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-blue-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-zinc-500">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
