import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Search,
  ShieldPlus,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Toggle,
  useToast,
} from '../components/ui';
import { ROLE_LABELS, shortId } from '../utils/helpers';
import type { Role, User } from '../types';

const ROLES: Role[] = ['ADMIN', 'POLICE_OFFICER', 'INVESTIGATOR', 'LAWYER', 'JUDGE', 'FORENSIC_EXPERT'];

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initial = async () => {
      try {
        const users = await api.getUsers();
        if (!cancelled) setUsers(users);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void initial();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [users, query, roleFilter]);

  const roleCount = (r: Role) => users.filter((u) => u.role === r).length;

  const patchUser = (updated: User) =>
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  const toggleStatus = async (u: User) => {
    if (statusBusy) return;
    setStatusBusy(u.id);
    try {
      const updated = await api.updateUserStatus(u.id, !u.active);
      patchUser(updated);
      toast(
        updated.active ? `${u.name} activated` : `${u.name} deactivated — they can no longer sign in`,
        updated.active ? 'success' : 'info',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Status update failed', 'error');
    } finally {
      setStatusBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast(`${deleteTarget.name} removed from the registry`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Deletion failed', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div className="card">
        <EmptyState icon={<UsersIcon size={28} />} title="Could not load users" hint={error} />
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">User management</h1>
          <p className="page-subtitle">Register personnel, assign roles, and control account access.</p>
        </div>
        <Button variant="primary" onClick={() => setRegisterOpen(true)}>
          <UserPlus size={17} /> Register user
        </Button>
      </div>

      <div className="role-strip">
        {ROLES.map((r) => (
          <button
            key={r}
            className={`role-chip${roleFilter === r ? ' active' : ''}`}
            onClick={() => setRoleFilter(roleFilter === r ? 'ALL' : r)}
          >
            <span className="role-chip-count">{roleCount(r)}</span>
            <span>{ROLE_LABELS[r]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            className="search-input"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="muted count-label">
          {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      <section className="card">
        {loading ? (
          <div className="screen-center pad-y">
            <Spinner size={30} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={28} />}
            title="No users found"
            hint="Register the first user to get the team started."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>User ID</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = user?.id === u.id;
                  return (
                    <tr key={u.id} className={u.active ? '' : 'row-dim'}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar user-avatar-sm${u.active ? '' : ' avatar-dim'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-cell-main">
                            <strong>{u.name}</strong>
                            {isSelf && <span className="self-tag">You</span>}
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <Badge tone={roleTone(u.role)}>{ROLE_LABELS[u.role]}</Badge>
                      </td>
                      <td>
                        {u.active ? (
                          <span className="with-icon status-active">
                            <span className="status-dot status-dot-green" /> Active
                          </span>
                        ) : (
                          <span className="with-icon status-inactive">
                            <span className="status-dot status-dot-red" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="mono muted">{shortId(u.id)}</td>
                      <td>
                        <div className="row-actions">
                          <div
                            className="row-action-wrap"
                            title={isSelf ? "You can't deactivate your own account" : u.active ? 'Deactivate account' : 'Activate account'}
                          >
                            <Toggle
                              checked={u.active}
                              disabled={isSelf || statusBusy === u.id}
                              onChange={() => void toggleStatus(u)}
                              label={u.active ? 'Deactivate account' : 'Activate account'}
                            />
                          </div>
                          <button
                            className="icon-btn icon-btn-danger"
                            title={isSelf ? "You can't delete your own account" : 'Delete user'}
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {user && (
        <RegisterModal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onRegistered={async (created) => {
            setRegisterOpen(false);
            setUsers((prev) => [created, ...prev]);
            toast(`User ${created.name} registered`, 'success');
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete user account"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.name} from the registry? Their account will be permanently deactivated and they will no longer be able to sign in.`
            : ''
        }
        confirmLabel="Delete user"
      />
    </div>
  );
}

function RegisterModal({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered: (u: User) => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('POLICE_OFFICER');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) errs.name = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email.';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    try {
      const created = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      await onRegistered(created);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register a new user"
      subtitle="The user will receive access based on their assigned role."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={busy}>
            <ShieldPlus size={16} /> Register
          </Button>
        </>
      }
    >
      <form className="modal-form" onSubmit={submit}>
        <Field label="Full name" required error={errors.name}>
          <Input
            placeholder="e.g. Officer Sarah Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email address" required error={errors.email}>
          <Input
            type="email"
            placeholder="name@department.gov"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Temporary password" required error={errors.password}>
          <Input
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Role" required>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

function roleTone(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'indigo';
    case 'JUDGE':
      return 'purple';
    case 'FORENSIC_EXPERT':
      return 'cyan';
    case 'POLICE_OFFICER':
      return 'green';
    case 'INVESTIGATOR':
      return 'blue';
    default:
      return 'neutral';
  }
}
