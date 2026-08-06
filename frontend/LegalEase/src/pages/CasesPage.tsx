import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, FolderPlus, Plus, Search, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  useToast,
} from '../components/ui';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_TONES,
  CATEGORIES,
  canCreateCase,
  formatDate,
  shortId,
} from '../utils/helpers';
import type { LegalCase, User } from '../types';

const STATUS_FILTERS = ['ALL', 'OPEN', 'UNDER_INVESTIGATION', 'EVIDENCE_COLLECTION', 'IN_COURT', 'CLOSED'] as const;

export default function CasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cases, setCases] = useState<LegalCase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const initial = async () => {
      try {
        const [caseList, userList] = await Promise.all([api.getCases(), api.getUsers()]);
        if (cancelled) return;
        setCases(caseList);
        setUsers(userList);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load cases');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void initial();
    return () => {
      cancelled = true;
    };
  }, []);

  const userName = (id: string | null) => {
    if (!id) return 'Unassigned';
    const u = users.find((x) => x.id === id);
    return u ? u.name : shortId(id);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases
      .filter((c) => statusFilter === 'ALL' || c.status === statusFilter)
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [cases, query, statusFilter]);

  if (error && cases.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={<FolderOpen size={28} />} title="Could not load cases" hint={error} />
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">Browse the case registry across all departments.</p>
        </div>
        {user && canCreateCase(user.role) && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={17} /> New case
          </Button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            className="search-input"
            placeholder="Search by title, category or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="segmented">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`segment${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'ALL' ? 'All' : CASE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <section className="card">
        {loading ? (
          <div className="screen-center pad-y">
            <Spinner size={30} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="No cases found"
            hint={cases.length === 0 ? 'Create the first case to get started.' : 'Try adjusting your filters or search.'}
            action={
              user && canCreateCase(user.role) ? (
                <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                  <FolderPlus size={16} /> Create case
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Police Officer</th>
                  <th>Investigator</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
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
                    <td>{userName(c.policeOfficerId)}</td>
                    <td>
                      {c.investigatorId ? (
                        <span className="with-icon">
                          <UserRound size={13} /> {userName(c.investigatorId)}
                        </span>
                      ) : (
                        <span className="muted">Unassigned</span>
                      )}
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {user && canCreateCase(user.role) && (
        <CreateCaseModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(c) => {
            setCreateOpen(false);
            toast('Case created successfully', 'success');
            navigate(`/cases/${c.id}`);
          }}
          userId={user.id}
        />
      )}
    </div>
  );
}

function CreateCaseModal({
  open,
  onClose,
  onCreated,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: LegalCase) => void;
  userId: string;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('CRIMINAL');
  const [errors, setErrors] = useState<{ title?: string; category?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: { title?: string; category?: string } = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!category.trim()) errs.category = 'Category is required.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    try {
      const created = await api.createCase(
        { title: title.trim(), description: description.trim(), category: category.trim() },
        userId,
      );
      onCreated(created);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create case', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a new case"
      subtitle="Initiate an official investigation record."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={busy} disabled={!title.trim()}>
            Create case
          </Button>
        </>
      }
    >
      <form className="modal-form" onSubmit={submit}>
        <Field label="Case title" required error={errors.title}>
          <Input
            placeholder="e.g. Investigation of fraudulent billing scheme"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Category" required error={errors.category}>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" hint="Provide a short summary of the case.">
          <Textarea
            rows={4}
            placeholder="Describe the incident, parties involved, and initial findings…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
