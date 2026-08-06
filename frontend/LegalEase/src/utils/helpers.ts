import { FILE_BASE, downloadEvidence } from '../api/client';
import type { CaseStatus, Role, VerificationStatus } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  POLICE_OFFICER: 'Police Officer',
  INVESTIGATOR: 'Investigator',
  LAWYER: 'Lawyer',
  JUDGE: 'Judge',
  FORENSIC_EXPERT: 'Forensic Expert',
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  OPEN: 'Open',
  UNDER_INVESTIGATION: 'Under Investigation',
  EVIDENCE_COLLECTION: 'Evidence Collection',
  IN_COURT: 'In Court',
  CLOSED: 'Closed',
};

export const CASE_STATUS_TONES: Record<CaseStatus, string> = {
  OPEN: 'green',
  UNDER_INVESTIGATION: 'blue',
  EVIDENCE_COLLECTION: 'amber',
  IN_COURT: 'purple',
  CLOSED: 'gray',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const VERIFICATION_TONES: Record<VerificationStatus, string> = {
  PENDING: 'amber',
  VERIFIED: 'green',
  REJECTED: 'red',
};

export const CATEGORIES = [
  'CRIMINAL',
  'CIVIL',
  'FRAUD',
  'CYBER',
  'DOMESTIC',
  'PROPERTY',
  'TRAFFIC',
  'OTHER',
] as const;

export const canCreateCase = (role: Role) => role === 'POLICE_OFFICER';
export const canAssignInvestigator = (role: Role) => role === 'POLICE_OFFICER';
export const canUploadEvidence = (role: Role) =>
  role === 'POLICE_OFFICER' || role === 'INVESTIGATOR' || role === 'FORENSIC_EXPERT';
export const canVerifyEvidence = (role: Role) => role === 'FORENSIC_EXPERT';
export const canManageUsers = (role: Role) => role === 'ADMIN';
export const canViewAudit = (role: Role) => role === 'ADMIN' || role === 'JUDGE';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function shortId(id: string): string {
  if (id.length <= 8) return id;
  return id.slice(0, 8).toUpperCase();
}

export function fileNameFromUrl(url: string): string {
  const parts = url.split(/[\\/]/);
  return parts[parts.length - 1] || url;
}

export function evidenceFileUrl(url: string): string {
  const name = fileNameFromUrl(url);
  return `${FILE_BASE}/uploads/${encodeURIComponent(name)}`;
}

export async function openEvidenceInTab(id: string): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await downloadEvidence(id);
    const objectUrl = URL.createObjectURL(blob);
    if (win) {
      win.location.href = objectUrl;
    } else {
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'evidence';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  } catch (err) {
    if (win) win.close();
    throw err;
  }
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
