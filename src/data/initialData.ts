import type {
  Route,
  Stop,
  Vehicle,
  Driver,
  Schedule,
  Student,
  Teacher,
  GradeRouteRule,
  TempStopRule,
  EscortRule,
  Detour,
  Outage,
  StopClosure,
  WeatherDelay,
  ParentAuth,
  LeaveRecord,
  SwipeRecord,
  HistoryRecord,
  TeacherRollCall,
  StopCapacity,
  DriverSchedule,
  TempArrangement,
  SwipeAbnormalRecord,
} from "@/types";
import { todayStr, uid, addDays } from "@/lib/utils";

const today = todayStr();
const future30 = new Date();
future30.setDate(future30.getDate() + 30);
const future30Str = future30.toISOString().slice(0, 10);
const past30 = new Date();
past30.setDate(past30.getDate() - 30);
const past30Str = past30.toISOString().slice(0, 10);
const future7 = new Date();
future7.setDate(future7.getDate() + 7);
const future7Str = future7.toISOString().slice(0, 10);
const past7 = new Date();
past7.setDate(past7.getDate() - 7);
const past7Str = past7.toISOString().slice(0, 10);
const future180 = new Date();
future180.setDate(future180.getDate() + 180);
const future180Str = future180.toISOString().slice(0, 10);

export const initialStops: Stop[] = [
  { id: "S001", name: "南门主站", location: "学校正南门", capacity: 80, isClosed: false },
  { id: "S002", name: "图书馆站", location: "图书馆东侧", capacity: 40, isClosed: false },
  { id: "S003", name: "教学楼A站", location: "教学楼A栋门口", capacity: 50, isClosed: false },
  { id: "S004", name: "体育馆站", location: "体育馆北门", capacity: 60, isClosed: true, closedReason: "施工围挡", alternativeStopId: "S005" },
  { id: "S005", name: "实验楼站", location: "实验楼西侧", capacity: 45, isClosed: false },
  { id: "S006", name: "学生公寓站", location: "学生公寓1号楼", capacity: 70, isClosed: false },
  { id: "S007", name: "东门站", location: "学校东门", capacity: 55, isClosed: false },
  { id: "S008", name: "西门站", location: "学校西门", capacity: 35, isClosed: false },
  { id: "S009", name: "食堂站", location: "第一食堂门口", capacity: 50, isClosed: false },
  { id: "S010", name: "行政楼站", location: "行政楼南门", capacity: 30, isClosed: false },
];

export const initialRoutes: Route[] = [
  {
    id: "R001",
    name: "1号环线",
    code: "校巴1路",
    colorIndex: 1,
    direction: "up",
    isActive: true,
    description: "环绕教学区与生活区的主干线路",
    stops: [
      { stopId: "S001", order: 1, estimatedMinutes: 0 },
      { stopId: "S002", order: 2, estimatedMinutes: 4 },
      { stopId: "S003", order: 3, estimatedMinutes: 3 },
      { stopId: "S005", order: 4, estimatedMinutes: 5 },
      { stopId: "S006", order: 5, estimatedMinutes: 4 },
      { stopId: "S009", order: 6, estimatedMinutes: 3 },
      { stopId: "S001", order: 7, estimatedMinutes: 6 },
    ],
  },
  {
    id: "R002",
    name: "2号东门线",
    code: "校巴2路",
    colorIndex: 2,
    direction: "up",
    isActive: true,
    description: "连接东门与教学区的专用线路",
    stops: [
      { stopId: "S007", order: 1, estimatedMinutes: 0 },
      { stopId: "S003", order: 2, estimatedMinutes: 6 },
      { stopId: "S010", order: 3, estimatedMinutes: 4 },
      { stopId: "S002", order: 4, estimatedMinutes: 3 },
      { stopId: "S001", order: 5, estimatedMinutes: 5 },
    ],
  },
  {
    id: "R003",
    name: "3号低年级专线",
    code: "校巴3路",
    colorIndex: 3,
    direction: "up",
    isActive: true,
    description: "低年级学生指定线路，经过公寓和教学区",
    stops: [
      { stopId: "S006", order: 1, estimatedMinutes: 0 },
      { stopId: "S009", order: 2, estimatedMinutes: 4 },
      { stopId: "S003", order: 3, estimatedMinutes: 5 },
      { stopId: "S010", order: 4, estimatedMinutes: 3 },
    ],
  },
  {
    id: "R004",
    name: "4号西门线",
    code: "校巴4路",
    colorIndex: 4,
    direction: "down",
    isActive: true,
    description: "连接西门与宿舍区的线路",
    stops: [
      { stopId: "S008", order: 1, estimatedMinutes: 0 },
      { stopId: "S005", order: 2, estimatedMinutes: 5 },
      { stopId: "S006", order: 3, estimatedMinutes: 4 },
      { stopId: "S001", order: 4, estimatedMinutes: 7 },
    ],
  },
];

