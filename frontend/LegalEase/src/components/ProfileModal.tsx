import { useState, type FormEvent } from 'react';
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Input, Modal, useToast } from './ui';
import { ROLE_LABELS } from '../utils/helpers';

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileBusy, setProfileBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  if (!user) return null;

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Name is required', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast('Enter a valid email', 'error');
      return;
    }
    setProfileBusy(true);
    try {
      const updated = await api.updateProfile(user.id, { name: name.trim(), email: email.trim() });
      updateUser(updated);
      toast('Profile updated', 'success');
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setProfileBusy(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    setPasswordBusy(true);
    try {
      await api.changePassword(user.id, { currentPassword, newPassword });
      toast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Password change failed', 'error');
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your account"
      subtitle={`Signed in as ${ROLE_LABELS[user.role]}`}
      size="md"
    >
      <div className="profile-head">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
      </div>

      <div className="segmented profile-tabs">
        <button
          type="button"
          className={`segment${tab === 'profile' ? ' active' : ''}`}
          onClick={() => setTab('profile')}
        >
          <UserRound size={15} /> Profile
        </button>
        <button
          type="button"
          className={`segment${tab === 'password' ? ' active' : ''}`}
          onClick={() => setTab('password')}
        >
          <KeyRound size={15} /> Change password
        </button>
      </div>

      {tab === 'profile' ? (
        <form className="modal-form" onSubmit={saveProfile}>
          <Field label="Full name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email address" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={onClose} disabled={profileBusy}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={profileBusy}>
              <ShieldCheck size={16} /> Save changes
            </Button>
          </div>
        </form>
      ) : (
        <form className="modal-form" onSubmit={savePassword}>
          <Field label="Current password" required>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New password" required hint="Minimum 6 characters.">
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" required>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={onClose} disabled={passwordBusy}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={passwordBusy} disabled={!currentPassword || !newPassword}>
              <KeyRound size={16} /> Update password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
