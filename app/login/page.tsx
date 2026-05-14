'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin
                ? 'Sign in to access your leads dashboard'
                : 'Sign up to get started with Close CRM Lead Manager'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Enter your password"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition-all duration-200 mt-6"
            >
              {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {isLogin ? {"Don't have an account? "} : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Gradient */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 items-center justify-center relative overflow-hidden">
        {/* Decorative stars */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 text-4xl opacity-60 animate-pulse">✨</div>
          <div className="absolute top-1/3 right-20 text-5xl opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}>
            ⭐
          </div>
          <div className="absolute bottom-20 left-1/4 text-4xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }}>
            ✨
          </div>
          <div className="absolute bottom-1/3 right-10 text-5xl opacity-50 animate-pulse" style={{ animationDelay: '1.5s' }}>
            ⭐
          </div>
        </div>

        <div className="text-center text-white z-10">
          <div className="text-6xl mb-6">⭐</div>
          <h1 className="text-5xl font-bold mb-4">Close CRM Lead Manager</h1>
          <p className="text-xl text-indigo-100">Manage your leads with ease</p>
        </div>
      </div>
    </div>
  );
}