export const initialVehicles: Vehicle[] = [
  {
    id: "V001",
    plateNumber: "京A·12345",
    model: "宇通ZK6858",
    capacity: 45,
    currentLoad: 18,
    status: "normal",
    inspectionExpiryDate: future180Str,
    routeId: "R001",
  },
  {
    id: "V002",
    plateNumber: "京A·23456",
    model: "宇通ZK6858",
    capacity: 45,
    currentLoad: 45,
    status: "full",
    inspectionExpiryDate: future180Str,
    routeId: "R001",
  },
  {
    id: "V003",
    plateNumber: "京A·34567",
    model: "金龙XMQ6802",
    capacity: 38,
    currentLoad: 12,
    status: "fault",
    faultReason: "发动机故障，等待维修",
    inspectionExpiryDate: future180Str,
    routeId: "R002",
    replacementVehicleId: "V007",
  },
  {
    id: "V004",
    plateNumber: "京A·45678",
    model: "金龙XMQ6802",
    capacity: 38,
    currentLoad: 25,
    status: "normal",
    inspectionExpiryDate: future180Str,
    routeId: "R003",
  },
  {
    id: "V005",
    plateNumber: "京A·56789",
    model: "海格KLQ6796",
    capacity: 35,
    currentLoad: 20,
    status: "normal",
    inspectionExpiryDate: future7Str,
    routeId: "R004",
  },
  {
    id: "V006",
    plateNumber: "京A·67890",
    model: "宇通ZK6858",
    capacity: 45,
    currentLoad: 0,
    status: "normal",
    inspectionExpiryDate: future180Str,
  },
  {
    id: "V007",
    plateNumber: "京A·78901",
    model: "宇通ZK6792",
    capacity: 32,
    currentLoad: 12,
    status: "replacement",
    inspectionExpiryDate: future180Str,
    routeId: "R002",
  },
  {
    id: "V008",
    plateNumber: "京A·89012",
    model: "海格KLQ6796",
    capacity: 35,
    currentLoad: 0,
    status: "inspection_expired",
    inspectionExpiryDate: past7Str,
  },
];

export const initialDrivers: Driver[] = [
  { id: "D001", name: "张建国", employeeNo: "DRV001", phone: "13800138001", licenseExpiryDate: future180Str, status: "on_duty" },
  { id: "D002", name: "李援朝", employeeNo: "DRV002", phone: "13800138002", licenseExpiryDate: future180Str, status: "on_duty" },
  { id: "D003", name: "王卫东", employeeNo: "DRV003", phone: "13800138003", licenseExpiryDate: future7Str, status: "on_duty" },
  { id: "D004", name: "刘卫红", employeeNo: "DRV004", phone: "13800138004", licenseExpiryDate: future180Str, status: "on_duty" },
  { id: "D005", name: "陈抗美", employeeNo: "DRV005", phone: "13800138005", licenseExpiryDate: past7Str, status: "leave" },
  { id: "D006", name: "赵向军", employeeNo: "DRV006", phone: "13800138006", licenseExpiryDate: future180Str, status: "off_duty" },
];

