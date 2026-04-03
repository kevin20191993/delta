import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { ApiClient } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);

    try {
      const response = await ApiClient.requestPasswordReset(email);
      setMessage(response.message);
      setResetUrl(response.resetUrl || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Escribe el correo de tu usuario y te enviaremos una liga para definir una nueva contraseña."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
            autoComplete="email"
            placeholder="tu-correo@dominio.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink placeholder-slate-400 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

        {resetUrl && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 break-all">
            Liga generada: <a href={resetUrl} className="font-semibold underline">{resetUrl}</a>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar liga'}
        </button>

        <p className="text-center text-sm text-slate-500">
          <Link to="/cotizador/login" className="font-medium text-ember hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

