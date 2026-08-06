import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  ExternalLink,
  File,
  FileImage,
  FileText,
  FolderOpen,
  Hash,
  ShieldX,
  UploadCloud,
  UserCheck,
  UserRound,
  Video,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Modal,
  Select,
  Spinner,
  Textarea,
  useToast,
} from '../components/ui';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_TONES,
  VERIFICATION_LABELS,
  VERIFICATION_TONES,
  canAssignInvestigator,
  canUploadEvidence,
  canVerifyEvidence,
  canViewAudit,
  fileNameFromUrl,
  formatDate,
  openEvidenceInTab,
  shortId,
} from '../utils/helpers';
import type { AuditLog, CaseStatus, Evidence, LegalCase, User, VerificationStatus } from '../types';

const ACTIVE_STATUSES: CaseStatus[] = [
  'OPEN',
  'UNDER_INVESTIGATION',
  'EVIDENCE_COLLECTION',
  'IN_COURT',
];

export default function CaseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<LegalCase | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<Evidence | null>(null);

  const canAudit = user ? canViewAudit(user.role) : false;

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [c, ev, us] = await Promise.all([api.getCase(id), api.getEvidence(id), api.getUsers()]);
        if (!alive) return;
        setCaseData(c);
        setEvidence(ev);
        setUsers(us);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Failed to load case');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !canAudit) return;
    let alive = true;
    api
      .getAuditLogsForCase(id)
      .then((logs) => {
        if (alive) setAuditLogs(logs);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id, canAudit]);

  const refresh = async () => {
    if (!id) return;
    try {
      const [c, ev] = await Promise.all([api.getCase(id), api.getEvidence(id)]);
      setCaseData(c);
      setEvidence(ev);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to refresh case', 'error');
    }
  };

  const userName = (uid: string | null) => {
    if (!uid) return 'Unassigned';
    const u = users.find((x) => x.id === uid);
    return u ? u.name : shortId(uid);
  };

  const investigators = useMemo(() => users.filter((u) => u.role === 'INVESTIGATOR'), [users]);

  if (loading) {
    return (
      <div className="screen-center">
        <Spinner size={36} />
      </div>
    );
  }

  if (!caseData || error) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="Case not found"
            hint={error || 'The requested case does not exist.'}
            action={
              <Button variant="secondary" onClick={() => navigate('/cases')}>
                <ArrowLeft size={16} /> Back to cases
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const c = caseData;
  const role = user?.role ?? 'LAWYER';
  const canAssign = canAssignInvestigator(role);
  const canUpload = canUploadEvidence(role);
  const canVerify = canVerifyEvidence(role);
  const isClosed = c.status === 'CLOSED';

  return (
    <div className="page page-enter">
      <button className="back-link" onClick={() => navigate('/cases')}>
        <ArrowLeft size={15} /> Back to cases
      </button>

      <div className="case-header">
        <div className="case-header-main">
          <div className="case-header-row">
            <span className="cell-id">#{shortId(c.id)}</span>
            <Badge tone="neutral">{c.category}</Badge>
            <Badge tone={CASE_STATUS_TONES[c.status]}>{CASE_STATUS_LABELS[c.status]}</Badge>
          </div>
          <h1 className="page-title">{c.title}</h1>
          <p className="page-subtitle">{c.description || 'No description provided.'}</p>
        </div>
        <div className="case-header-actions">
          {canAssign && (
            <Button variant="secondary" onClick={() => setAssignOpen(true)}>
              <UserCheck size={16} /> Assign investigator
            </Button>
          )}
          {role === 'JUDGE' && (
            <Button
              variant={isClosed ? 'primary' : 'danger'}
              onClick={() => setStatusOpen(true)}
            >
              {isClosed ? 'Reopen case' : 'Close case'}
            </Button>
          )}
          {!isClosed && (role === 'POLICE_OFFICER' || role === 'INVESTIGATOR') && (
            <Button variant="primary" onClick={() => setStatusOpen(true)}>
              Update status
            </Button>
          )}
        </div>
      </div>

      <div className="case-grid">
        <div className="case-main">
          <section className="card">
            <div className="card-head">
              <h2>Case overview</h2>
            </div>
            <div className="meta-grid">
              <MetaItem icon={<Hash size={15} />} label="Case ID" value={c.id} />
              <MetaItem
                icon={<UserRound size={15} />}
                label="Police Officer"
                value={userName(c.policeOfficerId)}
              />
              <MetaItem
                icon={<UserCheck size={15} />}
                label="Investigator"
                value={userName(c.investigatorId)}
              />
              <MetaItem icon={<Calendar size={15} />} label="Opened" value={formatDate(c.createdAt)} />
            </div>
            {c.description && (
              <div className="case-description">
                <span className="field-label">Description</span>
                <p>{c.description}</p>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Evidence</h2>
              <span className="count-pill">
                {evidence.length} {evidence.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {canUpload && !isClosed && (
              <UploadEvidence
                onUploaded={async () => {
                  await refresh();
                }}
                caseId={c.id}
                disabled={false}
              />
            )}

            {evidence.length === 0 ? (
              <EmptyState
                icon={<FileText size={26} />}
                title="No evidence uploaded"
                hint="Evidence submitted to this case will appear here with verification status."
              />
            ) : (
              <div className="evidence-list">
                {evidence.map((ev) => (
                  <EvidenceCard
                    key={ev.id}
                    evidence={ev}
                    uploaderName={userName(ev.uploaderId)}
                    canVerify={canVerify}
                    onVerify={() => setVerifyTarget(ev)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {canAudit && (
          <aside className="case-side">
            <section className="card">
              <div className="card-head">
                <h2>Chain of custody</h2>
                <Badge tone="neutral">{auditLogs.length}</Badge>
              </div>
              {auditLogs.length === 0 ? (
                <p className="muted pad-sm">No audited events recorded for this case yet.</p>
              ) : (
                <div className="timeline">
                  {auditLogs.map((log) => (
                    <div className="timeline-item" key={log.id}>
                      <div className={`timeline-dot dot-${eventTone(log.eventType)}`} />
                      <div className="timeline-body">
                        <div className="timeline-head">
                          <strong>{log.eventType.replace(/_/g, ' ')}</strong>
                          <span>{formatDate(log.timestamp)}</span>
                        </div>
                        <p>{log.eventDetails}</p>
                        <small>{log.serviceName}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        )}
      </div>

      {canAssign && caseData && (
        <AssignModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          caseData={caseData}
          investigators={investigators}
          onAssigned={async () => {
            setAssignOpen(false);
            await refresh();
            toast('Investigator assigned', 'success');
          }}
        />
      )}

      {caseData && (
        <StatusModal
          open={statusOpen}
          onClose={() => setStatusOpen(false)}
          caseData={caseData}
          role={role}
          onUpdated={async () => {
            setStatusOpen(false);
            await refresh();
            toast('Case status updated', 'success');
          }}
        />
      )}

      {verifyTarget && (
        <VerifyModal
          evidence={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onVerified={async () => {
            setVerifyTarget(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="meta-item">
      <div className="meta-icon">{icon}</div>
      <div>
        <span className="meta-label">{label}</span>
        <span className="meta-value">{value}</span>
      </div>
    </div>
  );
}

function UploadEvidence({
  caseId,
  onUploaded,
  disabled,
}: {
  caseId: string;
  onUploaded: () => void | Promise<void>;
  disabled: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const doUpload = async (file: File) => {
    if (!user || disabled) return;
    setBusy(true);
    try {
      await api.uploadEvidence(caseId, file, user.id);
      toast(`Uploaded “${file.name}”`, 'success');
      await onUploaded();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      className={`dropzone${drag ? ' dragging' : ''}${busy ? ' busy' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void doUpload(f);
      }}
    >
      <input
        type="file"
        className="file-input"
        disabled={busy || disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void doUpload(f);
          e.target.value = '';
        }}
      />
      {busy ? (
        <Spinner size={22} />
      ) : (
        <UploadCloud size={22} />
      )}
      <span>{busy ? 'Uploading…' : 'Upload digital evidence'}</span>
      <small>Click to choose or drag &amp; drop · images, video, PDF, documents</small>
    </label>
  );
}

function EvidenceCard({
  evidence: ev,
  uploaderName,
  canVerify,
  onVerify,
}: {
  evidence: Evidence;
  uploaderName: string;
  canVerify: boolean;
  onVerify: () => void;
}) {
  const { toast } = useToast();
  const [opening, setOpening] = useState(false);
  const type = ev.fileType ?? '';
  const Icon =
    type.startsWith('image/') ? FileImage : type.startsWith('video/') ? Video : type === 'application/pdf' ? FileText : File;
  const tone = ev.verificationStatus === 'VERIFIED' ? 'green' : ev.verificationStatus === 'REJECTED' ? 'red' : 'amber';

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    try {
      await openEvidenceInTab(ev.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not open the evidence file', 'error');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="evidence-card">
      <div className={`evidence-icon ev-${tone}`}>
        <Icon size={22} />
      </div>
      <div className="evidence-main">
        <strong className="evidence-name">{fileNameFromUrl(ev.fileUrl)}</strong>
        <span className="muted">
          {type || 'Unknown type'} · uploaded {formatDate(ev.uploadedAt)} by {uploaderName}
        </span>
        <div className="evidence-meta">
          <Badge tone={VERIFICATION_TONES[ev.verificationStatus]}>
            {VERIFICATION_LABELS[ev.verificationStatus]}
          </Badge>
        </div>
        {ev.remarks && <p className="evidence-remarks">“{ev.remarks}”</p>}
      </div>
      <div className="evidence-actions">
        <button
          className="icon-btn"
          onClick={() => void handleOpen()}
          title="Open file (logged to chain of custody)"
          disabled={opening}
        >
          {opening ? <Spinner size={17} /> : <ExternalLink size={17} />}
        </button>
        {canVerify && (
          <Button variant={ev.verificationStatus === 'VERIFIED' ? 'secondary' : 'gold'} onClick={onVerify}>
            {ev.verificationStatus === 'VERIFIED' ? <BadgeCheck size={15} /> : <ShieldX size={15} />}
            {ev.verificationStatus === 'VERIFIED' ? 'Review' : 'Verify'}
          </Button>
        )}
      </div>
    </div>
  );
}

function AssignModal({
  open,
  onClose,
  caseData,
  investigators,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  caseData: LegalCase;
  investigators: User[];
  onAssigned: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [investigatorId, setInvestigatorId] = useState(caseData.investigatorId ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!investigatorId) return;
    setBusy(true);
    try {
      await api.assignInvestigator(caseData.id, investigatorId);
      await onAssigned();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Assignment failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign investigator"
      subtitle={`Assign an investigator to #${shortId(caseData.id)}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={busy} disabled={!investigatorId}>
            Assign
          </Button>
        </>
      }
    >
      <form className="modal-form" onSubmit={submit}>
        <Field label="Investigator" required>
          <Select value={investigatorId} onChange={(e) => setInvestigatorId(e.target.value)}>
            <option value="">Select an investigator…</option>
            {investigators.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.email}
              </option>
            ))}
          </Select>
        </Field>
        {investigators.length === 0 && (
          <p className="muted">No investigator accounts registered yet. Contact an admin.</p>
        )}
      </form>
    </Modal>
  );
}

function StatusModal({
  open,
  onClose,
  caseData,
  role,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  caseData: LegalCase;
  role: string;
  onUpdated: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const options: CaseStatus[] = role === 'JUDGE' ? [...ACTIVE_STATUSES, 'CLOSED'] : ACTIVE_STATUSES;
  const [status, setStatus] = useState<CaseStatus>(
    caseData.status === 'CLOSED' ? 'OPEN' : caseData.status,
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.updateCaseStatus(caseData.id, status);
      await onUpdated();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={role === 'JUDGE' && caseData.status === 'CLOSED' ? 'Reopen case' : 'Update case status'}
      subtitle={`Move #${shortId(caseData.id)} to a new phase`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={busy}>
            Save status
          </Button>
        </>
      }
    >
      <form className="modal-form" onSubmit={submit}>
        <Field label="New status" required>
          <Select value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>
            {options.map((s) => (
              <option key={s} value={s}>
                {CASE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        {role === 'JUDGE' && caseData.status !== 'CLOSED' && (
          <p className="notice">Closing a case freezes all further evidence submission.</p>
        )}
      </form>
    </Modal>
  );
}

function VerifyModal({
  evidence: ev,
  onClose,
  onVerified,
}: {
  evidence: Evidence;
  onClose: () => void;
  onVerified: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'REJECTED' && !remarks.trim()) {
      toast('Remarks are required when rejecting evidence', 'error');
      return;
    }
    setBusy(true);
    try {
      await api.verifyEvidence(ev.id, status, remarks.trim());
      toast(status === 'VERIFIED' ? 'Evidence verified' : 'Evidence rejected', 'success');
      await onVerified();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Verification failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Forensic verification"
      subtitle={`Review “${fileNameFromUrl(ev.fileUrl)}”`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={status === 'REJECTED' ? 'danger' : 'primary'}
            onClick={submit}
            loading={busy}
          >
            {status === 'REJECTED' ? 'Reject evidence' : 'Verify evidence'}
          </Button>
        </>
      }
    >
      <form className="modal-form" onSubmit={submit}>
        <Field label="Decision" required>
          <div className="segmented">
            <button
              type="button"
              className={`segment${status === 'VERIFIED' ? ' active' : ''}`}
              onClick={() => setStatus('VERIFIED')}
            >
              Verified
            </button>
            <button
              type="button"
              className={`segment${status === 'REJECTED' ? ' active' : ''}`}
              onClick={() => setStatus('REJECTED')}
            >
              Rejected
            </button>
          </div>
        </Field>
        <Field
          label="Remarks"
          required={status === 'REJECTED'}
          hint={status === 'REJECTED' ? 'Required to explain the rejection reason.' : undefined}
        >
          <Textarea
            rows={3}
            placeholder="Add findings, authenticity notes, or rejection reasons…"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}

function eventTone(eventType: string): string {
  if (eventType.includes('CREATED')) return 'indigo';
  if (eventType.includes('ASSIGNED') || eventType.includes('STATUS')) return 'blue';
  if (eventType.includes('VERIFIED')) return 'green';
  if (eventType.includes('REJECTED')) return 'red';
  if (eventType.includes('UPLOADED')) return 'amber';
  if (eventType.includes('VIEWED')) return 'cyan';
  return 'gray';
}