export const initialSchedules: Schedule[] = [
  {
    id: "SCH001",
    routeId: "R001",
    vehicleId: "V001",
    driverId: "D001",
    departureTime: "07:30",
    isActive: true,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
  },
  {
    id: "SCH002",
    routeId: "R001",
    vehicleId: "V002",
    driverId: "D002",
    departureTime: "07:45",
    isActive: true,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
  },
  {
    id: "SCH003",
    routeId: "R002",
    vehicleId: "V007",
    driverId: "D003",
    departureTime: "07:35",
    isActive: true,
    note: "V003故障，由V007替换",
    dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
  },
  {
    id: "SCH004",
    routeId: "R003",
    vehicleId: "V004",
    driverId: "D004",
    departureTime: "07:20",
    isActive: true,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
  },
  {
    id: "SCH005",
    routeId: "R004",
    vehicleId: "V005",
    driverId: "D001",
    departureTime: "07:40",
    isActive: true,
    dayOfWeek: [1, 2, 3, 4, 5, 6, 0],
  },
  {
    id: "SCH006",
    routeId: "R001",
    vehicleId: "V001",
    driverId: "D001",
    departureTime: "16:30",
    isActive: true,
    dayOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "SCH007",
    routeId: "R003",
    vehicleId: "V004",
    driverId: "D004",
    departureTime: "16:20",
    isActive: true,
    dayOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "SCH008",
    routeId: "R002",
    vehicleId: "V007",
    driverId: "D003",
    departureTime: "16:40",
    isActive: true,
    dayOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "SCH009",
    routeId: "R001",
    vehicleId: "V006",
    driverId: "D002",
    departureTime: "09:00",
    isActive: true,
    note: "周末加开班次",
    dayOfWeek: [6, 0],
  },
  {
    id: "SCH010",
    routeId: "R004",
    vehicleId: "V006",
    driverId: "D004",
    departureTime: "09:15",
    isActive: true,
    note: "周末加开班次",
    dayOfWeek: [6, 0],
  },
];

export const initialStudents: Student[] = [
  { id: "ST001", name: "小明", studentNo: "20240101", grade: 1, className: "一(1)班", stopId: "S006", identity: "day_student", parentAuthorized: true, cardNumber: "CARD001" },
  { id: "ST002", name: "小红", studentNo: "20240102", grade: 2, className: "二(3)班", stopId: "S006", identity: "day_student", parentAuthorized: true, cardNumber: "CARD002" },
  { id: "ST003", name: "小刚", studentNo: "20230203", grade: 3, className: "三(2)班", stopId: "S007", identity: "day_student", parentAuthorized: true, cardNumber: "CARD003" },
  { id: "ST004", name: "小丽", studentNo: "20220304", grade: 4, className: "四(1)班", stopId: "S001", identity: "day_student", parentAuthorized: true, cardNumber: "CARD004" },
  { id: "ST005", name: "小强", studentNo: "20210405", grade: 5, className: "五(2)班", stopId: "S002", identity: "boarder", parentAuthorized: true, cardNumber: "CARD005" },
  { id: "ST006", name: "小芳", studentNo: "20200506", grade: 6, className: "六(1)班", stopId: "S008", identity: "day_student", parentAuthorized: false, cardNumber: "CARD006" },
  { id: "ST007", name: "小宇", studentNo: "20240107", grade: 1, className: "一(2)班", stopId: "S004", identity: "day_student", parentAuthorized: true, cardNumber: "CARD007" },
];

export const initialTeachers: Teacher[] = [
  { id: "T001", name: "王老师", teacherNo: "TCH001", grades: [1, 2, 3], phone: "13900139001" },
  { id: "T002", name: "李老师", teacherNo: "TCH002", grades: [4, 5, 6], phone: "13900139002" },
];

