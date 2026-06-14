export type VehicleStatus =
  | "normal"
  | "full"
  | "fault"
  | "inspection_expired"
  | "replacement";

export type StudentIdentity = "day_student" | "boarder";

export type SwipeType = "board" | "alight";

export type HistoryAction =
  | "create"
  | "update"
  | "delete"
  | "fault"
  | "replaced"
  | "outage"
  | "detour"
  | "closure"
  | "full"
  | "weather_delay"
  | "swipe"
  | "swipe_abnormal"
  | "leave"
  | "authorize"
  | "rule_change"
  | "driver_status"
  | "abnormal"
  | "derivation_snapshot";

export interface RouteStop {
  stopId: string;
  order: number;
  estimatedMinutes: number;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  colorIndex: 1 | 2 | 3 | 4;
  direction: "up" | "down";
  stops: RouteStop[];
  isActive: boolean;
  description: string;
}

export interface Stop {
  id: string;
  name: string;
  location: string;
  capacity: number;
  isClosed: boolean;
  latitude?: number;
  longitude?: number;
  closedReason?: string;
  alternativeStopId?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  capacity: number;
  currentLoad: number;
  status: VehicleStatus;
  replacementVehicleId?: string;
  inspectionExpiryDate: string;
  model: string;
  routeId?: string;
  faultReason?: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseExpiryDate: string;
  phone: string;
  employeeNo: string;
  status: "on_duty" | "off_duty" | "leave";
}

export interface Schedule {
  id: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  departureTime: string;
  isActive: boolean;
  note?: string;
  dayOfWeek: number[];
}

export interface Student {
  id: string;
  name: string;
  studentNo: string;
  grade: number;
  className: string;
  stopId: string;
  identity: StudentIdentity;
  parentAuthorized: boolean;
  cardNumber: string;
  avatar?: string;
}

export interface ParentAuth {
  id: string;
  studentId: string;
  routeIds: string[];
  authorizedAt: string;
  expiresAt: string;
  parentName: string;
  parentPhone: string;
}

