import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  FileClock,
  FileSearch,
  FolderOpen,
  Gavel,
  Scale,
  Users as UsersIcon,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge, EmptyState, Spinner, StatCard } from '../components/ui';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_TONES,
  ROLE_LABELS,
  formatDate,
  greeting,
  shortId,
} from '../utils/helpers';
import type { Evidence, LegalCase, User } from '../types';

interface DashboardData {
  cases: LegalCase[];
  users: User[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [caseList, userList] = await Promise.all([api.getCases(), api.getUsers()]);
        if (!alive) return;
        setData({ cases: caseList, users: userList });
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    let alive = true;
    (async () => {
      const results = await Promise.allSettled(data.cases.map((c) => api.getEvidence(c.id)));
      if (!alive) return;
      const all = results
        .filter((r): r is PromiseFulfilledResult<Evidence[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);
      setEvidence(all);
    })();
    return () => {
      alive = false;
    };
  }, [data]);

  if (error) {
    return (
      <div className="card">
        <EmptyState
          icon={<FileSearch size={28} />}
          title="Could not load the dashboard"
          hint={error}
        />
      </div>
    );
  }

  if (!data || !user) {
    return (
      <div className="screen-center">
        <Spinner size={36} />
      </div>
    );
  }

  const cases = data.cases;
  const byStatus = (s: string) => cases.filter((c) => c.status === s).length;
  const pendingCount = evidence
    ? evidence.filter((e) => e.verificationStatus === 'PENDING').length
    : null;

  const userName = (id: string | null) => {
    if (!id) return 'Unassigned';
    const u = data.users.find((x) => x.id === id);
    return u ? u.name : shortId(id);
  };

  const myCases =
    user.role === 'POLICE_OFFICER'
      ? cases.filter((c) => c.policeOfficerId === user.id)
      : user.role === 'INVESTIGATOR'
        ? cases.filter((c) => c.investigatorId === user.id)
        : [];

  const recent = [...cases]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const distribution = (
    ['OPEN', 'UNDER_INVESTIGATION', 'EVIDENCE_COLLECTION', 'IN_COURT', 'CLOSED'] as const
  ).map((s) => ({ status: s, count: byStatus(s) }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="page page-enter">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <h1 className="page-title">
            {greeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className="page-subtitle">Here is the overview of your {ROLE_LABELS[user.role]} workspace.</p>
        </div>
        <div className="hero-emblem">
          <Scale size={40} />
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total cases" value={total(cases)} icon={<FolderOpen size={22} />} tone="indigo" />
        <StatCard label="Open" value={byStatus('OPEN')} icon={<FileSearch size={22} />} tone="green" />
        <StatCard label="In court" value={byStatus('IN_COURT')} icon={<Gavel size={22} />} tone="purple" />
        <StatCard label="Closed" value={byStatus('CLOSED')} icon={<FileClock size={22} />} tone="gray" />
        <StatCard
          label="Pending verification"
          value={pendingCount === null ? '…' : pendingCount}
          icon={<FileClock size={22} />}
          tone="amber"
        />
        <StatCard label="Team members" value={data.users.length} icon={<UsersIcon size={22} />} tone="cyan" />
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="card-head">
            <h2>Case status distribution</h2>
          </div>
          <div className="dist-bars">
            {distribution.map((d) => (
              <div className="dist-row" key={d.status}>
                <span className="dist-label">{CASE_STATUS_LABELS[d.status]}</span>
                <div className="dist-track">
                  <div
                    className={`dist-fill dist-fill-${CASE_STATUS_TONES[d.status]}`}
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="dist-value">{d.count}</span>
              </div>
            ))}
          </div>
        </section>

        {myCases.length > 0 && (
          <section className="card">
            <div className="card-head">
              <h2>My assigned cases</h2>
              <Link className="text-link" to="/cases">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mini-list">
              {myCases.slice(0, 5).map((c) => (
                <Link className="mini-row" to={`/cases/${c.id}`} key={c.id}>
                  <div className="mini-row-main">
                    <strong>{c.title}</strong>
                    <span>
                      {c.category} · #{shortId(c.id)}
                    </span>
                  </div>
                  <Badge tone={CASE_STATUS_TONES[c.status]}>{CASE_STATUS_LABELS[c.status]}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Recent cases</h2>
          <Link className="text-link" to="/cases">
            Browse all <ArrowRight size={14} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="No cases yet"
            hint="New cases created by the police department will appear here."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Investigator</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr
                    key={c.id}
                    className="clickable"
                    onClick={() => navigate(`/cases/${c.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/cases/${c.id}`)}
                    tabIndex={0}
                  >
                    <td>
                      <div className="cell-title">
                        <span className="cell-id">#{shortId(c.id)}</span>
                        <strong>{c.title}</strong>
                      </div>
                    </td>
                    <td>
                      <Badge tone="neutral">{c.category}</Badge>
                    </td>
                    <td>
                      <Badge tone={CASE_STATUS_TONES[c.status]}>{CASE_STATUS_LABELS[c.status]}</Badge>
                    </td>
                    <td>{userName(c.investigatorId)}</td>
                    <td>{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pendingCount !== null && pendingCount > 0 && user.role === 'FORENSIC_EXPERT' && (
        <div className="notice">
          <FileClock size={18} />
          <span>
            {pendingCount} evidence {pendingCount === 1 ? 'file' : 'files'} awaiting forensic verification.
          </span>
        </div>
      )}
    </div>
  );
}

function total(cases: LegalCase[]): number {
  return cases.length;
}
