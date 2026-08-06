export type Role =
  | 'ADMIN'
  | 'POLICE_OFFICER'
  | 'INVESTIGATOR'
  | 'LAWYER'
  | 'JUDGE'
  | 'FORENSIC_EXPERT';

export type CaseStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'EVIDENCE_COLLECTION'
  | 'IN_COURT'
  | 'CLOSED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface LoginResponse {
  token: string;
  userId: string;
  role: Role;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LegalCase {
  id: string;
  title: string;
  description: string;
  category: string;
  status: CaseStatus;
  policeOfficerId: string | null;
  investigatorId: string | null;
  createdAt: string;
}

export interface CreateCasePayload {
  title: string;
  description: string;
  category: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  fileType: string;
  fileUrl: string;
  verificationStatus: VerificationStatus;
  remarks: string | null;
  uploaderId: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  serviceName: string;
  eventType: string;
  eventDetails: string;
  timestamp: string;
}
