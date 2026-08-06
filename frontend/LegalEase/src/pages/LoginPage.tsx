import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui';

const FEATURES = [
  { icon: Fingerprint, title: 'Immutable Audit Trails', text: 'Every action is logged and tamper-proof.' },
  { icon: FileCheck2, title: 'Secure Evidence Vault', text: 'Cryptographically tracked chain of custody.' },
  { icon: ShieldCheck, title: 'Role-Based Access', text: 'Strict permissions across every department.' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast('Welcome back to LegalEase', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-brand">
          <div className="brand-mark brand-mark-lg">
            <Scale size={26} />
          </div>
          <div className="brand-text">
            <span className="brand-name">LegalEase</span>
            <span className="brand-sub">Case &amp; Evidence Management</span>
          </div>
        </div>

        <div className="hero-copy">
          <h1>Modernize the <span className="hero-accent">justice</span> workflow.</h1>
          <p>
            One secure platform for case lifecycle, digital evidence, chain of custody,
            and immutable auditing — built for law enforcement, the judiciary, and legal teams.
          </p>
        </div>

        <div className="hero-features">
          {FEATURES.map((f) => (
            <div className="hero-feature" key={f.title}>
              <div className="hero-feature-icon">
                <f.icon size={18} />
              </div>
              <div>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-footer">Enterprise microservices · Spring Boot · Kafka · JWT</div>
      </div>

      <div className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-heading">
            <h2>Sign in to your console</h2>
            <p>Access your secure workspace with organizational credentials.</p>
          </div>

          <label className="field">
            <span className="field-label">Email address</span>
            <input
              className="input"
              type="email"
              autoComplete="username"
              placeholder="you@department.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <div className="input-suffix">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-suffix-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            {!busy && <ArrowRight size={17} />}
          </button>

          <div className="login-note">
            <LockKeyhole size={14} />
            <span>Protected by JWT authentication. Session expires automatically.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
