
export enum UserRole {
  ADMIN = 'ADMIN',   // 指挥中心/主管
  STAFF = 'STAFF',   // 内部员工
  CITIZEN = 'CITIZEN' // 外部委托方
}

// 细粒度权限定义
export type Permission = 
  | 'MANAGE_USERS'       // 人员管理
  | 'APPROVE_PROJECT'    // 立项审批
  | 'EDIT_PROJECT'       // 项目编辑/进度
  | 'MANAGE_FINANCE'     // 财务/预算/合同
  | 'MANAGE_MATERIALS'   // 材料/库存
  | 'MANAGE_ASSETS'      // 车辆/设备/固定资产
  | 'MANAGE_SAFETY'      // 质量/安全
  | 'MANAGE_HR'          // 人事/考勤/劳务
  | 'VIEW_SENSITIVE';    // 查看敏感数据

export enum ProjectStatus {
  PENDING = 'PENDING',      // 待审批
  REVIEWING = 'REVIEWING',  // 审批中
  APPROVED = 'APPROVED',    // 已立项
  IN_PROGRESS = 'IN_PROGRESS', // 施工中
  PAUSED = 'PAUSED',        // 停工待查
  COMPLETED = 'COMPLETED',  // 竣工验收
  REJECTED = 'REJECTED'     // 驳回
}

export enum ProjectType {
  ROADWORK = 'ROADWORK',
  SEWAGE = 'SEWAGE',
  LANDSCAPING = 'LANDSCAPING',
  ELECTRICAL = 'ELECTRICAL',
  STRUCTURAL = 'STRUCTURAL'
}

export enum ProjectPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY'
}

// --- 资源与业务模块接口 ---

export interface Material {
  id: string;
  name: string;
  spec: string; // 规格型号
  unit: string;
  stock: number;
  price: number;
  category: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  driver?: string;
}

// 投标管理 (我们去投别人的标)
export interface Bid {
  id: string;
  projectName: string;
  tenderUnit: string; // 招标单位
  amount: number;
  deadline: string;
  status: 'DRAFT' | 'SUBMITTED' | 'WON' | 'LOST';
  manager: string;
}

// 新增：招标管理 (我们发标让别人投)
export interface Tender {
  id: string;
  title: string;
  budget: number;
  publishDate: string;
  deadline: string;
  status: 'OPEN' | 'CLOSED' | 'EVALUATING';
  type: string; // 设计/施工/监理
}

// 劳务/人员实名制
export interface Laborer {
  id: string;
  name: string;
  idCard: string; // 身份证后四位
  role: string; // 工种：瓦工、电工等
  subcontractorId?: string; // 所属分包队伍
  phone: string;
  status: 'ACTIVE' | 'LEAVE';
  entryDate: string;
}

// 分包商
export interface Subcontractor {
  id: string;
  name: string; // 公司名
  category: string; // 资质类型
  contactPerson: string;
  phone: string;
  rating: number; // 评分 1-5
}

// 租赁管理
export interface Lease {
  id: string;
  itemName: string;
  supplier: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalCost: number;
  status: 'ACTIVE' | 'FINISHED';
}

// 预算计划
export interface BudgetPlan {
  id: string;
  name: string;
  department: string;
  year: string;
  totalAmount: number;
  usedAmount: number;
  status: 'APPROVED' | 'DRAFT';
}

// 质安巡检记录 (通用)
export interface InspectionRecord {
  id: string;
  projectName: string; // 关联项目名
  inspector: string;
  checkDate: string;
  type: 'QUALITY' | 'SAFETY';
  issue: string; // 问题描述
  level: 'NORMAL' | 'SERIOUS' | 'CRITICAL';
  status: 'PENDING' | 'RECTIFIED';
}

// 考勤打卡记录
export interface AttendanceLog {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: 'IN' | 'OUT';
  status: 'NORMAL' | 'LATE';
}

// 基础接口
export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  timestamp: string;
  action: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  name: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'NORMAL' | 'LATE' | 'ABSENT' | 'LEAVE';
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'DELAYED';
}

