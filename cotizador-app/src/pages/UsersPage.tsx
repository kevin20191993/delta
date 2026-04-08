import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClient, UserSummary } from '../lib/api';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    jobTitle: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ApiClient.listUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      if (editingUserId) {
        const response = await ApiClient.updateUser(editingUserId, form);
        setUsers((prev) =>
          prev
            .map((user) => (user.id === editingUserId ? response.user : user))
            .sort((a, b) => a.username.localeCompare(b.username))
        );
        setMessage('Usuario actualizado correctamente');
      } else {
        const response = await ApiClient.createUser(form);
        setUsers((prev) => [...prev, response.user].sort((a, b) => a.username.localeCompare(b.username)));
        setMessage('Usuario creado correctamente');
      }

      setEditingUserId(null);
      setForm({
        username: '',
        email: '',
        fullName: '',
        jobTitle: '',
        password: '',
        confirmPassword: '',
        role: 'admin'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (user: UserSummary) => {
    setEditingUserId(user.id);
    setError('');
    setMessage('');
    setForm({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      jobTitle: user.jobTitle || '',
      password: '',
      confirmPassword: '',
      role: user.role
    });
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setError('');
    setMessage('');
    setForm({
      username: '',
      email: '',
      fullName: '',
      jobTitle: '',
      password: '',
      confirmPassword: '',
      role: 'admin'
    });
  };

  return (
    <div className="min-h-screen bg-pearl px-4 py-6 font-body text-ink md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => navigate('/cotizador/')}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-ember hover:underline"
              >
                ← Volver al índice
              </button>
              <h1 className="mt-2 font-display text-3xl text-ink">Usuarios</h1>
              <p className="text-sm text-slate-500">Crea nuevas cuentas para acceder al cotizador.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/cotizador/editor')}
              className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              + Nueva cotización
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-ink">{editingUserId ? 'Editar usuario' : 'Crear usuario'}</h2>
              {editingUserId ? (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm text-slate">
                Nombre completo
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm text-slate">
                Puesto
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel"
                  value={form.jobTitle}
                  onChange={(event) => setForm((prev) => ({ ...prev, jobTitle: event.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm text-slate">
                Usuario
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel"
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm text-slate">
                Correo
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm text-slate">
                Rol
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel"
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </label>
              <label className="block text-sm text-slate">
                Contraseña {editingUserId ? '(opcional)' : ''}
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required={!editingUserId}
                />
              </label>
              <label className="block text-sm text-slate">
                Repite contraseña {editingUserId ? '(opcional)' : ''}
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  required={!editingUserId}
                />
              </label>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-steel disabled:opacity-50"
              >
                {saving ? (editingUserId ? 'Guardando...' : 'Creando...') : (editingUserId ? 'Guardar cambios' : 'Crear usuario')}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-ink">Usuarios registrados</h2>
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                Recargar
              </button>
            </div>

            {loading ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">Cargando usuarios...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre completo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Puesto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Correo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 font-medium text-ink">{user.username}</td>
                        <td className="px-4 py-3 text-slate-500">{user.fullName || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{user.jobTitle || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{user.email}</td>
                        <td className="px-4 py-3 text-slate-500">{user.role}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => startEditing(user)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-slate-50"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
