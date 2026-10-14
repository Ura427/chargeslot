import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../api/auth.api';
import { setCredentials } from '../features/auth/authSlice';
import { getErrorMessage } from '../lib/errors';
import { Button } from '../components/Button';
import { AuthLayout, FormError, TextField } from '../components/AuthLayout';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const { accessToken } = await login({ email, password }).unwrap();
      dispatch(setCredentials({ accessToken, user: { email } }));
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          No account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-700 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <FormError>{error}</FormError>}
        <Button type="submit" size="lg" disabled={isLoading} className="w-full">
          {isLoading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