export const initialGradeRouteRules: GradeRouteRule[] = [
  { id: "GRR001", teacherId: "T001", grade: 1, allowedRouteIds: ["R003"], effectiveDate: past30Str, note: "一年级仅可乘坐3号低年级专线" },
  { id: "GRR002", teacherId: "T001", grade: 2, allowedRouteIds: ["R003", "R001"], effectiveDate: past30Str, note: "二年级可乘坐3号专线和1号环线" },
  { id: "GRR003", teacherId: "T001", grade: 3, allowedRouteIds: ["R001", "R002", "R003"], effectiveDate: past30Str },
];

export const initialTempStopRules: TempStopRule[] = [
  { id: "TSR001", teacherId: "T001", scheduleId: "SCH004", stopId: "S009", duration: 3, reason: "低年级学生加餐停靠", effectiveDate: today, endDate: future7Str },
];

export const initialEscortRules: EscortRule[] = [
  { id: "ER001", teacherId: "T001", grade: 1, requireEscort: true, escortStopIds: ["S006", "S003"], note: "一年级下车需老师护送" },
  { id: "ER002", teacherId: "T001", grade: 2, requireEscort: true, escortStopIds: ["S006"], note: "二年级公寓站下车需护送" },
];

export const initialDetours: Detour[] = [
  {
    id: "DET001",
    routeId: "R001",
    skippedStopIds: ["S004"],
    alternativeStopIds: ["S005"],
    startDate: past7Str,
    endDate: future30Str,
    reason: "体育馆站施工围挡，改经实验楼站绕行",
    addedMinutes: 4,
    isActive: true,
  },
];

export const initialOutages: Outage[] = [
  {
    id: "OUT001",
    vehicleId: "V003",
    startDate: past7Str,
    endDate: future7Str,
    reason: "V003发动机故障停运，已由V007替换",
    isActive: true,
  },
];

export const initialStopClosures: StopClosure[] = [
  {
    id: "SC001",
    stopId: "S004",
    startDate: past7Str,
    endDate: future30Str,
    reason: "施工围挡，请前往实验楼站(S005)乘车",
    alternativeStopId: "S005",
    isActive: true,
  },
];

export const initialWeatherDelays: WeatherDelay[] = [
  {
    id: "WD001",
    delayMinutes: 8,
    reason: "今日早高峰降雨，路面湿滑，全线预计延误5-10分钟",
    effectiveDate: today,
    weatherType: "rain",
    severity: "moderate",
    isActive: true,
  },
];

export const initialParentAuths: ParentAuth[] = [
  { id: "PA001", studentId: "ST001", routeIds: ["R003"], authorizedAt: past30Str, expiresAt: future30Str, parentName: "明父", parentPhone: "13700137001" },
  { id: "PA002", studentId: "ST002", routeIds: ["R003", "R001"], authorizedAt: past30Str, expiresAt: future30Str, parentName: "红母", parentPhone: "13700137002" },
  { id: "PA003", studentId: "ST003", routeIds: ["R001", "R002", "R003"], authorizedAt: past30Str, expiresAt: future30Str, parentName: "刚父", parentPhone: "13700137003" },
  { id: "PA004", studentId: "ST004", routeIds: ["R001", "R002", "R003", "R004"], authorizedAt: past30Str, expiresAt: future30Str, parentName: "丽母", parentPhone: "13700137004" },
  { id: "PA005", studentId: "ST005", routeIds: ["R001", "R002", "R004"], authorizedAt: past30Str, expiresAt: future30Str, parentName: "强父", parentPhone: "13700137005" },
];

export const initialLeaveRecords: LeaveRecord[] = [
  {
    id: "LV001",
    studentId: "ST007",
    startDate: today,
    endDate: future7Str,
    reason: "感冒请假，暂停乘车",
    status: "approved",
    createdAt: past7Str,
  },
];

