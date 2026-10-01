export type ClosedLoopSortField = 
  | 'taskNo'
  | 'equipmentName'
  | 'department'
  | 'urgency'
  | 'stage'
  | 'faultTime'
  | 'budget';

export type ClosedLoopSortOrder = 'asc' | 'desc';

export type ClosedLoopTableDensity = 'default' | 'compact';

export type ClosedLoopViewMode = 'table' | 'cards';

export type ClosedLoopQuickFilterKey = 
  | 'all'
  | 'pending_verify'
  | 'verified_pending_draft'
  | 'approving'
  | 'approved'
  | 'closed';

export interface ClosedLoopColumnVisibility {
  indexNumber: boolean;
  taskNo: boolean;
  equipment: boolean;
  department: boolean;
  fault: boolean;
  urgency: boolean;
  stageProgress: boolean;
  verificationBudget: boolean;
  faultTime: boolean;
  actions: boolean;
}

export const DEFAULT_CLOSED_LOOP_COLUMN_VISIBILITY: ClosedLoopColumnVisibility = {
  indexNumber: true,
  taskNo: true,
  equipment: true,
  department: true,
  fault: true,
  urgency: true,
  stageProgress: true,
  verificationBudget: true,
  faultTime: true,
  actions: true,
};
