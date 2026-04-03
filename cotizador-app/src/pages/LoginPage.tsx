import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { ApiClient, saveToken } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await ApiClient.login(username, password);
      saveToken(res.token);
      navigate('/cotizador/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Iniciar sesión">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Usuario o correo
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            placeholder="admin o correo@dominio.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink placeholder-slate-400 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contraseña
            </label>
            <Link to="/cotizador/forgot-password" className="text-xs font-medium text-ember hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink placeholder-slate-400 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
