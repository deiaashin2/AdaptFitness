import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Activity, Check, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
// import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../context/AuthContext';

// Live-validated password rules surfaced under the Password field.
// Mirrors the server-side rule (Supabase Auth default is ≥6 chars) plus
// two common-sense additions so the rule list reads like a real signup form.
const PASSWORD_RULES: { id: string; label: string; test: (pw: string) => boolean }[] = [
  { id: 'length', label: 'At least 6 characters', test: (pw) => pw.length >= 6 },
  { id: 'letter', label: 'Contains a letter', test: (pw) => /[A-Za-z]/.test(pw) },
  { id: 'number', label: 'Contains a number', test: (pw) => /\d/.test(pw) },
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signup, isAuthenticated, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);

    // Handle signup logic here
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      await signup(formData.email, formData.password, fullName);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);

      // Shows a detailed error message
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Activity className="size-10 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-600">FitTrack</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-emerald-700">Create an account</CardTitle>
            <CardDescription className="text-slate-600">
              Enter your information to get started with FitTrack
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="border-2 border-emerald-600 rounded-2xl text-slate-700"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="border-2 border-emerald-600 rounded-2xl text-slate-700"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="border-2 border-emerald-600 rounded-2xl text-slate-700"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="border-2 border-emerald-600 rounded-2xl text-slate-700 pr-10"
                    required
                    disabled={loading}
                    aria-describedby="password-rules"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-emerald-700 focus:outline-none focus:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {/* Live-validated password rules — only render once the
                    user has started typing so the list doesn't shout
                    at an empty field on first paint. */}
                {formData.password.length > 0 && (
                  <ul
                    id="password-rules"
                    aria-live="polite"
                    className="space-y-1 pt-1 text-xs"
                  >
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(formData.password);
                      return (
                        <li
                          key={rule.id}
                          data-testid={`password-rule-${rule.id}`}
                          data-passed={passed}
                          className={
                            'flex items-center gap-1.5 ' +
                            (passed ? 'text-emerald-700' : 'text-slate-500')
                          }
                        >
                          {passed ? (
                            <Check className="size-3.5" aria-hidden="true" />
                          ) : (
                            <X className="size-3.5" aria-hidden="true" />
                          )}
                          <span>{rule.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="border-2 border-emerald-600 rounded-2xl text-slate-700 pr-10"
                    required
                    disabled={loading}
                    aria-describedby="confirm-password-status"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-emerald-700 focus:outline-none focus:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {/* Inline match indicator — only renders once the user
                    has started typing in Confirm Password so an empty
                    field on first paint doesn't look like an error. */}
                {formData.confirmPassword.length > 0 && (
                  <p
                    id="confirm-password-status"
                    aria-live="polite"
                    data-testid="confirm-password-status"
                    data-match={formData.password === formData.confirmPassword}
                    className={
                      'flex items-center gap-1.5 pt-1 text-xs ' +
                      (formData.password === formData.confirmPassword
                        ? 'text-emerald-700'
                        : 'text-red-600')
                    }
                  >
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="size-3.5" aria-hidden="true" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="size-3.5" aria-hidden="true" />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-2 border-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  disabled={loading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                >
                  I agree to the{' '}
                  <a href="#" className="text-emerald-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-emerald-600 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" type="button" onClick={signInWithGoogle}>
                <svg className="mr-2 size-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" type="button" onClick={signInWithGithub}>
                <svg className="mr-2 size-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-sm text-center text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-8">
          By creating an account, you agree to our{' '}
          <a href="#" className="underline hover:text-slate-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-slate-700">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