export interface CostItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Contract {
  id: string;
  supplierName: string; // 对方单位
  title: string;
  amount: number;
  status: 'SIGNED' | 'EXECUTING' | 'FINISHED';
  signDate: string;
  type: 'EXPENDITURE' | 'INCOME'; // 支出或收入
}

export interface SafetyRecord {
  id: string;
  date: string;
  type: 'QUALITY' | 'SAFETY';
  inspector: string;
  result: 'PASS' | 'FAIL' | 'WARNING';
  issue?: string;
  rectification?: string;
}

export interface DocFile {
  id: string;
  name: string;
  type: 'PDF' | 'DWG' | 'DOC' | 'IMG';
  size: string;
  uploadDate: string;
  uploader: string;
}

export interface TestRecord {
  id: string;
  projectId: string;
  testName: string;
  testType: string;
  testDate: string;
  operator: string;
  params: Record<string, number>;
  resultValue: string;
  isPassed: boolean;
  standard: string;
}

export interface User {
  id: string;
  name: string;
  username: string; 
  password?: string; // Explicitly keeping this for management
  role: UserRole;
  permissions: Permission[]; // 新增：个人权限列表
  department?: string;
  avatar?: string;
  lastLogin?: string;
  joinedDate?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  priority: ProjectPriority;
  budget: number;
  spent: number; 
  location: string;
  applicantName: string;
  applicantContact: string;
  status: ProjectStatus;
  createdAt: string;
  assignedTo?: string; 
  aiAnalysis?: string;
  progress: number; 
  notes: string[];
  
  milestones: Milestone[];
  costs: CostItem[];
  contracts: Contract[];
  safetyRecords: SafetyRecord[];
  documents: DocFile[];
  testRecords: TestRecord[];
}

// --- 常量 ---

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '指挥中心/主管',
  [UserRole.STAFF]: '内部员工/施工队',
  [UserRole.CITIZEN]: '市民/委托单位'
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  'MANAGE_USERS': '人员权限管理',
  'APPROVE_PROJECT': '立项审批权',
  'EDIT_PROJECT': '项目施工管理',
  'MANAGE_FINANCE': '财务/合同/预算',
  'MANAGE_MATERIALS': '材料/库存管理',
  'MANAGE_ASSETS': '车辆/设备管理',
  'MANAGE_SAFETY': '质安/巡检录入',
  'MANAGE_HR': '人事/考勤/劳务',
  'VIEW_SENSITIVE': '查看敏感数据'
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.PENDING]: '待审核',
  [ProjectStatus.REVIEWING]: '审核中',
  [ProjectStatus.APPROVED]: '已立项',
  [ProjectStatus.IN_PROGRESS]: '施工中',
  [ProjectStatus.PAUSED]: '停工整改',
  [ProjectStatus.COMPLETED]: '已竣工',
  [ProjectStatus.REJECTED]: '已驳回'
};

export const TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.ROADWORK]: '道路与铺装工程',
  [ProjectType.SEWAGE]: '给排水管网工程',
  [ProjectType.LANDSCAPING]: '公共景观绿化',
  [ProjectType.ELECTRICAL]: '市政电力照明',
  [ProjectType.STRUCTURAL]: '建筑结构加固'
};

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: '一般',
  [ProjectPriority.NORMAL]: '常规',
  [ProjectPriority.HIGH]: '重要',
  [ProjectPriority.EMERGENCY]: '紧急抢修'
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.PENDING]: 'bg-slate-100 text-slate-700',
  [ProjectStatus.REVIEWING]: 'bg-orange-100 text-orange-700',
  [ProjectStatus.APPROVED]: 'bg-blue-100 text-blue-700',
  [ProjectStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-700',
  [ProjectStatus.PAUSED]: 'bg-red-100 text-red-700',
  [ProjectStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700',
  [ProjectStatus.REJECTED]: 'bg-gray-200 text-gray-500'
};

export const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  [ProjectPriority.LOW]: 'text-slate-500 bg-slate-100',
  [ProjectPriority.NORMAL]: 'text-blue-600 bg-blue-50',
  [ProjectPriority.HIGH]: 'text-orange-600 bg-orange-50',
  [ProjectPriority.EMERGENCY]: 'text-white bg-red-600 animate-pulse'
};
