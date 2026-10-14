import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterMutation } from '../api/auth.api';
import { setCredentials } from '../features/auth/authSlice';
import { getErrorMessage } from '../lib/errors';
import { Button } from '../components/Button';
import { AuthLayout, FormError, TextField } from '../components/AuthLayout';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await register({ email, password }).unwrap();
      // Register doesn't issue tokens; log in right away for a smooth flow.
      const { accessToken } = await login({ email, password }).unwrap();
      dispatch(setCredentials({ accessToken, user: { email } }));
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account.'));
    }
  }

  const isLoading = isRegistering || isLoggingIn;

  return (
    <AuthLayout
      title="Create an account"
      subtitle="It takes a few seconds, and booking is free."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-700 hover:underline"
          >
            Log in
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
          hint="At least 8 characters."
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <FormError>{error}</FormError>}
        <Button type="submit" size="lg" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating account…' : 'Register'}
        </Button>
      </form>
    </AuthLayout>
  );
}
