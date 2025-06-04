import { BaseEntity } from './index';

// Document Entity
export interface DocumentEntity extends BaseEntity {
  type: 'document';
  title: string;
  content: string;
  documentType: 'power_of_attorney' | 'will' | 'trust' | 'contract' | 'other';
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'finalized';
  author?: string;
  reviewer?: string;
  tags: string[];
  fileUrl?: string;
  size?: number;
}

// Person Entity (for parties involved in legal documents)
export interface PersonEntity extends BaseEntity {
  type: 'person';
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  role: 'principal' | 'agent' | 'witness' | 'notary' | 'attorney' | 'other';
  dateOfBirth?: string;
  identification?: {
    type: 'driver_license' | 'passport' | 'ssn' | 'other';
    number: string;
  };
}

// Task Entity
export interface TaskEntity extends BaseEntity {
  type: 'task';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: Date;
  completedDate?: Date;
  dependencies?: string[]; // IDs of other tasks
  relatedEntityIds?: string[]; // IDs of related entities (documents, persons, etc.)
  stepIndex?: number; // Which workflow step this task belongs to
}

// Note Entity
export interface NoteEntity extends BaseEntity {
  type: 'note';
  title: string;
  content: string;
  category: 'general' | 'legal_advice' | 'client_request' | 'internal' | 'reminder';
  isPrivate: boolean;
  attachments?: string[]; // File URLs or IDs
  relatedEntityIds?: string[]; // IDs of related entities
  author: string;
  stepIndex?: number; // Which workflow step this note belongs to
}

// Workflow Step Entity
export interface WorkflowStepEntity extends BaseEntity {
  type: 'workflow_step';
  stepIndex: number;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  completionPercentage: number;
  startedAt?: Date;
  completedAt?: Date;
  requiredTasks?: string[]; // Task IDs that must be completed
  requiredDocuments?: string[]; // Document IDs that must be present
  assignedAgent?: string;
}

// Finding Entity (for legal findings, issues, recommendations)
export interface FindingEntity extends BaseEntity {
  type: 'finding';
  title: string;
  description: string;
  category: 'issue' | 'recommendation' | 'requirement' | 'warning' | 'information';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed';
  relatedEntityIds?: string[]; // IDs of related entities
  discoveredAt: Date;
  resolvedAt?: Date;
  resolver?: string;
  stepIndex?: number;
}

// Audit Result Entity (for document audit results)
export interface AuditFinding {
  type: number;
  message: string;
  description: string;
  link: string | null;
}

export interface AuditPrincipal {
  userId: string;
  fullName: string;
  nationalId: string;
  address: string;
}

export interface AuditRepresentative {
  id: string;
  fullName: string;
  nationalId: string;
  relationship: string;
}

export interface AuditCondition {
  id: string;
  type: number;
  text: string;
  targetId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AuditData {
  principal: AuditPrincipal;
  scope: string;
  representatives: AuditRepresentative[];
  conditions: AuditCondition[];
  witnesses: any[]; // Can be more specific if witness structure is known
}

export interface AuditResultEntity extends BaseEntity {
  type: 'audit_result';
  documentId: string;
  findings: AuditFinding[];
  errors: AuditFinding[];
  warnings: AuditFinding[];
  recommendations: AuditFinding[];
  information: AuditFinding[];
  isSuccess: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  hasRecommendations: boolean;
  hasInformation: boolean;
  data: AuditData;
  stepIndex?: number;
}

// Union type of all entity types
export type AppEntity = 
  | DocumentEntity 
  | PersonEntity 
  | TaskEntity 
  | NoteEntity 
  | WorkflowStepEntity 
  | FindingEntity
  | AuditResultEntity;

// Entity creation helpers
export const createDocumentEntity = (data: Omit<DocumentEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): DocumentEntity => ({
  id: crypto.randomUUID(),
  type: 'document',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
});

export const createPersonEntity = (data: Omit<PersonEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): PersonEntity => ({
  id: crypto.randomUUID(),
  type: 'person',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
});

export const createTaskEntity = (data: Omit<TaskEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): TaskEntity => ({
  id: crypto.randomUUID(),
  type: 'task',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
});

export const createNoteEntity = (data: Omit<NoteEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): NoteEntity => ({
  id: crypto.randomUUID(),
  type: 'note',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
});

export const createWorkflowStepEntity = (data: Omit<WorkflowStepEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): WorkflowStepEntity => ({
  id: crypto.randomUUID(),
  type: 'workflow_step',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
});

export const createFindingEntity = (data: Omit<FindingEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): FindingEntity => ({
  id: crypto.randomUUID(),
  type: 'finding',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
});

export const createAuditResultEntity = (data: Omit<AuditResultEntity, 'id' | 'type' | 'createdAt' | 'updatedAt'>): AuditResultEntity => ({
  id: crypto.randomUUID(),
  type: 'audit_result',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...data
}); 