import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  VehicleStatus,
  TeacherRollCall,
  StopCapacity,
  DriverSchedule,
  TempArrangement,
  SwipeAbnormalRecord,
  BoardingHint,
  HistoryDerivationSnapshot,
  RollCallStatus,
  DriverScheduleStatus,
  SwipeAbnormalType,
  TempArrangementType,
} from "@/types";
import {
  initialRoutes,
  initialStops,
  initialVehicles,
  initialDrivers,
  initialSchedules,
  initialStudents,
  initialTeachers,
  initialGradeRouteRules,
  initialTempStopRules,
  initialEscortRules,
  initialDetours,
  initialOutages,
  initialStopClosures,
  initialWeatherDelays,
  initialParentAuths,
  initialLeaveRecords,
  initialSwipeRecords,
  initialHistory,
  generateDynamicInitialData,
  initialTeacherRollCalls,
  initialStopCapacities,
  initialDriverSchedules,
  initialTempArrangements,
  initialSwipeAbnormalRecords,
} from "@/data/initialData";
import { uid, todayStr, isDateInRange } from "@/lib/utils";

export interface BusState {
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  drivers: Driver[];
  schedules: Schedule[];
  students: Student[];
  teachers: Teacher[];
  gradeRouteRules: GradeRouteRule[];
  tempStopRules: TempStopRule[];
  escortRules: EscortRule[];
  detours: Detour[];
  outages: Outage[];
  stopClosures: StopClosure[];
  weatherDelays: WeatherDelay[];
  parentAuths: ParentAuth[];
  leaveRecords: LeaveRecord[];
  swipeRecords: SwipeRecord[];
  history: HistoryRecord[];
  teacherRollCalls: TeacherRollCall[];
  stopCapacities: StopCapacity[];
  driverSchedules: DriverSchedule[];
  tempArrangements: TempArrangement[];
  swipeAbnormalRecords: SwipeAbnormalRecord[];
  derivationSnapshots: HistoryDerivationSnapshot[];
  darkMode: boolean;
  currentStudentId: string;
  currentStopId: string;
  simulatedDate: string;

  setDarkMode: (v: boolean) => void;
  setCurrentStudentId: (id: string) => void;
  setCurrentStopId: (id: string) => void;
  setSimulatedDate: (date: string) => void;
  resetSimulatedDate: () => void;

  updateVehicleStatus: (id: string, status: VehicleStatus, faultReason?: string) => void;
  assignReplacementVehicle: (faultyVehicleId: string, replacementId: string) => void;
  toggleStopClosed: (stopId: string, closed: boolean, reason?: string, alternativeId?: string) => void;
  addDetour: (detour: Omit<Detour, "id" | "isActive">) => void;
  addOutage: (outage: Omit<Outage, "id" | "isActive">) => void;
  addWeatherDelay: (delay: Omit<WeatherDelay, "id" | "isActive">) => void;
  addSwipeRecord: (record: Omit<SwipeRecord, "id">) => void;
  approveLeave: (leaveId: string) => void;
  addLeaveRecord: (record: Omit<LeaveRecord, "id" | "status" | "createdAt">) => void;
  setGradeRouteRule: (rule: Omit<GradeRouteRule, "id">) => void;
  addTempStopRule: (rule: Omit<TempStopRule, "id">) => void;
  setEscortRule: (rule: Omit<EscortRule, "id">) => void;
  toggleParentAuthorization: (studentId: string, authorized: boolean, routeIds?: string[]) => void;
  updateVehicleLoad: (vehicleId: string, delta: number) => void;
  resetAll: () => void;
  addHistory: (record: Omit<HistoryRecord, "id" | "timestamp">) => void;

  addTeacherRollCall: (record: Omit<TeacherRollCall, "id" | "recordedAt">) => void;
  updateStopCapacity: (stopId: string, scheduleId: string, currentCount: number) => void;
  updateDriverSchedule: (driverId: string, scheduleId: string, status: DriverScheduleStatus, replacementDriverId?: string, notes?: string) => void;
  addTempArrangement: (arrangement: Omit<TempArrangement, "id" | "createdAt">) => void;
  toggleTempArrangement: (id: string, isActive: boolean) => void;
  addSwipeAbnormalRecord: (record: Omit<SwipeAbnormalRecord, "id">) => void;
  handleSwipeAbnormal: (abnormalId: string, handledBy: string) => void;
  addDerivationSnapshot: (snapshot: Omit<HistoryDerivationSnapshot, "id">) => void;
  setRollCallStatus: (teacherId: string, scheduleId: string, stopId: string, studentId: string, status: RollCallStatus, notes?: string) => void;
}