export interface LeaveRecord {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface SwipeRecord {
  id: string;
  studentId: string;
  scheduleId: string;
  stopId: string;
  swipeTime: string;
  type: SwipeType;
  abnormal?: boolean;
  abnormalReason?: string;
  vehicleId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  teacherNo: string;
  grades: number[];
  phone: string;
}

export interface GradeRouteRule {
  id: string;
  teacherId: string;
  grade: number;
  allowedRouteIds: string[];
  effectiveDate: string;
  note?: string;
}

export interface TempStopRule {
  id: string;
  teacherId: string;
  scheduleId: string;
  stopId: string;
  duration: number;
  reason: string;
  effectiveDate: string;
  endDate?: string;
}

export interface EscortRule {
  id: string;
  teacherId: string;
  grade: number;
  requireEscort: boolean;
  escortStopIds: string[];
  note?: string;
}

export interface Detour {
  id: string;
  routeId: string;
  skippedStopIds: string[];
  alternativeStopIds: string[];
  startDate: string;
  endDate: string;
  reason: string;
  addedMinutes: number;
  isActive: boolean;
}

export interface Outage {
  id: string;
  routeId?: string;
  vehicleId?: string;
  scheduleId?: string;
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
}

export interface StopClosure {
  id: string;
  stopId: string;
  startDate: string;
  endDate: string;
  reason: string;
  alternativeStopId?: string;
  isActive: boolean;
}

export interface WeatherDelay {
  id: string;
  routeId?: string;
  delayMinutes: number;
  reason: string;
  effectiveDate: string;
  weatherType: "rain" | "snow" | "fog" | "storm" | "heat";
  severity: "light" | "moderate" | "severe";
  isActive: boolean;
}

export interface HistoryRecord {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  action: HistoryAction;
  data: Record<string, unknown>;
  timestamp: string;
  operator: string;
}

export interface RuleStep {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  reason?: string;
  data?: Record<string, unknown>;
}

export interface AvailableRoute {
  routeId: string;
  routeName: string;
  routeCode: string;
  colorIndex: 1 | 2 | 3 | 4;
  scheduleId: string;
  departureTime: string;
  estimatedArrival: string;
  originalArrival: string;
  delayMinutes: number;
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
  driverStatus?: DriverScheduleStatus;
  availableSeats: number;
  isBoardable: boolean;
  boarded?: boolean;
  blockReasons: string[];
  requiresEscort: boolean;
  isTempStop: boolean;
  transferHint?: string;
  stopCurrentCount?: number;
  stopMaxCapacity?: number;
  rollCallStatus?: RollCallStatus;
  hasAbnormalSwipe?: boolean;
  abnormalReason?: string;
  tempArrangement?: TempArrangement;
  boardingHints?: BoardingHint[];
  invisibilityReasons?: RouteInvisibilityReason[];
}

export interface DerivationResult {
  studentId: string;
  studentName: string;
  availableRoutes: AvailableRoute[];
  blockedRoutes: AvailableRoute[];
  steps: RuleStep[];
  generatedAt: string;
  systemState: {
    weatherDelays: number;
    activeDetours: number;
    activeOutages: number;
    stopClosures: number;
    vehicleFaults: number;
    driverLeaves: number;
    tempArrangements: number;
  };
  transferHints: string[];
}

export type RollCallStatus = "present" | "absent" | "leave" | "unknown";

export type DriverScheduleStatus = "scheduled" | "on_duty" | "off_duty" | "leave" | "replaced";

export type SwipeAbnormalType =
  | "no_card"
  | "card_expired"
  | "wrong_route"
  | "too_early"
  | "too_late"
  | "already_boarded"
  | "capacity_full"
  | "stop_closed";

export type TempArrangementType =
  | "extra_vehicle"
  | "temporary_route"
  | "special_dismissal"
  | "capacity_increase"
  | "priority_student";

export interface TeacherRollCall {
  id: string;
  teacherId: string;
  scheduleId: string;
  stopId: string;
  date: string;
  studentId: string;
  status: RollCallStatus;
  notes?: string;
  recordedAt: string;
}

export interface StopCapacity {
  id: string;
  stopId: string;
  scheduleId: string;
  date: string;
  currentCount: number;
  maxCapacity: number;
  lastUpdated: string;
}

export interface DriverSchedule {
  id: string;
  driverId: string;
  scheduleId: string;
  date: string;
  status: DriverScheduleStatus;
  replacementDriverId?: string;
  notes?: string;
  updatedAt: string;
}

export interface TempArrangement {
  id: string;
  type: TempArrangementType;
  title: string;
  description: string;
  routeId?: string;
  stopId?: string;
  scheduleId?: string;
  studentIds?: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SwipeAbnormalRecord {
  id: string;
  studentId: string;
  scheduleId: string;
  stopId: string;
  vehicleId: string;
  swipeTime: string;
  abnormalType: SwipeAbnormalType;
  description: string;
  handled: boolean;
  handledBy?: string;
  handledAt?: string;
}

export interface BoardingHint {
  id: string;
  studentId: string;
  scheduleId: string;
  routeId: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  details?: string;
  timestamp: string;
}

export interface RouteInvisibilityReason {
  routeId: string;
  routeName: string;
  routeCode: string;
  blockReason: string;
  blockStep: string;
  blockData?: Record<string, unknown>;
  suggestion?: string;
}

export interface HistoryDerivationSnapshot {
  id: string;
  studentId: string;
  timestamp: string;
  availableRoutes: { routeId: string; routeName: string; routeCode: string; estimatedArrival: string }[];
  blockedRoutes: { routeId: string; routeName: string; routeCode: string; blockReason: string }[];
  steps: RuleStep[];
  systemState: Record<string, unknown>;
}

export interface StopArrival {
  stopId: string;
  stopName: string;
  routeId: string;
  routeName: string;
  routeCode: string;
  colorIndex: 1 | 2 | 3 | 4;
  scheduleId: string;
  estimatedArrival: string;
  originalArrival: string;
  delayMinutes: number;
  vehiclePlate: string;
  availableSeats: number;
  isShowing: boolean;
  hideReason?: string;
  isClosed: boolean;
  closureHint?: string;
  isTempStop?: boolean;
  driverStatus?: DriverScheduleStatus;
  stopCurrentCount?: number;
  stopMaxCapacity?: number;
  rollCallPresent?: number;
  rollCallAbsent?: number;
  transferHint?: string;
  boardingHints?: BoardingHint[];
}