export const initialSwipeRecords: SwipeRecord[] = [
  { id: "SW001", studentId: "ST001", scheduleId: "SCH004", stopId: "S006", swipeTime: "07:18", type: "board", vehicleId: "V004" },
  { id: "SW002", studentId: "ST002", scheduleId: "SCH004", stopId: "S006", swipeTime: "07:19", type: "board", vehicleId: "V004" },
  { id: "SW003", studentId: "ST004", scheduleId: "SCH001", stopId: "S001", swipeTime: "07:28", type: "board", vehicleId: "V001" },
  { id: "SW004", studentId: "ST005", scheduleId: "SCH002", stopId: "S002", swipeTime: "07:42", type: "board", vehicleId: "V002" },
  {
    id: "SW005",
    studentId: "ST006",
    scheduleId: "SCH005",
    stopId: "S008",
    swipeTime: "07:38",
    type: "board",
    abnormal: true,
    abnormalReason: "家长未授权乘车，请联系班主任",
    vehicleId: "V005",
  },
];

export const initialHistory: HistoryRecord[] = [
  { id: uid("HIS_"), type: "vehicle", entityType: "Vehicle", entityId: "V003", action: "fault", data: { plateNumber: "京A·34567", reason: "发动机故障" }, timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), operator: "校车管理员" },
  { id: uid("HIS_"), type: "vehicle", entityType: "Vehicle", entityId: "V007", action: "replaced", data: { replacedVehicle: "V003", schedule: "SCH003" }, timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), operator: "校车管理员" },
  { id: uid("HIS_"), type: "stop", entityType: "StopClosure", entityId: "SC001", action: "closure", data: { stopId: "S004", alternative: "S005" }, timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), operator: "调度员" },
  { id: uid("HIS_"), type: "route", entityType: "Detour", entityId: "DET001", action: "detour", data: { routeId: "R001", skipped: "S004" }, timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), operator: "调度员" },
  { id: uid("HIS_"), type: "rule", entityType: "GradeRouteRule", entityId: "GRR001", action: "rule_change", data: { grade: 1, allowedRoutes: ["R003"] }, timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), operator: "王老师" },
  { id: uid("HIS_"), type: "weather", entityType: "WeatherDelay", entityId: "WD001", action: "weather_delay", data: { delayMinutes: 8, weatherType: "rain" }, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), operator: "系统自动" },
  { id: uid("HIS_"), type: "swipe", entityType: "SwipeRecord", entityId: "SW005", action: "swipe", data: { studentId: "ST006", abnormal: true, reason: "家长未授权" }, timestamp: new Date(Date.now() - 3600000).toISOString(), operator: "车载刷卡机" },
];

export interface DynamicInitialData {
  gradeRouteRules: GradeRouteRule[];
  tempStopRules: TempStopRule[];
  detours: Detour[];
  outages: Outage[];
  stopClosures: StopClosure[];
  weatherDelays: WeatherDelay[];
  parentAuths: ParentAuth[];
  leaveRecords: LeaveRecord[];
}

