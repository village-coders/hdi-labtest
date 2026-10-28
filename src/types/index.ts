export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'REGISTRY' | 'QA' | 'FINANCE' | 'MANAGEMENT' | 'LAB_USER';

export type ResultStatusType = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';

export type WorkflowStatusType =
  | 'Received'
  | 'Registered'
  | 'Sent to Lab'
  | 'In Processing'
  | 'Result Received'
  | 'Closed'
  | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  labIdentifier?: string; // LAB_1, LAB_2, etc.
  labName?: string;
  phone?: string;
}

export interface Comment {
  _id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface StatusHistory {
  status: WorkflowStatusType;
  changedBy: string;
  note?: string;
  timestamp: string;
}

export interface Sample {
  _id: string;
  // Section A
  sampleName: string;
  companyName: string;
  companyAddress?: string;
  sampleCode: string;
  sampleNature: string;
  pictureUrl: string;
  attachmentUrl?: string | null;

  // Section B (Optional Product Details)
  productionDate?: string | null;
  expiryDate?: string | null;
  batchNo?: string;
  nafdacNo?: string;
  sonNo?: string;
  isoNo?: string;
  barcodeNo?: string;
  otherIdentifier?: string;

  // Section C
  dateOfEntry: string;
  analysisRequired: string[];
  receivingLabId: string;
  receivingLabName: string;
  processingDate?: string | null;
  sentBy: string;

  // Section D
  invoiceNo?: string;
  invoiceAmount?: string;
  invoiceFileUrl?: string | null;
  invoiceAcknowledged: boolean;
  receiptNo?: string;
  receiptFileUrl?: string | null;
  paymentConfirmedByLab?: boolean;
  resultStatus: ResultStatusType;
  resultFileUrl?: string | null;
  resultComments?: string;

  // Workflow
  workflowStatus: WorkflowStatusType;
  statusHistory: StatusHistory[];
  comments: Comment[];
  turnaroundTimeDays?: number | null;
  tatNoticeSentAt?: string | null;
  cannotPerformTestReason?: string | null;
  resultDiscrepancyNote?: string | null;
  resultDiscrepancyFileUrl?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletionReason?: string | null;
  isDirectSample?: boolean;
  isHistorical?: boolean;
  suppressNotifications?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  _id: string;
  name: string;
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

export interface NotificationLog {
  id: string;
  triggerNumber: number;
  triggerName: string;
  recipient: string;
  subject: string;
  message: string;
  sampleCode: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  error?: string;
  timestamp: string;
}

export interface DashboardStats {
  total: number;
  statusCounts: Record<string, number>;
  labCounts: Record<string, number>;
  averageTatOverall: number;
  tatPerLab: Record<string, number>;
  topCompanies: { name: string; count: number }[];
  monthlyTrends: Record<string, number>;
}

export interface Communication {
  _id: string;
  labIdentifier: string;
  labName: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderEmail?: string;
  subject?: string;
  message: string;
  sampleCode?: string;
  priority: 'NORMAL' | 'URGENT' | 'HIGH';
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}
