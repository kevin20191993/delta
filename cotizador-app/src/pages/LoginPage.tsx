import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center bg-pearl px-4 font-body">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember mb-1">
            Sistema corporativo
          </p>
          <h1 className="font-display text-3xl text-ink">KP Delta</h1>
          <p className="text-sm text-slate-500 mt-1">Cotizador industrial premium</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-7 shadow-panel backdrop-blur">
          <h2 className="text-lg font-semibold text-ink mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="admin"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink placeholder-slate-400 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink placeholder-slate-400 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
