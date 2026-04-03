import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { ApiClient } from '../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validateToken() {
      if (!token) {
        setError('La liga de recuperación es inválida.');
        setChecking(false);
        return;
      }

      try {
        const response = await ApiClient.validateResetToken(token);
        if (!cancelled) {
          setEmail(response.email);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'La liga ya no es válida');
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    validateToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await ApiClient.resetPassword(token, password, confirmPassword);
      setMessage(response.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Nueva contraseña"
      description={email ? `Actualizarás la contraseña de ${email}` : 'Define una contraseña nueva para tu cuenta.'}
    >
      {checking ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">Validando liga...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Repite la contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            disabled={loading || !!message || !!error && !email}
            className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link to="/cotizador/login" className="font-medium text-ember hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