export function generateDynamicInitialData(baseDate: string = todayStr()): DynamicInitialData {
  const past30 = addDays(baseDate, -30);
  const past7 = addDays(baseDate, -7);
  const future7 = addDays(baseDate, 7);
  const future30 = addDays(baseDate, 30);

  return {
    gradeRouteRules: [
      { id: "GRR001", grade: 1, allowedRouteIds: ["R003"], requireEscort: true, description: "一年级学生仅限乘坐3号线（南门-公寓专线），必须由家长或老师护送", effectiveDate: past30 },
      { id: "GRR002", grade: 2, allowedRouteIds: ["R001", "R003"], requireEscort: true, description: "二年级学生可乘坐1号线和3号线，必须由家长或老师护送", effectiveDate: past30 },
      { id: "GRR003", grade: 3, allowedRouteIds: ["R001", "R002", "R003"], requireEscort: false, description: "三年级学生可乘坐1、2、3号线，无需护送", effectiveDate: past30 },
      { id: "GRR004", grade: 4, allowedRouteIds: ["R001", "R002", "R003", "R004"], requireEscort: false, description: "四年级及以上学生所有线路均可乘坐", effectiveDate: past30 },
      { id: "GRR005", grade: 5, allowedRouteIds: ["R001", "R002", "R003", "R004"], requireEscort: false, description: "四年级及以上学生所有线路均可乘坐", effectiveDate: past30 },
      { id: "GRR006", grade: 6, allowedRouteIds: ["R001", "R002", "R003", "R004"], requireEscort: false, description: "四年级及以上学生所有线路均可乘坐", effectiveDate: past30 },
    ],
    tempStopRules: [
      { id: "TSR001", stopId: "S003", scheduleId: "SCH002", startTime: "07:35", endTime: "07:40", reason: "新生报到临时停靠", effectiveDate: baseDate, endDate: future7, isActive: true },
      { id: "TSR002", stopId: "S009", scheduleId: "SCH005", startTime: "17:20", endTime: "17:25", reason: "食堂加餐后临时停靠", effectiveDate: baseDate, endDate: future7, isActive: true },
    ],
    detours: [
      { id: "DET001", routeId: "R001", skippedStopIds: ["S004"], alternativeStopIds: ["S005"], addedMinutes: 3, reason: "体育馆施工绕行实验楼站", startDate: past7, endDate: future30, isActive: true },
      { id: "DET002", routeId: "R004", skippedStopIds: ["S010"], alternativeStopIds: ["S009"], addedMinutes: 2, reason: "行政楼前道路临时管制", startDate: past7, endDate: future7, isActive: true },
    ],
    outages: [
      { id: "OUT001", vehicleId: "V003", routeId: "R002", replacementVehicleId: "V007", reason: "发动机故障检修", startDate: past7, endDate: future7, isActive: true },
    ],
    stopClosures: [
      { id: "SC001", stopId: "S004", alternativeStopId: "S005", reason: "施工围挡，体育馆站暂停使用", startDate: past7, endDate: future30, isActive: true, estimatedDurationMinutes: 45 },
      { id: "SC002", stopId: "S010", alternativeStopId: "S009", reason: "行政楼区域临时交通管制", startDate: past7, endDate: future7, isActive: true, estimatedDurationMinutes: 30 },
    ],
    weatherDelays: [
      { id: "WD001", routeId: undefined, delayMinutes: 8, reason: "中雨导致部分路段拥堵，所有线路预计延误5-10分钟", effectiveDate: baseDate, weatherType: "rain", severity: "moderate", isActive: true },
    ],
    parentAuths: [
      { id: "PA001", studentId: "ST001", routeIds: ["R003"], authorizedAt: past30, expiresAt: future30, parentName: "明父", parentPhone: "13700137001" },
      { id: "PA002", studentId: "ST002", routeIds: ["R003", "R001"], authorizedAt: past30, expiresAt: future30, parentName: "红母", parentPhone: "13700137002" },
      { id: "PA003", studentId: "ST003", routeIds: ["R001", "R002", "R003"], authorizedAt: past30, expiresAt: future30, parentName: "刚父", parentPhone: "13700137003" },
      { id: "PA004", studentId: "ST004", routeIds: ["R001", "R002", "R003", "R004"], authorizedAt: past30, expiresAt: future30, parentName: "丽母", parentPhone: "13700137004" },
      { id: "PA005", studentId: "ST005", routeIds: ["R001", "R002", "R004"], authorizedAt: past30, expiresAt: future30, parentName: "强父", parentPhone: "13700137005" },
    ],
    leaveRecords: [
      {
        id: "LV001",
        studentId: "ST007",
        startDate: baseDate,
        endDate: future7,
        reason: "感冒请假，暂停乘车",
        status: "approved",
        createdAt: past7,
      },
    ],
  };
}

export const initialTeacherRollCalls: TeacherRollCall[] = [
  { id: "RC001", teacherId: "T001", scheduleId: "SCH004", stopId: "S006", date: today, studentId: "ST001", status: "present", notes: "已点名，正常乘车", recordedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "RC002", teacherId: "T001", scheduleId: "SCH004", stopId: "S006", date: today, studentId: "ST002", status: "present", notes: "已点名，正常乘车", recordedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "RC003", teacherId: "T001", scheduleId: "SCH004", stopId: "S006", date: today, studentId: "ST003", status: "absent", notes: "家长提前告知今日不乘车", recordedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "RC004", teacherId: "T002", scheduleId: "SCH001", stopId: "S001", date: today, studentId: "ST004", status: "present", recordedAt: new Date(Date.now() - 3000000).toISOString() },
  { id: "RC005", teacherId: "T002", scheduleId: "SCH002", stopId: "S002", date: today, studentId: "ST005", status: "present", recordedAt: new Date(Date.now() - 3000000).toISOString() },
];