const today = todayStr();

export const useBusStore = create<BusState>()(
  persist(
    (set) => ({
      routes: initialRoutes,
      stops: initialStops,
      vehicles: initialVehicles,
      drivers: initialDrivers,
      schedules: initialSchedules,
      students: initialStudents,
      teachers: initialTeachers,
      gradeRouteRules: initialGradeRouteRules,
      tempStopRules: initialTempStopRules,
      escortRules: initialEscortRules,
      detours: initialDetours,
      outages: initialOutages,
      stopClosures: initialStopClosures,
      weatherDelays: initialWeatherDelays,
      parentAuths: initialParentAuths,
      leaveRecords: initialLeaveRecords,
      swipeRecords: initialSwipeRecords,
      history: initialHistory,
      teacherRollCalls: initialTeacherRollCalls,
      stopCapacities: initialStopCapacities,
      driverSchedules: initialDriverSchedules,
      tempArrangements: initialTempArrangements,
      swipeAbnormalRecords: initialSwipeAbnormalRecords,
      derivationSnapshots: [],
      darkMode: true,
      currentStudentId: "ST001",
      currentStopId: "S001",
      simulatedDate: todayStr(),

      setDarkMode: (v) => set({ darkMode: v }),
      setCurrentStudentId: (id) => set({ currentStudentId: id }),
      setCurrentStopId: (id) => set({ currentStopId: id }),
      setSimulatedDate: (date) => set({ simulatedDate: date }),
      resetSimulatedDate: () => set({ simulatedDate: todayStr() }),

      addHistory: (record) =>
        set((s) => ({
          history: [
            { ...record, id: uid("HIS_"), timestamp: new Date().toISOString() },
            ...s.history,
          ].slice(0, 200),
        })),

      updateVehicleStatus: (id, status, faultReason) =>
        set((s) => {
          const vehicle = s.vehicles.find((v) => v.id === id);
          return {
            vehicles: s.vehicles.map((v) =>
              v.id === id ? { ...v, status, faultReason: faultReason ?? v.faultReason } : v
            ),
          };
        }),

      assignReplacementVehicle: (faultyId, replacementId) =>
        set((s) => {
          const faulty = s.vehicles.find((v) => v.id === faultyId);
          if (!faulty) return {};
          const updatedSchedules = s.schedules.map((sch) =>
            sch.vehicleId === faultyId
              ? { ...sch, vehicleId: replacementId, note: `${faulty.plateNumber}故障，由替换车接管` }
              : sch
          );
          return {
            vehicles: s.vehicles.map((v) =>
              v.id === faultyId
                ? { ...v, status: "fault" as VehicleStatus, replacementVehicleId: replacementId }
                : v.id === replacementId
                ? { ...v, status: "replacement" as VehicleStatus, routeId: faulty.routeId }
                : v
            ),
            schedules: updatedSchedules,
          };
        }),

      toggleStopClosed: (stopId, closed, reason, alternativeStopId) =>
        set((s) => ({
          stops: s.stops.map((st) =>
            st.id === stopId
              ? {
                  ...st,
                  isClosed: closed,
                  closedReason: reason ?? st.closedReason,
                  alternativeStopId: alternativeStopId ?? st.alternativeStopId,
                }
              : st
          ),
          stopClosures: closed
            ? [
                ...s.stopClosures,
                {
                  id: uid("SC_"),
                  stopId,
                  startDate: today,
                  endDate: today,
                  reason: reason ?? "临时封闭",
                  alternativeStopId: alternativeStopId,
                  isActive: true,
                },
              ]
            : s.stopClosures.map((sc) => (sc.stopId === stopId ? { ...sc, isActive: false, endDate: today } : sc)),
        })),

      addDetour: (detour) =>
        set((s) => ({
          detours: [...s.detours, { ...detour, id: uid("DET_"), isActive: true }],
        })),

      addOutage: (outage) =>
        set((s) => ({
          outages: [...s.outages, { ...outage, id: uid("OUT_"), isActive: true }],
        })),

      addWeatherDelay: (delay) =>
        set((s) => ({
          weatherDelays: [...s.weatherDelays, { ...delay, id: uid("WD_"), isActive: true }],
        })),

      addSwipeRecord: (record) =>
        set((s) => ({
          swipeRecords: [{ ...record, id: uid("SW_") }, ...s.swipeRecords],
        })),

      approveLeave: (leaveId) =>
        set((s) => ({
          leaveRecords: s.leaveRecords.map((lv) => (lv.id === leaveId ? { ...lv, status: "approved" as const } : lv)),
        })),

      addLeaveRecord: (record) =>
        set((s) => ({
          leaveRecords: [
            { ...record, id: uid("LV_"), status: "pending", createdAt: new Date().toISOString() },
            ...s.leaveRecords,
          ],
        })),

      setGradeRouteRule: (rule) =>
        set((s) => {
          const existing = s.gradeRouteRules.find(
            (r) => r.teacherId === rule.teacherId && r.grade === rule.grade
          );
          return {
            gradeRouteRules: existing
              ? s.gradeRouteRules.map((r) => (r.id === existing.id ? { ...r, ...rule } : r))
              : [...s.gradeRouteRules, { ...rule, id: uid("GRR_") }],
          };
        }),

      addTempStopRule: (rule) =>
        set((s) => ({
          tempStopRules: [...s.tempStopRules, { ...rule, id: uid("TSR_") }],
        })),

      setEscortRule: (rule) =>
        set((s) => {
          const existing = s.escortRules.find(
            (r) => r.teacherId === rule.teacherId && r.grade === rule.grade
          );
          return {
            escortRules: existing
              ? s.escortRules.map((r) => (r.id === existing.id ? { ...r, ...rule } : r))
              : [...s.escortRules, { ...rule, id: uid("ER_") }],
          };
        }),

      toggleParentAuthorization: (studentId, authorized, routeIds) =>
        set((s) => ({
          students: s.students.map((st) => (st.id === studentId ? { ...st, parentAuthorized: authorized } : st)),
          parentAuths: authorized
            ? (() => {
                const existing = s.parentAuths.find((p) => p.studentId === studentId);
                const future = new Date();
                future.setDate(future.getDate() + 30);
                if (existing) {
                  return s.parentAuths.map((p) =>
                    p.studentId === studentId ? { ...p, routeIds: routeIds ?? p.routeIds, expiresAt: future.toISOString().slice(0, 10) } : p
                  );
                }
                return [
                  ...s.parentAuths,
                  {
                    id: uid("PA_"),
                    studentId,
                    routeIds: routeIds ?? [],
                    authorizedAt: today,
                    expiresAt: future.toISOString().slice(0, 10),
                    parentName: "家长",
                    parentPhone: "-",
                  },
                ];
              })()
            : s.parentAuths.filter((p) => p.studentId !== studentId),
        })),

      updateVehicleLoad: (vehicleId, delta) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) =>
            v.id === vehicleId
              ? {
                  ...v,
                  currentLoad: Math.max(0, Math.min(v.capacity, v.currentLoad + delta)),
                  status:
                    v.currentLoad + delta >= v.capacity
                      ? ("full" as VehicleStatus)
                      : v.status === "full" && v.currentLoad + delta < v.capacity
                      ? ("normal" as VehicleStatus)
                      : v.status,
                }
              : v
          ),
        })),

      resetAll: () => {
        const dynamic = generateDynamicInitialData(todayStr());
        set({
          routes: initialRoutes,
          stops: initialStops,
          vehicles: initialVehicles,
          drivers: initialDrivers,
          schedules: initialSchedules,
          students: initialStudents,
          teachers: initialTeachers,
          gradeRouteRules: dynamic.gradeRouteRules,
          tempStopRules: dynamic.tempStopRules,
          escortRules: initialEscortRules,
          detours: dynamic.detours,
          outages: dynamic.outages,
          stopClosures: dynamic.stopClosures,
          weatherDelays: dynamic.weatherDelays,
          parentAuths: dynamic.parentAuths,
          leaveRecords: dynamic.leaveRecords,
          swipeRecords: initialSwipeRecords,
          history: initialHistory,
          teacherRollCalls: initialTeacherRollCalls,
          stopCapacities: initialStopCapacities,
          driverSchedules: initialDriverSchedules,
          tempArrangements: initialTempArrangements,
          swipeAbnormalRecords: initialSwipeAbnormalRecords,
          derivationSnapshots: [],
          simulatedDate: todayStr(),
        });
      },

      addTeacherRollCall: (record) =>
        set((s) => ({
          teacherRollCalls: [
            { ...record, id: uid("RC_"), recordedAt: new Date().toISOString() },
            ...s.teacherRollCalls,
          ],
        })),

      setRollCallStatus: (teacherId, scheduleId, stopId, studentId, status, notes) =>
        set((s) => {
          const dateStr = todayStr();
          const existing = s.teacherRollCalls.find(
            (r) =>
              r.teacherId === teacherId &&
              r.scheduleId === scheduleId &&
              r.stopId === stopId &&
              r.studentId === studentId &&
              r.date === dateStr
          );
          if (existing) {
            return {
              teacherRollCalls: s.teacherRollCalls.map((r) =>
                r.id === existing.id ? { ...r, status, notes, recordedAt: new Date().toISOString() } : r
              ),
            };
          }
          return {
            teacherRollCalls: [
              {
                id: uid("RC_"),
                teacherId,
                scheduleId,
                stopId,
                date: dateStr,
                studentId,
                status,
                notes,
                recordedAt: new Date().toISOString(),
              },
              ...s.teacherRollCalls,
            ],
          };
        }),

      updateStopCapacity: (stopId, scheduleId, currentCount) =>
        set((s) => {
          const dateStr = todayStr();
          const existing = s.stopCapacities.find((c) => c.stopId === stopId && c.scheduleId === scheduleId && c.date === dateStr);
          if (existing) {
            return {
              stopCapacities: s.stopCapacities.map((c) =>
                c.id === existing.id ? { ...c, currentCount, lastUpdated: new Date().toISOString() } : c
              ),
            };
          }
          return {
            stopCapacities: [
              ...s.stopCapacities,
              {
                id: uid("CAP_"),
                stopId,
                scheduleId,
                date: dateStr,
                currentCount,
                maxCapacity: 20,
                lastUpdated: new Date().toISOString(),
              },
            ],
          };
        }),

      updateDriverSchedule: (driverId, scheduleId, status, replacementDriverId, notes) =>
        set((s) => {
          const dateStr = todayStr();
          const existing = s.driverSchedules.find((d) => d.driverId === driverId && d.scheduleId === scheduleId && d.date === dateStr);
          s.addHistory({
            type: "driver",
            entityType: "DriverSchedule",
            entityId: scheduleId,
            action: "driver_status",
            data: { driverId, scheduleId, status, replacementDriverId, notes },
            operator: "调度员",
          });
          if (existing) {
            return {
              driverSchedules: s.driverSchedules.map((d) =>
                d.id === existing.id
                  ? { ...d, status, replacementDriverId, notes, updatedAt: new Date().toISOString() }
                  : d
              ),
            };
          }
          return {
            driverSchedules: [
              ...s.driverSchedules,
              {
                id: uid("DS_"),
                driverId,
                scheduleId,
                date: dateStr,
                status,
                replacementDriverId,
                notes,
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        }),

      addTempArrangement: (arrangement) =>
        set((s) => ({
          tempArrangements: [
            { ...arrangement, id: uid("TA_"), createdAt: new Date().toISOString() },
            ...s.tempArrangements,
          ],
        })),

      toggleTempArrangement: (id, isActive) =>
        set((s) => ({
          tempArrangements: s.tempArrangements.map((a) => (a.id === id ? { ...a, isActive } : a)),
        })),

      addSwipeAbnormalRecord: (record) =>
        set((s) => {
          s.addHistory({
            type: "swipe",
            entityType: "SwipeAbnormalRecord",
            entityId: record.studentId,
            action: "abnormal",
            data: { abnormalType: record.abnormalType, description: record.description, scheduleId: record.scheduleId },
            operator: "车载刷卡机",
          });
          return {
            swipeAbnormalRecords: [{ ...record, id: uid("ABN_") }, ...s.swipeAbnormalRecords],
          };
        }),

      handleSwipeAbnormal: (abnormalId, handledBy) =>
        set((s) => ({
          swipeAbnormalRecords: s.swipeAbnormalRecords.map((a) =>
            a.id === abnormalId
              ? { ...a, handled: true, handledBy, handledAt: new Date().toISOString() }
              : a
          ),
        })),

      addDerivationSnapshot: (snapshot) =>
        set((s) => ({
          derivationSnapshots: [{ ...snapshot, id: uid("SNAP_") }, ...s.derivationSnapshots].slice(0, 100),
        })),
    }),
    {
      name: "campus-bus-store",
      partialize: (s) => ({
        darkMode: s.darkMode,
        currentStudentId: s.currentStudentId,
        currentStopId: s.currentStopId,
        simulatedDate: s.simulatedDate,
        vehicles: s.vehicles,
        stops: s.stops,
        detours: s.detours,
        outages: s.outages,
        stopClosures: s.stopClosures,
        weatherDelays: s.weatherDelays,
        gradeRouteRules: s.gradeRouteRules,
        tempStopRules: s.tempStopRules,
        escortRules: s.escortRules,
        parentAuths: s.parentAuths,
        leaveRecords: s.leaveRecords,
        swipeRecords: s.swipeRecords,
        history: s.history,
        schedules: s.schedules,
        teacherRollCalls: s.teacherRollCalls,
        stopCapacities: s.stopCapacities,
        driverSchedules: s.driverSchedules,
        tempArrangements: s.tempArrangements,
        swipeAbnormalRecords: s.swipeAbnormalRecords,
        derivationSnapshots: s.derivationSnapshots,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const today = todayStr();
        if (state.simulatedDate) {
          state.simulatedDate = today;
        }
        const needsRefresh = (arr: any[], dateField: string, endField?: string) => {
          if (!arr || arr.length === 0) return false;
          return arr.some((item) => {
            if (endField && item[endField]) {
              return !isDateInRange(today, item[dateField], item[endField]);
            }
            return item[dateField] !== today;
          });
        };
        const dynamic = generateDynamicInitialData(today);
        let updated = false;
        if (needsRefresh(state.weatherDelays, "effectiveDate") || !state.weatherDelays || state.weatherDelays.length === 0) {
          state.weatherDelays = dynamic.weatherDelays;
          updated = true;
        }
        if (needsRefresh(state.tempStopRules, "effectiveDate", "endDate") || !state.tempStopRules || state.tempStopRules.length === 0) {
          state.tempStopRules = dynamic.tempStopRules;
          updated = true;
        }
        if (needsRefresh(state.detours, "startDate", "endDate") || !state.detours || state.detours.length === 0) {
          state.detours = dynamic.detours;
          updated = true;
        }
        if (needsRefresh(state.outages, "startDate", "endDate") || !state.outages || state.outages.length === 0) {
          state.outages = dynamic.outages;
          updated = true;
        }
        if (needsRefresh(state.stopClosures, "startDate", "endDate") || !state.stopClosures || state.stopClosures.length === 0) {
          state.stopClosures = dynamic.stopClosures;
          updated = true;
        }
        if (needsRefresh(state.gradeRouteRules, "effectiveDate") || !state.gradeRouteRules || state.gradeRouteRules.length === 0) {
          state.gradeRouteRules = dynamic.gradeRouteRules;
          updated = true;
        }
        if (needsRefresh(state.parentAuths, "authorizedAt", "expiresAt") || !state.parentAuths || state.parentAuths.length === 0) {
          state.parentAuths = dynamic.parentAuths;
          updated = true;
        }
        if (needsRefresh(state.leaveRecords, "startDate", "endDate") || !state.leaveRecords || state.leaveRecords.length === 0) {
          state.leaveRecords = dynamic.leaveRecords;
          updated = true;
        }
      },
    }
  )
);
