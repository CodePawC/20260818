import {
  ActiveTab,
  AuthUser,
  EquipmentLoanRecord,
  MedicalEquipment,
  SystemStats
} from '../../types';
import { ApprovalApplication } from '../../types/approvalTypes';
import { EngineeringWorkOrder } from '../../types/dispatchTypes';
import { MonthlyFrameworkBatch } from '../../types/vendorCollaborationTypes';
import { ImmediateReconciliationItem } from '../ImmediateReconciliationPanel';
import { WorkScheduleItem } from '../../utils/scheduleData';
import { RepairReportDetailData } from '../RepairReportDetailModal';

export interface BorrowedDeviceEntry {
  device: MedicalEquipment;
  loan: EquipmentLoanRecord;
  daysElapsed: number;
  isOverdue: boolean;
  isHalfwayPassed: boolean;
  daysRemaining: number;
  daysOverdue: number;
}

export interface RoleHomepageCommonProps {
  currentUser?: AuthUser | null;
  userDept: string;
  stats: SystemStats;
  equipmentList: MedicalEquipment[];
  allEquipmentList: MedicalEquipment[];
  scopedEquipmentList: MedicalEquipment[];
  departmentOptions: string[];
  liveWorkOrders: EngineeringWorkOrder[];
  approvalApplications: ApprovalApplication[];
  borrowedEmergencyDevices: BorrowedDeviceEntry[];
  upcomingPmAndCalibrations: MedicalEquipment[];
  lifeSupportDevices: MedicalEquipment[];
  frameworkBatches: MonthlyFrameworkBatch[];
  scheduleItems: WorkScheduleItem[];
  urgentReconcileCount: number;
  totalDiffAmount: number;
  handoverCompletedToday: boolean;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onNavigateToLedger: (statusFilter?: string, departmentFilter?: string) => void;
  onNavigateToApprovals?: (data?: Partial<ApprovalApplication>) => void;
  onOpenAddModal: () => void;
  onOpenRepairModal: (device?: MedicalEquipment) => void;
  onOpenAiModal: (device?: MedicalEquipment) => void;
  onOpenStatusModal: (device: MedicalEquipment) => void;
  onSelectDeviceDetail: (device: MedicalEquipment) => void;
  onReturnEquipment?: (device: MedicalEquipment) => void;
  onOpenOfficialReport?: (device?: MedicalEquipment, reason?: string) => void;
  onDirectDispatch?: (order: EngineeringWorkOrder) => void;
  onOpenFieldOperation: (order: EngineeringWorkOrder) => void;
  onOpenClinicalAcceptance: (order: EngineeringWorkOrder) => void;
  onCompleteHandoverCheck: () => void;
  onOpenScheduleAdd: () => void;
  onToggleScheduleStatus: (id: string) => void;
  onOpenRepairDetail: (data: RepairReportDetailData) => void;
  onItemReconciled: (item: ImmediateReconciliationItem) => void;
}