export const initialStopCapacities: StopCapacity[] = [
  { id: "CAP001", stopId: "S006", scheduleId: "SCH004", date: today, currentCount: 12, maxCapacity: 20, lastUpdated: new Date(Date.now() - 1800000).toISOString() },
  { id: "CAP002", stopId: "S001", scheduleId: "SCH001", date: today, currentCount: 8, maxCapacity: 15, lastUpdated: new Date(Date.now() - 1800000).toISOString() },
  { id: "CAP003", stopId: "S002", scheduleId: "SCH002", date: today, currentCount: 18, maxCapacity: 25, lastUpdated: new Date(Date.now() - 1800000).toISOString() },
];

export const initialDriverSchedules: DriverSchedule[] = [
  { id: "DS001", driverId: "D001", scheduleId: "SCH001", date: today, status: "on_duty", updatedAt: new Date().toISOString() },
  { id: "DS002", driverId: "D002", scheduleId: "SCH002", date: today, status: "on_duty", updatedAt: new Date().toISOString() },
  { id: "DS003", driverId: "D003", scheduleId: "SCH003", date: today, status: "on_duty", updatedAt: new Date().toISOString() },
  { id: "DS004", driverId: "D004", scheduleId: "SCH004", date: today, status: "on_duty", updatedAt: new Date().toISOString() },
  { id: "DS005", driverId: "D005", scheduleId: "SCH005", date: today, status: "leave", replacementDriverId: "D001", notes: "司机请假，由D001代班", updatedAt: new Date().toISOString() },
  { id: "DS006", driverId: "D001", scheduleId: "SCH005", date: today, status: "on_duty", notes: "代班驾驶", updatedAt: new Date().toISOString() },
];

export const initialTempArrangements: TempArrangement[] = [
  {
    id: "TA001",
    type: "extra_vehicle",
    title: "早高峰加开临时班车",
    description: "因今日学生活动，7:50-8:10加开V006临时班车，途径S006、S001、S002",
    routeId: "R001",
    startDate: today,
    endDate: addDays(today, 1),
    isActive: true,
    createdBy: "调度员",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "TA002",
    type: "priority_student",
    title: "受伤学生优先乘车",
    description: "ST004同学脚部受伤，今日所有线路优先安排座位",
    studentIds: ["ST004"],
    startDate: today,
    endDate: addDays(today, 7),
    isActive: true,
    createdBy: "班主任",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const initialSwipeAbnormalRecords: SwipeAbnormalRecord[] = [
  {
    id: "ABN001",
    studentId: "ST006",
    scheduleId: "SCH005",
    stopId: "S008",
    vehicleId: "V005",
    swipeTime: "07:38",
    abnormalType: "wrong_route",
    description: "家长未授权该线路乘车",
    handled: false,
  },
  {
    id: "ABN002",
    studentId: "ST003",
    scheduleId: "SCH003",
    stopId: "S007",
    vehicleId: "V007",
    swipeTime: "07:32",
    abnormalType: "too_early",
    description: "提前20分钟到站刷卡，提醒注意发车时间",
    handled: true,
    handledBy: "随车老师",
    handledAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "ABN003",
    studentId: "ST005",
    scheduleId: "SCH002",
    stopId: "S002",
    vehicleId: "V002",
    swipeTime: "07:46",
    abnormalType: "capacity_full",
    description: "车辆已满员，已安排后续班次V006",
    handled: true,
    handledBy: "调度员",
    handledAt: new Date(Date.now() - 3000000).toISOString(),
  },
];

