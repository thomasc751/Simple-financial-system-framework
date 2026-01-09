import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  User, UserRole, Project, ProjectStatus, ProjectType, ProjectPriority, Permission,
  TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, ROLE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, PERMISSION_LABELS,
  Milestone, CostItem, Contract, SafetyRecord, DocFile, AccessLog, AttendanceRecord, TestRecord,
  Material, Vehicle, Bid, Subcontractor, Laborer, Lease, Tender, BudgetPlan, InspectionRecord, AttendanceLog
} from './types';
import { Dashboard } from './components/Dashboard';
import { ProjectForm } from './components/ProjectForm';
import { ProjectDetail } from './components/ProjectDetail';
import { analyzeProjectRisk } from './services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// --- Mock Data ---
const ALL_PERMISSIONS: Permission[] = [
    'MANAGE_USERS', 'APPROVE_PROJECT', 'EDIT_PROJECT', 'MANAGE_FINANCE', 
    'MANAGE_MATERIALS', 'MANAGE_ASSETS', 'MANAGE_SAFETY', 'MANAGE_HR', 'VIEW_SENSITIVE'
];

const INITIAL_USERS: User[] = [
  { id: '1001', name: '王建国', username: 'admin', password: '123', role: UserRole.ADMIN, permissions: [...ALL_PERMISSIONS], department: '市政指挥中心', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u1', joinedDate: '2020-01-01' },
  { id: '2001', name: '李明', username: 'liming', password: '123', role: UserRole.STAFF, permissions: ['EDIT_PROJECT', 'MANAGE_SAFETY', 'MANAGE_MATERIALS'], department: '道路工程部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u2', joinedDate: '2021-03-15' },
  { id: '2002', name: '张晓红', username: 'zhangxh', password: '123', role: UserRole.STAFF, permissions: ['MANAGE_SAFETY', 'MANAGE_ASSETS'], department: '质监局', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u3', joinedDate: '2021-06-20' },
  { id: '2003', name: '陈志强', username: 'chenzq', password: '123', role: UserRole.STAFF, permissions: ['EDIT_PROJECT', 'MANAGE_ASSETS'], department: '排水抢修队', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u4', joinedDate: '2022-11-11' },
  { id: '9001', name: '刘市民', username: 'citizen', password: '123', role: UserRole.CITIZEN, permissions: [], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u5', joinedDate: '2023-01-05' },
];

const MOCK_MATERIALS: Material[] = [
    { id: 'm1', name: 'C30混凝土', spec: '标准', unit: '立方米', stock: 500, price: 350, category: '基础建材' },
    { id: 'm2', name: 'DN800排水管', spec: 'DN800', unit: '米', stock: 120, price: 800, category: '管材' },
    { id: 'm3', name: '沥青', spec: '改性', unit: '吨', stock: 50, price: 4200, category: '路面材料' },
];

const MOCK_VEHICLES: Vehicle[] = [
    { id: 'v1', plate: '京A-88888', model: '挖掘机 CAT320', status: 'AVAILABLE' },
    { id: 'v2', plate: '京A-66666', model: '压路机 XCMG', status: 'IN_USE', driver: '李四' },
    { id: 'v3', plate: '京A-12345', model: '工程抢险车', status: 'AVAILABLE' },
];

const MOCK_BIDS: Bid[] = [
    { id: 'b1', projectName: '市中心环路改造二期', tenderUnit: '市交通局', amount: 12000000, deadline: '2024-05-01', status: 'SUBMITTED', manager: '李明' },
    { id: 'b2', projectName: '滨河公园绿化养护', tenderUnit: '园林绿化局', amount: 800000, deadline: '2023-12-01', status: 'WON', manager: '王建国' },
];

const MOCK_TENDERS: Tender[] = [
    { id: 't1', title: '新区污水处理厂扩建工程施工', budget: 50000000, publishDate: '2023-10-01', deadline: '2023-11-01', status: 'OPEN', type: '施工' },
    { id: 't2', title: '市政道路景观设计', budget: 2000000, publishDate: '2023-09-15', deadline: '2023-10-15', status: 'EVALUATING', type: '设计' }
];

const MOCK_SUBCONTRACTORS: Subcontractor[] = [
    { id: 's1', name: '宏达劳务有限公司', category: '土建施工', contactPerson: '赵铁柱', phone: '13900001111', rating: 4.8 },
    { id: 's2', name: '精诚电气安装', category: '机电安装', contactPerson: '孙工', phone: '13812345678', rating: 4.5 },
];

const MOCK_LABORERS: Laborer[] = [
    { id: 'l1', name: '张三', idCard: '1234', role: '瓦工', subcontractorId: 's1', phone: '15011112222', status: 'ACTIVE', entryDate: '2023-05-10' },
    { id: 'l2', name: '李四', idCard: '5678', role: '挖掘机手', subcontractorId: 's1', phone: '15033334444', status: 'ACTIVE', entryDate: '2023-06-01' },
];

const MOCK_LEASES: Lease[] = [
    { id: 'le1', itemName: '25吨吊车', supplier: '力神租赁', startDate: '2023-10-01', endDate: '2023-10-15', dailyRate: 1200, totalCost: 18000, status: 'FINISHED' }
];

const MOCK_BUDGETS: BudgetPlan[] = [
    { id: 'bp1', name: '2024年度道路维护专项预算', department: '道路工程部', year: '2024', totalAmount: 10000000, usedAmount: 250000, status: 'APPROVED' },
    { id: 'bp2', name: '2023年第四季度应急抢修金', department: '市政指挥中心', year: '2023', totalAmount: 500000, usedAmount: 480000, status: 'APPROVED' }
];

const MOCK_INSPECTIONS: InspectionRecord[] = [
    { id: 'ir1', projectName: '解放路修复工程', inspector: '张晓红', checkDate: '2023-10-18', type: 'QUALITY', issue: '回填土压实度不足', level: 'SERIOUS', status: 'PENDING' },
    { id: 'ir2', projectName: '北湖公园照明', inspector: '张晓红', checkDate: '2023-10-20', type: 'SAFETY', issue: '临时用电未接地', level: 'CRITICAL', status: 'RECTIFIED' }
];

const MOCK_ATTENDANCE_LOGS: AttendanceLog[] = [
    { id: 'al1', name: '李明', date: '2023-10-26', time: '08:05:12', location: '解放路现场', type: 'IN', status: 'NORMAL' },
    { id: 'al2', name: '张三', date: '2023-10-26', time: '07:55:00', location: '解放路现场', type: 'IN', status: 'NORMAL' },
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'P20231015-01',
    title: '解放路地下排水管网紧急修复',
    description: '解放路与建设大街交叉口出现路面塌陷风险，经勘查为地下排水主管道破裂导致水土流失。需进行开挖修复及路基加固。',
    type: ProjectType.SEWAGE,
    priority: ProjectPriority.EMERGENCY,
    budget: 450000,
    spent: 285000,
    location: '解放路与建设大街交叉口',
    applicantName: '市政运营科',
    applicantContact: '13800138000',
    status: ProjectStatus.IN_PROGRESS,
    createdAt: '2023-10-15T08:00:00Z',
    assignedTo: '2003',
    progress: 65,
    notes: ['2023-10-15: 接到报警，已封锁现场', '2023-10-16: 物资已进场，开始挖掘'],
    milestones: [
        { id: 'm1', name: '现场勘查与封锁', date: '2023-10-15', status: 'COMPLETED' },
        { id: 'm2', name: '挖掘与旧管拆除', date: '2023-10-18', status: 'COMPLETED' },
        { id: 'm3', name: '新管铺设与焊接', date: '2023-10-25', status: 'PENDING' }
    ],
    costs: [
        { id: 'c1', category: '设备租赁', amount: 50000, date: '2023-10-16', description: '挖掘机进场首付' },
        { id: 'c2', category: '材料费', amount: 120000, date: '2023-10-17', description: 'DN800排水管材采购' }
    ],
    contracts: [],
    safetyRecords: [],
    documents: [],
    testRecords: []
  }
];

// --- Context ---
interface AppContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  checkPermission: (perm: Permission) => boolean;
  
  projects: Project[];
  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  
  users: User[];
  addUser: (u: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Generic CRUD Handlers
  materials: Material[]; setMaterials: any;
  vehicles: Vehicle[]; setVehicles: any;
  bids: Bid[]; setBids: any;
  tenders: Tender[]; setTenders: any;
  subcontractors: Subcontractor[]; setSubcontractors: any;
  laborers: Laborer[]; setLaborers: any;
  leases: Lease[]; setLeases: any;
  expenseContracts: Contract[]; setExpenseContracts: any;
  incomeContracts: Contract[]; setIncomeContracts: any;
  budgets: BudgetPlan[]; setBudgets: any;
  inspections: InspectionRecord[]; setInspections: any;
  attendanceLogs: AttendanceLog[]; setAttendanceLogs: any;
  
  notifications: string[];
  addNotification: (msg: string) => void;
  
  accessLogs: AccessLog[];
  logAccess: (projectId: string, action?: string) => void;
  
  attendanceRecords: AttendanceRecord[];
  clockIn: () => void;
  clockOut: () => void;
  todayAttendance: AttendanceRecord | undefined;
  addTestRecord: (projectId: string, record: TestRecord) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- Helper Components ---

const PermissionGuard = ({ perm, children, fallback }: { perm: Permission, children: React.ReactNode, fallback?: React.ReactNode }) => {
    const { checkPermission } = useAppContext();
    if (checkPermission(perm)) {
        return <>{children}</>;
    }
    return fallback ? <>{fallback}</> : null;
};

// --- App Portal (Main Feature Hub) ---

const AppPortal = () => {
    const navigate = useNavigate();
    const { currentUser, checkPermission, projects } = useAppContext();

    const modules = [
        // Engineering
        { name: '投标管理', icon: 'fa-bullseye', color: 'bg-indigo-500', link: '/bids', perm: 'EDIT_PROJECT' },
        { name: '招标管理', icon: 'fa-gavel', color: 'bg-indigo-600', link: '/tenders', perm: 'EDIT_PROJECT' },
        { name: '立项审批', icon: 'fa-stamp', color: 'bg-blue-500', link: '/approvals', perm: 'APPROVE_PROJECT' },
        { name: '收入合同', icon: 'fa-file-signature', color: 'bg-blue-600', link: '/contracts-in', perm: 'MANAGE_FINANCE' },
        { name: '支出合同', icon: 'fa-file-contract', color: 'bg-blue-700', link: '/contracts', perm: 'MANAGE_FINANCE' },
        
        // Resources
        { name: '预算管理', icon: 'fa-calculator', color: 'bg-rose-500', link: '/budget', perm: 'MANAGE_FINANCE' },
        { name: '材料管理', icon: 'fa-boxes-stacked', color: 'bg-amber-500', link: '/materials', perm: 'MANAGE_MATERIALS' },
        { name: '劳务管理', icon: 'fa-helmet-safety', color: 'bg-cyan-600', link: '/labor', perm: 'MANAGE_HR' },
        { name: '分包管理', icon: 'fa-handshake', color: 'bg-amber-600', link: '/subcontractors', perm: 'EDIT_PROJECT' },
        { name: '租赁管理', icon: 'fa-file-invoice', color: 'bg-orange-400', link: '/leasing', perm: 'MANAGE_ASSETS' },

        // Quality & Safety & Admin
        { name: '质量管理', icon: 'fa-award', color: 'bg-emerald-500', link: '/quality', perm: 'MANAGE_SAFETY' },
        { name: '安全管理', icon: 'fa-shield-halved', color: 'bg-emerald-600', link: '/safety', perm: 'MANAGE_SAFETY' },
        { name: '车辆管理', icon: 'fa-truck-front', color: 'bg-orange-600', link: '/vehicles', perm: 'MANAGE_ASSETS' },
        { name: '考勤打卡', icon: 'fa-fingerprint', color: 'bg-teal-500', link: '/attendance', perm: 'MANAGE_HR' },
        { name: '人事权限', icon: 'fa-users-gear', color: 'bg-cyan-500', link: '/users', perm: 'MANAGE_USERS' },
    ];

    const allowedModules = modules.filter(m => checkPermission(m.perm as Permission));
    const pendingCount = projects.filter(p => p.status === ProjectStatus.PENDING || p.status === ProjectStatus.REVIEWING).length;

    // --- Citizen View ---
    if (currentUser?.role === UserRole.CITIZEN) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 rounded-2xl text-white shadow-lg">
                    <h2 className="text-3xl font-bold mb-2">欢迎进入市民办事大厅</h2>
                    <p className="opacity-90">快捷申报市政问题，实时追踪处理进度。</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <button onClick={() => navigate('/create')} className="bg-white p-8 rounded-xl shadow-md border border-orange-100 hover:shadow-xl hover:-translate-y-1 transition text-left group">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:bg-orange-600 group-hover:text-white transition">
                            <i className="fa-solid fa-bullhorn"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">在线委托/报修</h3>
                        <p className="text-slate-500 mt-2">发现道路破损、积水或其他市政问题？点击此处立即上报。</p>
                    </button>

                    <button onClick={() => navigate('/projects')} className="bg-white p-8 rounded-xl shadow-md border border-blue-100 hover:shadow-xl hover:-translate-y-1 transition text-left group">
                         <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                            <i className="fa-solid fa-magnifying-glass-location"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">进度查询</h3>
                        <p className="text-slate-500 mt-2">查询已申报项目的审批、施工及完工状态。</p>
                    </button>
                </div>
            </div>
        )
    }

    // --- Admin/Staff View ---
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-gradient-to-r from-municipal-800 to-municipal-600 p-8 rounded-2xl text-white shadow-lg mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">欢迎回来, {currentUser?.name}</h2>
                    <p className="opacity-80">当前系统运行平稳，{pendingCount} 个待办事项需处理。</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 text-9xl transform translate-x-10 translate-y-10">
                    <i className="fa-solid fa-city"></i>
                </div>
            </div>

            {/* Quick Access to Pending Approvals for Admins */}
            {checkPermission('APPROVE_PROJECT') && pendingCount > 0 && (
                <div onClick={() => navigate('/approvals')} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-orange-100 transition mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center">
                            <i className="fa-solid fa-bell"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-orange-900">审批提醒</h4>
                            <p className="text-sm text-orange-700">您有 <span className="font-bold">{pendingCount}</span> 个项目申请等待审批。</p>
                        </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-orange-400"></i>
                </div>
            )}

            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <i className="fa-solid fa-grid-2 text-municipal-600"></i> 综合管理矩阵
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {allowedModules.map(m => (
                    <div 
                        key={m.name} 
                        onClick={() => navigate(m.link)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition group relative"
                    >
                        <div className={`w-14 h-14 rounded-2xl ${m.color} text-white flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition`}>
                            <i className={`fa-solid ${m.icon}`}></i>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{m.name}</span>
                        {/* Notification badge for approvals */}
                        {m.link === '/approvals' && pendingCount > 0 && (
                            <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Generic Data Layout Component (No changes needed, kept for context) ---
// ... (DataModuleLayout code is reused) ...
interface FieldConfig {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'status';
    options?: {value: string, label: string, color?: string}[];
    width?: string;
}

interface DataModuleProps {
    title: string;
    icon: string;
    data: any[];
    fields: FieldConfig[];
    onAdd: (item: any) => void;
    onDelete: (id: string) => void;
    // Special Actions
    customAction?: (item: any) => React.ReactNode;
}

const DataModuleLayout: React.FC<DataModuleProps> = ({ title, icon, data, fields, onAdd, onDelete, customAction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<any>({});
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSave = () => {
        onAdd({...newItem, id: Date.now().toString()});
        setIsModalOpen(false);
        setNewItem({});
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-municipal-100 text-municipal-600 rounded-lg flex items-center justify-center text-xl">
                        <i className={`fa-solid ${icon}`}></i>
                    </div>
                    {title}
                </h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <i className="fa-solid fa-search absolute left-3 top-3 text-slate-400"></i>
                        <input 
                            className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-municipal-500 outline-none" 
                            placeholder="搜索..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-municipal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-municipal-700 shadow-md flex items-center gap-2">
                        <i className="fa-solid fa-plus"></i> 新增
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                            <tr>
                                {fields.map(f => <th key={f.key} className="p-4" style={{width: f.width}}>{f.label}</th>)}
                                <th className="p-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length === 0 ? (
                                <tr><td colSpan={fields.length + 1} className="p-8 text-center text-slate-400">暂无数据</td></tr>
                            ) : (
                                filteredData.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition">
                                        {fields.map(f => (
                                            <td key={f.key} className="p-4">
                                                {f.type === 'status' ? (
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        f.options?.find(o => o.value === item[f.key])?.color || 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {f.options?.find(o => o.value === item[f.key])?.label || item[f.key]}
                                                    </span>
                                                ) : f.key.includes('amount') || f.key.includes('price') || f.key.includes('Cost') || f.key.includes('budget') ? (
                                                    <span className="font-mono">¥{Number(item[f.key]).toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-slate-700">{item[f.key]}</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            {customAction && customAction(item)}
                                            <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition">
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Universal Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-8 w-full max-w-lg animate-fade-in-up shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-slate-800">新增{title}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {fields.map(f => (
                                <div key={f.key}>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">{f.label}</label>
                                    {f.type === 'select' || f.type === 'status' ? (
                                        <select 
                                            className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-municipal-500"
                                            onChange={e => setNewItem({...newItem, [f.key]: e.target.value})}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>请选择</option>
                                            {f.options?.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input 
                                            type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                            className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-municipal-500"
                                            placeholder={`请输入${f.label}`}
                                            onChange={e => setNewItem({...newItem, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value})}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">取消</button>
                            <button onClick={handleSave} className="flex-1 py-3 bg-municipal-600 text-white rounded-lg font-bold hover:bg-municipal-700 shadow-lg">确认保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Updated User Management with Password Reset ---
const UserManagement = () => {
    const { users, addUser, deleteUser, updateUser, addNotification } = useAppContext();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState<Partial<User>>({ name: '', role: UserRole.STAFF, permissions: [], password: '' });

    // Helper to toggle a permission in the list
    const togglePermission = (perm: Permission, currentList: Permission[]) => {
        if (currentList.includes(perm)) {
            return currentList.filter(p => p !== perm);
        } else {
            return [...currentList, perm];
        }
    };

    const handleSaveUser = () => {
        if (editingUser) {
            updateUser(editingUser.id, newUser);
            addNotification("用户信息更新成功");
            setEditingUser(null);
        } else {
            // Create
             const id = (Math.floor(Math.random() * 9000) + 1000).toString();
             addUser({ ...newUser, id, username: `u${id}`, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`, joinedDate: new Date().toISOString().split('T')[0] } as User);
             addNotification("新用户创建成功");
             setShowAddModal(false);
        }
        setNewUser({ name: '', role: UserRole.STAFF, permissions: [], password: '' });
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setNewUser({ ...u }); // Pre-fill data
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <i className="fa-solid fa-users-gear text-municipal-600"></i> 人员与权限管理
                </h2>
                <button onClick={() => { setEditingUser(null); setNewUser({role: UserRole.STAFF, permissions: [], password: '123'}); setShowAddModal(true); }} className="bg-municipal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-municipal-700 shadow-md">
                    <i className="fa-solid fa-user-plus"></i> 新增人员
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition relative group">
                        <div className="flex items-center gap-4 mb-4">
                            <img src={u.avatar} className="w-12 h-12 rounded-full border border-slate-200" />
                            <div>
                                <h3 className="font-bold text-slate-800">{u.name}</h3>
                                <p className="text-xs text-slate-500">{ROLE_LABELS[u.role]}</p>
                            </div>
                            <button onClick={() => openEdit(u)} className="absolute top-4 right-4 text-slate-400 hover:text-municipal-600"><i className="fa-solid fa-pen-to-square"></i></button>
                        </div>
                        <div className="border-t pt-3">
                            <p className="text-xs font-bold text-slate-400 mb-2">拥有权限 ({u.permissions.length})</p>
                            <div className="flex flex-wrap gap-1">
                                {u.permissions.slice(0, 5).map(p => (
                                    <span key={p} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{PERMISSION_LABELS[p]}</span>
                                ))}
                                {u.permissions.length > 5 && <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-400">...</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* User Edit/Add Modal */}
            {(showAddModal || editingUser) && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2">{editingUser ? '编辑用户 / 修改密码' : '新增人员'}</h3>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">姓名</label>
                                <input className="w-full border p-2 rounded" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} disabled={!!editingUser && false} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">角色</label>
                                <select className="w-full border p-2 rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                    <option value={UserRole.STAFF}>内部员工</option>
                                    <option value={UserRole.ADMIN}>主管/管理员</option>
                                    <option value={UserRole.CITIZEN}>委托方</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">密码 (重置)</label>
                                <input type="password" className="w-full border p-2 rounded" placeholder="请输入新密码" value={newUser.password || ''} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-bold text-slate-700 mb-3">权限分配 (主管勾选)</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {ALL_PERMISSIONS.map(perm => (
                                    <label key={perm} className={`flex items-center gap-2 p-3 rounded border cursor-pointer transition ${newUser.permissions?.includes(perm) ? 'bg-municipal-50 border-municipal-500 text-municipal-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="accent-municipal-600"
                                            checked={newUser.permissions?.includes(perm)}
                                            onChange={() => setNewUser({ ...newUser, permissions: togglePermission(perm, newUser.permissions || []) })}
                                        />
                                        <span className="text-sm font-bold">{PERMISSION_LABELS[perm]}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => { setShowAddModal(false); setEditingUser(null); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">取消</button>
                            <button onClick={handleSaveUser} className="flex-1 py-3 bg-municipal-600 text-white rounded-lg font-bold hover:bg-municipal-700">保存设置</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ... (LoginScreen, Sidebar remain mostly same but slightly adjusted for Citizen nav) ...

const Sidebar = () => {
    const { currentUser, logout } = useAppContext();
    const navigate = useNavigate();
    
    return (
        <div className="w-64 bg-municipal-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl">
            <div className="p-5 border-b border-municipal-800 bg-municipal-950 flex items-center gap-3">
                <i className="fa-solid fa-building-columns text-2xl text-municipal-400"></i>
                <div><div className="font-bold leading-none">MuniWorks</div><div className="text-[10px] text-municipal-400">泛普工程管理系统</div></div>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 transition text-left text-sm text-municipal-100 hover:text-white">
                    <i className="fa-solid fa-house w-5 text-center"></i> 
                    {currentUser?.role === UserRole.CITIZEN ? '办事大厅' : '工作台'}
                </button>
                
                <div className="px-3 py-2 text-xs font-bold text-municipal-500 uppercase tracking-widest mt-4">业务管理</div>
                
                {/* Citizens see "Create" explicitly */}
                {currentUser?.role === UserRole.CITIZEN && (
                    <button onClick={() => navigate('/create')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 transition text-left text-sm text-municipal-100 hover:text-white">
                        <i className="fa-solid fa-plus-circle w-5 text-center"></i> 在线委托
                    </button>
                )}

                <button onClick={() => navigate('/projects')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 transition text-left text-sm text-municipal-100 hover:text-white">
                    <i className="fa-solid fa-list-ul w-5 text-center"></i> 
                    {currentUser?.role === UserRole.CITIZEN ? '进度查询' : '项目台账'}
                </button>

                {/* Approvals Link in Sidebar for Admins */}
                {currentUser?.permissions.includes('APPROVE_PROJECT') && (
                     <button onClick={() => navigate('/approvals')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 transition text-left text-sm text-municipal-100 hover:text-white">
                        <i className="fa-solid fa-stamp w-5 text-center"></i> 立项审批
                    </button>
                )}
                
                {/* Conditional Modules */}
                {currentUser?.permissions.includes('MANAGE_MATERIALS') && (
                    <button onClick={() => navigate('/materials')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 transition text-left text-sm text-municipal-100 hover:text-white">
                        <i className="fa-solid fa-boxes-stacked w-5 text-center"></i> 材料管理
                    </button>
                )}
                
                {currentUser?.permissions.includes('MANAGE_USERS') && (
                    <>
                        <div className="px-3 py-2 text-xs font-bold text-municipal-500 uppercase tracking-widest mt-4">系统配置</div>
                        <button onClick={() => navigate('/users')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/10 transition text-left text-sm text-municipal-100 hover:text-white">
                            <i className="fa-solid fa-users-gear w-5 text-center"></i> 人员权限
                        </button>
                    </>
                )}
            </nav>
            <div className="p-4 bg-municipal-950 border-t border-municipal-800">
                <div className="flex items-center gap-3 mb-3 p-2">
                    <img src={currentUser?.avatar} className="w-8 h-8 rounded-full border border-municipal-600" />
                    <div className="overflow-hidden flex-1">
                        <div className="text-sm font-bold truncate text-municipal-100">{currentUser?.name}</div>
                        <div className="text-xs text-municipal-400 truncate">{ROLE_LABELS[currentUser?.role!]}</div>
                    </div>
                </div>
                <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 transition">
                    <i className="fa-solid fa-power-off"></i> 退出系统
                </button>
            </div>
        </div>
    );
};

// ... (LoginScreen reused from previous snippet, no major changes needed except import context) ...
// Re-inserting LoginScreen for completeness if it was cut, but usually we just update changed parts.
// Assuming LoginScreen logic is stable in previous files, but re-pasting for safety in XML block.

const LoginScreen = () => {
  const { login, users } = useAppContext();
  const [authMode, setAuthMode] = useState<'ROLE' | 'CREDENTIALS'>('ROLE');
  const [creds, setCreds] = useState({ username: '', password: '' });

  const handleCredentialsLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const user = users.find(u => u.username === creds.username && u.password === creds.password);
      if (user) login(user);
  };
  const handleRoleLogin = (role: UserRole) => {
      const user = users.find(u => u.role === role);
      if (user) login(user);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px]">
        <div className="md:w-5/12 bg-municipal-900 p-12 text-white flex flex-col justify-between">
            <div><h1 className="text-4xl font-extrabold mb-4">MuniWorks<br/>泛普工程管理系统</h1><p className="text-municipal-200">全模块 · 细权限 · 深度联动</p></div>
            <div className="space-y-4 text-sm opacity-80">
                <p>✓ 30+ 业务模块集成</p>
                <p>✓ RBAC 动态权限分配</p>
                <p>✓ 资源库存实时联动</p>
            </div>
        </div>
        <div className="md:w-7/12 p-12 bg-white flex flex-col justify-center">
             <div className="flex justify-center mb-8 bg-slate-100 p-1 rounded-lg self-center w-fit mx-auto">
                 <button onClick={() => setAuthMode('ROLE')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${authMode === 'ROLE' ? 'bg-white shadow text-municipal-600' : 'text-slate-500'}`}>快捷演示</button>
                 <button onClick={() => setAuthMode('CREDENTIALS')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${authMode === 'CREDENTIALS' ? 'bg-white shadow text-municipal-600' : 'text-slate-500'}`}>密码登录</button>
             </div>
             {authMode === 'ROLE' ? (
                <div className="flex flex-col gap-4">
                    <button onClick={() => handleRoleLogin(UserRole.ADMIN)} className="p-4 border rounded-xl hover:bg-municipal-50 flex items-center gap-4 text-left group">
                        <div className="w-12 h-12 bg-municipal-100 text-municipal-600 rounded-full flex items-center justify-center text-xl"><i className="fa-solid fa-user-tie"></i></div>
                        <div><div className="font-bold">主管 (Admin)</div><div className="text-xs text-slate-500">拥有全权限，可分配权限</div></div>
                    </button>
                    <button onClick={() => handleRoleLogin(UserRole.STAFF)} className="p-4 border rounded-xl hover:bg-emerald-50 flex items-center gap-4 text-left group">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl"><i className="fa-solid fa-helmet-safety"></i></div>
                        <div><div className="font-bold">员工 (Staff)</div><div className="text-xs text-slate-500">受限权限，仅操作被授权模块</div></div>
                    </button>
                    <button onClick={() => handleRoleLogin(UserRole.CITIZEN)} className="p-4 border rounded-xl hover:bg-orange-50 flex items-center gap-4 text-left group">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl"><i className="fa-solid fa-user"></i></div>
                        <div><div className="font-bold">委托方 (Citizen)</div><div className="text-xs text-slate-500">只读权限，查看进度</div></div>
                    </button>
                </div>
             ) : (
                 <form onSubmit={handleCredentialsLogin} className="space-y-6 max-w-sm mx-auto w-full">
                     <input type="text" className="w-full p-3 border rounded-lg" placeholder="账号" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} />
                     <input type="password" className="w-full p-3 border rounded-lg" placeholder="密码" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} />
                     <button type="submit" className="w-full bg-municipal-900 text-white py-3 rounded-lg font-bold">登录</button>
                 </form>
             )}
        </div>
      </div>
    </div>
  );
};


const AppContent = () => {
    const { 
        currentUser, addProject, updateProject, projects, notifications,
        // Data sources from Context
        materials, setMaterials, 
        vehicles, setVehicles,
        bids, setBids,
        tenders, setTenders,
        subcontractors, setSubcontractors,
        laborers, setLaborers,
        leases, setLeases,
        expenseContracts, setExpenseContracts,
        incomeContracts, setIncomeContracts,
        budgets, setBudgets,
        inspections, setInspections,
        attendanceLogs, setAttendanceLogs
    } = useAppContext();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    if (!currentUser) return <LoginScreen />;

    // Generic Add/Delete Wrappers
    const createAddItem = (setter: any, list: any[]) => (item: any) => setter([...list, item]);
    const createDeleteItem = (setter: any, list: any[]) => (id: string) => setter(list.filter(i => i.id !== id));

    return (
        <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="h-16 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <h1 className="text-lg font-bold text-slate-700">智慧市政工程管理平台</h1>
                    <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-municipal-600 relative">
                             <i className="fa-solid fa-bell text-xl"></i>
                             {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                                <div className="p-3 bg-slate-50 border-b font-bold text-sm">通知消息</div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.map((msg, idx) => (
                                        <div key={idx} className="p-3 border-b border-slate-50 text-sm hover:bg-slate-50 text-slate-600">{msg}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </header>
                
                <main className="p-8 flex-1 overflow-x-hidden custom-scrollbar">
                    <Routes>
                        <Route path="/" element={<AppPortal />} />
                        <Route path="/projects" element={<Dashboard projects={projects} />} />
                        
                        {/* THE MISSING PIECE: The Project Detail Route */}
                        <Route path="/projects/:id" element={<ProjectDetail projects={projects} currentUser={currentUser} onUpdateProject={updateProject} />} />
                        
                        {/* --- User Management --- */}
                        <Route path="/users" element={
                            <PermissionGuard perm="MANAGE_USERS" fallback={<Navigate to="/" />}><UserManagement /></PermissionGuard>
                        } />
                        
                        {/* --- Resource & Business Modules --- */}
                        
                        <Route path="/materials" element={<PermissionGuard perm="MANAGE_MATERIALS"><DataModuleLayout 
                            title="材料库存管理" icon="fa-boxes-stacked" data={materials} 
                            fields={[
                                {key: 'name', label: '材料名称', type: 'text'}, {key: 'spec', label: '规格型号', type: 'text'},
                                {key: 'stock', label: '库存数量', type: 'number'}, {key: 'unit', label: '单位', type: 'text', width: '80px'},
                                {key: 'category', label: '分类', type: 'select', options: [{value:'基础建材', label:'基础建材'}, {value:'管材', label:'管材'}, {value:'电气', label:'电气'}]}
                            ]}
                            onAdd={createAddItem(setMaterials, materials)} onDelete={createDeleteItem(setMaterials, materials)}
                        /></PermissionGuard>} />

                        <Route path="/vehicles" element={<PermissionGuard perm="MANAGE_ASSETS"><DataModuleLayout 
                            title="车辆设备管理" icon="fa-truck-front" data={vehicles} 
                            fields={[
                                {key: 'plate', label: '车牌号/编号', type: 'text'}, {key: 'model', label: '品牌型号', type: 'text'},
                                {key: 'status', label: '状态', type: 'status', options: [{value:'AVAILABLE', label:'空闲', color:'bg-green-100 text-green-700'}, {value:'IN_USE', label:'使用中', color:'bg-orange-100 text-orange-700'}]},
                                {key: 'driver', label: '驾驶员', type: 'text'}
                            ]}
                            onAdd={createAddItem(setVehicles, vehicles)} onDelete={createDeleteItem(setVehicles, vehicles)}
                        /></PermissionGuard>} />

                        <Route path="/bids" element={<PermissionGuard perm="EDIT_PROJECT"><DataModuleLayout 
                            title="投标管理" icon="fa-bullseye" data={bids} 
                            fields={[
                                {key: 'projectName', label: '投标项目名称', type: 'text'}, {key: 'tenderUnit', label: '招标单位', type: 'text'},
                                {key: 'amount', label: '投标报价', type: 'number'}, {key: 'deadline', label: '截止日期', type: 'date'},
                                {key: 'status', label: '状态', type: 'status', options: [{value:'SUBMITTED', label:'已标投', color:'bg-blue-100 text-blue-700'}, {value:'WON', label:'中标', color:'bg-emerald-100 text-emerald-700'}, {value:'LOST', label:'未中标', color:'bg-slate-100'}]}
                            ]}
                            onAdd={createAddItem(setBids, bids)} onDelete={createDeleteItem(setBids, bids)}
                        /></PermissionGuard>} />
                        
                        <Route path="/tenders" element={<PermissionGuard perm="EDIT_PROJECT"><DataModuleLayout 
                            title="招标管理" icon="fa-gavel" data={tenders} 
                            fields={[
                                {key: 'title', label: '招标公告标题', type: 'text'}, {key: 'type', label: '类型', type: 'text'},
                                {key: 'budget', label: '控制价', type: 'number'}, {key: 'deadline', label: '截标日期', type: 'date'},
                                {key: 'status', label: '状态', type: 'status', options: [{value:'OPEN', label:'招标中', color:'bg-blue-100 text-blue-700'}, {value:'EVALUATING', label:'评标中', color:'bg-orange-100 text-orange-700'}, {value:'CLOSED', label:'已结束', color:'bg-slate-100'}]}
                            ]}
                            onAdd={createAddItem(setTenders, tenders)} onDelete={createDeleteItem(setTenders, tenders)}
                        /></PermissionGuard>} />

                         <Route path="/subcontractors" element={<PermissionGuard perm="EDIT_PROJECT"><DataModuleLayout 
                            title="分包管理" icon="fa-handshake" data={subcontractors} 
                            fields={[
                                {key: 'name', label: '单位名称', type: 'text'}, {key: 'category', label: '资质类型', type: 'text'},
                                {key: 'contactPerson', label: '联系人', type: 'text'}, {key: 'phone', label: '联系电话', type: 'text'},
                                {key: 'rating', label: '评级 (1-5)', type: 'number', width: '100px'}
                            ]}
                            onAdd={createAddItem(setSubcontractors, subcontractors)} onDelete={createDeleteItem(setSubcontractors, subcontractors)}
                        /></PermissionGuard>} />

                        <Route path="/labor" element={<PermissionGuard perm="MANAGE_HR"><DataModuleLayout 
                            title="劳务实名制管理" icon="fa-helmet-safety" data={laborers} 
                            fields={[
                                {key: 'name', label: '姓名', type: 'text'}, {key: 'role', label: '工种', type: 'text'},
                                {key: 'idCard', label: '身份证后4位', type: 'text'}, {key: 'phone', label: '手机号', type: 'text'},
                                {key: 'status', label: '状态', type: 'status', options: [{value:'ACTIVE', label:'在场', color:'bg-green-100 text-green-700'}, {value:'LEAVE', label:'离场', color:'bg-slate-100'}]}
                            ]}
                            onAdd={createAddItem(setLaborers, laborers)} onDelete={createDeleteItem(setLaborers, laborers)}
                        /></PermissionGuard>} />

                        <Route path="/leasing" element={<PermissionGuard perm="MANAGE_ASSETS"><DataModuleLayout 
                            title="租赁管理" icon="fa-file-invoice" data={leases} 
                            fields={[
                                {key: 'itemName', label: '租赁物名称', type: 'text'}, {key: 'supplier', label: '租赁商', type: 'text'},
                                {key: 'dailyRate', label: '日租金', type: 'number'}, {key: 'totalCost', label: '总费用', type: 'number'},
                                {key: 'status', label: '状态', type: 'status', options: [{value:'ACTIVE', label:'租赁中', color:'bg-blue-100'}, {value:'FINISHED', label:'已结清', color:'bg-slate-100'}]}
                            ]}
                            onAdd={createAddItem(setLeases, leases)} onDelete={createDeleteItem(setLeases, leases)}
                        /></PermissionGuard>} />
                        
                        <Route path="/contracts" element={<PermissionGuard perm="MANAGE_FINANCE"><DataModuleLayout 
                            title="支出合同管理" icon="fa-file-contract" data={expenseContracts} 
                            fields={[
                                {key: 'title', label: '合同名称', type: 'text'}, {key: 'supplierName', label: '对方单位', type: 'text'},
                                {key: 'amount', label: '合同金额', type: 'number'}, {key: 'signDate', label: '签署日期', type: 'date'},
                                {key: 'status', label: '状态', type: 'status', options: [{value:'SIGNED', label:'已签署', color:'bg-blue-100'}, {value:'EXECUTING', label:'履行中', color:'bg-green-100'}, {value:'FINISHED', label:'已完结', color:'bg-slate-100'}]}
                            ]}
                            onAdd={createAddItem(setExpenseContracts, expenseContracts)} onDelete={createDeleteItem(setExpenseContracts, expenseContracts)}
                        /></PermissionGuard>} />

                        <Route path="/contracts-in" element={<PermissionGuard perm="MANAGE_FINANCE"><DataModuleLayout 
                            title="收入合同管理" icon="fa-file-signature" data={incomeContracts} 
                            fields={[
                                {key: 'title', label: '合同名称', type: 'text'}, {key: 'supplierName', label: '甲方单位', type: 'text'},
                                {key: 'amount', label: '合同金额', type: 'number'}, {key: 'signDate', label: '签署日期', type: 'date'},
                                {key: 'status', label: '状态', type: 'status', options: [{value:'SIGNED', label:'已签署', color:'bg-blue-100'}, {value:'EXECUTING', label:'履行中', color:'bg-green-100'}, {value:'FINISHED', label:'已完结', color:'bg-slate-100'}]}
                            ]}
                            onAdd={createAddItem(setIncomeContracts, incomeContracts)} onDelete={createDeleteItem(setIncomeContracts, incomeContracts)}
                        /></PermissionGuard>} />

                         <Route path="/budget" element={<PermissionGuard perm="MANAGE_FINANCE"><DataModuleLayout 
                            title="预算管理" icon="fa-calculator" data={budgets} 
                            fields={[
                                {key: 'name', label: '预算计划名称', type: 'text'}, {key: 'department', label: '归口部门', type: 'text'},
                                {key: 'totalAmount', label: '预算总额', type: 'number'}, {key: 'usedAmount', label: '已执行', type: 'number'},
                                {key: 'status', label: '审批状态', type: 'status', options: [{value:'APPROVED', label:'已批复', color:'bg-green-100 text-green-700'}, {value:'DRAFT', label:'草稿', color:'bg-slate-100'}]}
                            ]}
                            onAdd={createAddItem(setBudgets, budgets)} onDelete={createDeleteItem(setBudgets, budgets)}
                        /></PermissionGuard>} />

                        <Route path="/quality" element={<PermissionGuard perm="MANAGE_SAFETY"><DataModuleLayout 
                            title="质量管理记录" icon="fa-award" data={inspections.filter((i:any) => i.type === 'QUALITY')} 
                            fields={[
                                {key: 'projectName', label: '所属项目', type: 'text'}, {key: 'issue', label: '质量问题描述', type: 'text'},
                                {key: 'inspector', label: '检查人', type: 'text'}, {key: 'checkDate', label: '检查日期', type: 'date'},
                                {key: 'level', label: '严重等级', type: 'status', options: [{value:'NORMAL', label:'一般', color:'bg-blue-100'}, {value:'SERIOUS', label:'严重', color:'bg-orange-100'}, {value:'CRITICAL', label:'重大', color:'bg-red-100'}]}
                            ]}
                            onAdd={(item) => setInspections([...inspections, {...item, type: 'QUALITY', status: 'PENDING'}])} 
                            onDelete={createDeleteItem(setInspections, inspections)}
                        /></PermissionGuard>} />

                        <Route path="/safety" element={<PermissionGuard perm="MANAGE_SAFETY"><DataModuleLayout 
                            title="安全巡检记录" icon="fa-shield-halved" data={inspections.filter((i:any) => i.type === 'SAFETY')} 
                            fields={[
                                {key: 'projectName', label: '所属项目', type: 'text'}, {key: 'issue', label: '隐患描述', type: 'text'},
                                {key: 'inspector', label: '检查人', type: 'text'}, {key: 'checkDate', label: '检查日期', type: 'date'},
                                {key: 'level', label: '隐患等级', type: 'status', options: [{value:'NORMAL', label:'一般', color:'bg-blue-100'}, {value:'SERIOUS', label:'较大', color:'bg-orange-100'}, {value:'CRITICAL', label:'重大', color:'bg-red-100'}]}
                            ]}
                            onAdd={(item) => setInspections([...inspections, {...item, type: 'SAFETY', status: 'PENDING'}])} 
                            onDelete={createDeleteItem(setInspections, inspections)}
                        /></PermissionGuard>} />

                        <Route path="/attendance" element={<PermissionGuard perm="MANAGE_HR"><DataModuleLayout 
                            title="考勤打卡日志" icon="fa-fingerprint" data={attendanceLogs} 
                            fields={[
                                {key: 'name', label: '姓名', type: 'text'}, {key: 'date', label: '日期', type: 'date'},
                                {key: 'time', label: '时间', type: 'text'}, {key: 'location', label: '打卡地点', type: 'text'},
                                {key: 'status', label: '考勤状态', type: 'status', options: [{value:'NORMAL', label:'正常', color:'bg-green-100'}, {value:'LATE', label:'迟到', color:'bg-red-100'}]}
                            ]}
                            onAdd={createAddItem(setAttendanceLogs, attendanceLogs)} onDelete={createDeleteItem(setAttendanceLogs, attendanceLogs)}
                        /></PermissionGuard>} />

                         {/* Special Approvals Page */}
                        <Route path="/approvals" element={<PermissionGuard perm="APPROVE_PROJECT"><DataModuleLayout 
                            title="项目立项审批" icon="fa-stamp" 
                            data={projects.filter(p => p.status === ProjectStatus.PENDING || p.status === ProjectStatus.REVIEWING)} 
                            fields={[
                                {key: 'title', label: '申请项目名称', type: 'text'}, {key: 'applicantName', label: '申请单位', type: 'text'},
                                {key: 'budget', label: '申请预算', type: 'number'}, {key: 'createdAt', label: '申请时间', type: 'date'},
                                {key: 'priority', label: '优先级', type: 'status', options: [{value:'NORMAL', label:'普通', color:'bg-blue-100'}, {value:'EMERGENCY', label:'紧急', color:'bg-red-100'}]}
                            ]}
                            onAdd={() => navigate('/create')}
                            onDelete={(id) => { updateProject(id, {status: ProjectStatus.REJECTED}); }}
                            customAction={(item) => (
                                <button onClick={() => updateProject(item.id, {status: ProjectStatus.APPROVED})} className="text-emerald-600 hover:text-emerald-800 p-2 hover:bg-emerald-50 rounded transition font-bold text-xs">
                                    <i className="fa-solid fa-check mr-1"></i> 通过
                                </button>
                            )}
                        /></PermissionGuard>} />

                        {/* Allow Citizens to Create! */}
                        <Route path="/create" element={<ProjectForm onSubmit={(data) => {
                             const newProject = { 
                                 ...data, 
                                 id: `P${Date.now()}`, 
                                 createdAt: new Date().toISOString(), 
                                 status: ProjectStatus.PENDING, 
                                 progress: 0, 
                                 notes: [], spent: 0, milestones: [], costs: [], contracts: [], safetyRecords: [], documents: [], testRecords: [] 
                             };
                             addProject(newProject);
                             navigate('/projects');
                        }} onCancel={() => navigate('/')} />} />

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const App = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    
    // Generic states
    const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);
    const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
    const [bids, setBids] = useState<Bid[]>(MOCK_BIDS);
    const [tenders, setTenders] = useState<Tender[]>(MOCK_TENDERS);
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(MOCK_SUBCONTRACTORS);
    const [laborers, setLaborers] = useState<Laborer[]>(MOCK_LABORERS);
    const [leases, setLeases] = useState<Lease[]>(MOCK_LEASES);
    const [budgets, setBudgets] = useState<BudgetPlan[]>(MOCK_BUDGETS);
    const [inspections, setInspections] = useState<InspectionRecord[]>(MOCK_INSPECTIONS);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(MOCK_ATTENDANCE_LOGS);
    const [expenseContracts, setExpenseContracts] = useState<Contract[]>([]);
    const [incomeContracts, setIncomeContracts] = useState<Contract[]>([]);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
    const [notifications, setNotifications] = useState<string[]>([]);
  
    // Implement methods
    const login = (user: User) => setCurrentUser(user);
    const logout = () => setCurrentUser(null);
    const checkPermission = (perm: Permission) => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.ADMIN) return true;
        return currentUser.permissions.includes(perm);
    };
  
    const addProject = (p: Project) => {
        setProjects([p, ...projects]);
        addNotification(`新项目 "${p.title}" 已创建`);
    };
  
    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
        addNotification(`项目 ${id} 已更新`);
    };
  
    const addUser = (u: User) => setUsers([...users, u]);
    const updateUser = (id: string, updates: Partial<User>) => setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
    const deleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));
  
    const addNotification = (msg: string) => {
        setNotifications(prev => [msg, ...prev]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n !== msg)), 5000);
    };
  
    const logAccess = (projectId: string, action: string = 'VIEW') => {
        if (!currentUser) return;
        const log: AccessLog = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            projectId,
            timestamp: new Date().toISOString(),
            action
        };
        setAccessLogs([log, ...accessLogs]);
    };
  
    const clockIn = () => {
        if (!currentUser) return;
        const today = new Date().toISOString().split('T')[0];
        const record: AttendanceRecord = {
            id: Date.now().toString(),
            userId: currentUser.id,
            name: currentUser.name,
            date: today,
            checkInTime: new Date().toLocaleTimeString(),
            status: 'NORMAL'
        };
        setAttendanceRecords([record, ...attendanceRecords]);
        addNotification('打卡成功');
    };
  
    const clockOut = () => {
         addNotification('下班打卡成功');
    };
    
    const todayAttendance = currentUser ? attendanceRecords.find(r => r.userId === currentUser.id && r.date === new Date().toISOString().split('T')[0]) : undefined;
  
    const addTestRecord = (projectId: string, record: TestRecord) => {
        const p = projects.find(proj => proj.id === projectId);
        if (p) {
            const updatedP = { ...p, testRecords: [...p.testRecords, record] };
            updateProject(projectId, updatedP);
        }
    };
  
  
    const contextValue: AppContextType = {
        currentUser, login, logout, checkPermission,
        projects, addProject, updateProject,
        users, addUser, updateUser, deleteUser,
        materials, setMaterials,
        vehicles, setVehicles,
        bids, setBids,
        tenders, setTenders,
        subcontractors, setSubcontractors,
        laborers, setLaborers,
        leases, setLeases,
        expenseContracts, setExpenseContracts,
        incomeContracts, setIncomeContracts,
        budgets, setBudgets,
        inspections, setInspections,
        attendanceLogs, setAttendanceLogs,
        notifications, addNotification,
        accessLogs, logAccess,
        attendanceRecords, clockIn, clockOut, todayAttendance,
        addTestRecord
    };
  
    return (
        <AppContext.Provider value={contextValue}>
            <Router>
                <AppContent />
            </Router>
        </AppContext.Provider>
    );
  };
  
export default App;