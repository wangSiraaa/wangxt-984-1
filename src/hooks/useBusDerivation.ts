import { useMemo } from "react";
import type {
  DerivationResult,
  AvailableRoute,
  RuleStep,
  StopArrival,
  Student,
  Route,
  Stop,
  Vehicle,
  Schedule,
  Detour,
  Outage,
  StopClosure,
  WeatherDelay,
  GradeRouteRule,
  TempStopRule,
  EscortRule,
  ParentAuth,
  LeaveRecord,
  SwipeRecord,
  TeacherRollCall,
  StopCapacity,
  DriverSchedule,
  TempArrangement,
  SwipeAbnormalRecord,
  DriverScheduleStatus,
  RollCallStatus,
  RouteInvisibilityReason,
  BoardingHint,
} from "@/types";
import {
  addMinutes,
  minutesBetween,
  isTodayInRange,
  isDateInRange,
  getDayOfWeekFromDate,
  todayStr,
  uid,
} from "@/lib/utils";

interface DerivationInputs {
  student: Student | undefined;
  routes: Route[];
  stops: Stop[];
  vehicles: Vehicle[];
  schedules: Schedule[];
  drivers: { id: string; name: string }[];
  detours: Detour[];
  outages: Outage[];
  stopClosures: StopClosure[];
  weatherDelays: WeatherDelay[];
  gradeRouteRules: GradeRouteRule[];
  tempStopRules: TempStopRule[];
  escortRules: EscortRule[];
  parentAuths: ParentAuth[];
  leaveRecords: LeaveRecord[];
  swipeRecords: SwipeRecord[];
  teacherRollCalls: TeacherRollCall[];
  stopCapacities: StopCapacity[];
  driverSchedules: DriverSchedule[];
  tempArrangements: TempArrangement[];
  swipeAbnormalRecords: SwipeAbnormalRecord[];
  currentTime?: string;
  simulatedDate?: string;
}

function getStopOrderInRoute(route: Route, stopId: string): number {
  const stop = route.stops.find((s) => s.stopId === stopId);
  return stop?.order ?? -1;
}

function getStopMinutesInRoute(route: Route, stopId: string): number {
  const stop = route.stops.find((s) => s.stopId === stopId);
  return stop?.estimatedMinutes ?? 0;
}

function getActiveDetour(routeId: string, detours: Detour[], dateStr: string): Detour | undefined {
  return detours.find(
    (d) => d.routeId === routeId && d.isActive && isDateInRange(dateStr, d.startDate, d.endDate)
  );
}

function getActiveOutage(
  outageFilter: { routeId?: string; vehicleId?: string; scheduleId?: string },
  outages: Outage[],
  dateStr: string
): Outage | undefined {
  return outages.find((o) => {
    if (!o.isActive || !isDateInRange(dateStr, o.startDate, o.endDate)) return false;
    if (outageFilter.routeId && o.routeId !== outageFilter.routeId) return false;
    if (outageFilter.vehicleId && o.vehicleId !== outageFilter.vehicleId) return false;
    if (outageFilter.scheduleId && o.scheduleId !== outageFilter.scheduleId) return false;
    return true;
  });
}

function getActiveStopClosure(stopId: string, closures: StopClosure[], dateStr: string): StopClosure | undefined {
  return closures.find(
    (c) => c.stopId === stopId && c.isActive && isDateInRange(dateStr, c.startDate, c.endDate)
  );
}

function getActiveWeatherDelay(delays: WeatherDelay[], routeId: string | undefined, dateStr: string): WeatherDelay | undefined {
  return delays.find(
    (d) =>
      d.isActive &&
      isDateInRange(dateStr, d.effectiveDate) &&
      (!routeId || !d.routeId || d.routeId === routeId)
  );
}

function getGradeRule(
  grade: number,
  teacherId: string,
  rules: GradeRouteRule[]
): GradeRouteRule | undefined {
  return rules.find((r) => r.grade === grade && r.teacherId === teacherId);
}

function getTempStop(
  scheduleId: string,
  stopId: string,
  rules: TempStopRule[],
  dateStr: string
): TempStopRule | undefined {
  return rules.find(
    (r) =>
      r.scheduleId === scheduleId &&
      r.stopId === stopId &&
      isDateInRange(dateStr, r.effectiveDate, r.endDate)
  );
}

function getEscortRule(
  grade: number,
  teacherId: string,
  rules: EscortRule[]
): EscortRule | undefined {
  return rules.find((r) => r.grade === grade && r.teacherId === teacherId);
}

function getParentAuth(studentId: string, auths: ParentAuth[], dateStr: string): ParentAuth | undefined {
  return auths.find(
    (a) => a.studentId === studentId && isDateInRange(dateStr, a.authorizedAt, a.expiresAt)
  );
}

function getActiveLeave(studentId: string, leaves: LeaveRecord[], dateStr: string): LeaveRecord | undefined {
  return leaves.find(
    (l) => l.studentId === studentId && l.status === "approved" && isDateInRange(dateStr, l.startDate, l.endDate)
  );
}

function hasBoarded(studentId: string, scheduleId: string, swipes: SwipeRecord[]): boolean {
  return swipes.some(
    (s) =>
      s.studentId === studentId &&
      s.scheduleId === scheduleId &&
      s.type === "board" &&
      !s.abnormal
  );
}

function getDriverScheduleStatus(
  driverId: string,
  scheduleId: string,
  driverSchedules: DriverSchedule[],
  dateStr: string
): DriverScheduleStatus {
  const ds = driverSchedules.find(
    (d) => d.driverId === driverId && d.scheduleId === scheduleId && d.date === dateStr
  );
  return ds?.status ?? "scheduled";
}

function getStopCapacity(
  stopId: string,
  scheduleId: string,
  capacities: StopCapacity[],
  dateStr: string
): StopCapacity | undefined {
  return capacities.find((c) => c.stopId === stopId && c.scheduleId === scheduleId && c.date === dateStr);
}

function getRollCallStatus(
  studentId: string,
  scheduleId: string,
  stopId: string,
  rollCalls: TeacherRollCall[],
  dateStr: string
): RollCallStatus {
  const rc = rollCalls.find(
    (r) => r.studentId === studentId && r.scheduleId === scheduleId && r.stopId === stopId && r.date === dateStr
  );
  return rc?.status ?? "unknown";
}

function hasActiveAbnormalSwipe(
  studentId: string,
  scheduleId: string,
  abnormalRecords: SwipeAbnormalRecord[],
  dateStr: string
): SwipeAbnormalRecord | undefined {
  return abnormalRecords.find(
    (a) =>
      a.studentId === studentId &&
      a.scheduleId === scheduleId &&
      !a.handled &&
      a.swipeTime.startsWith(dateStr)
  );
}

function getActiveTempArrangements(
  arrangements: TempArrangement[],
  studentId: string,
  routeId: string,
  stopId: string,
  dateStr: string
): TempArrangement[] {
  return arrangements.filter((a) => {
    if (!a.isActive) return false;
    if (!isDateInRange(dateStr, a.startDate, a.endDate)) return false;
    if (a.routeId && a.routeId !== routeId) return false;
    if (a.stopId && a.stopId !== stopId) return false;
    if (a.studentIds && !a.studentIds.includes(studentId)) return false;
    return true;
  });
}

function generateTransferHints(
  blockedRoutes: AvailableRoute[],
  availableRoutes: AvailableRoute[],
  student: Student,
  stops: Stop[],
  gradeRouteRules: GradeRouteRule[]
): string[] {
  const hints: string[] = [];
  
  const blockedDueToClosure = blockedRoutes.filter(
    (r) => r.blockReasons.some((b) => b.includes("封闭") || b.includes("绕行"))
  );
  
  if (blockedDueToClosure.length > 0 && availableRoutes.length > 0) {
    const availableRouteNames = availableRoutes
      .slice(0, 3)
      .map((r) => `${r.routeName}(${r.estimatedArrival})`)
      .join("、");
    hints.push(`原乘车站点封闭/线路绕行，建议换乘 ${availableRouteNames}`);
  }
  
  const blockedDueToCapacity = blockedRoutes.filter(
    (r) => r.blockReasons.some((b) => b.includes("满员") || b.includes("容量"))
  );
  
  if (blockedDueToCapacity.length > 0) {
    const laterRoute = availableRoutes.find((r) => r.availableSeats > 0);
    if (laterRoute) {
      hints.push(`原线路已满员，建议乘坐 ${laterRoute.routeName}（${laterRoute.estimatedArrival}，余座${laterRoute.availableSeats}）`);
    }
  }

  const blockedDueToGrade = blockedRoutes.filter(
    (r) => r.blockReasons.some((b) => b.includes("年级限制"))
  );
  if (blockedDueToGrade.length > 0) {
    const gradeRule = gradeRouteRules.find((r) => r.grade === student.grade);
    const allowedNames = availableRoutes
      .filter((r) => !gradeRule || gradeRule.allowedRouteIds.includes(r.routeId))
      .slice(0, 2)
      .map((r) => r.routeName)
      .join("、");
    if (allowedNames) {
      hints.push(`${student.grade}年级学生仅可乘坐：${allowedNames}`);
    }
  }

  const blockedDueToDriver = blockedRoutes.filter(
    (r) => r.blockReasons.some((b) => b.includes("司机"))
  );
  if (blockedDueToDriver.length > 0 && availableRoutes.length > 0) {
    hints.push(`部分线路司机临时调整，建议乘坐 ${availableRoutes[0]?.routeName}`);
  }
  
  return hints;
}

function createInvisibilityReason(
  route: Route,
  blockStep: string,
  blockReason: string,
  suggestion?: string,
  blockData?: Record<string, unknown>
): RouteInvisibilityReason {
  return {
    routeId: route.id,
    routeName: route.name,
    routeCode: route.code,
    blockStep,
    blockReason,
    suggestion,
    blockData,
  };
}

function generateBoardingHints(
  routeResult: AvailableRoute,
  rollCallStatus: RollCallStatus,
  hasAbnormal: boolean,
  stopCapacity: StopCapacity | undefined,
  tempArrangements: TempArrangement[]
): BoardingHint[] {
  const hints: BoardingHint[] = [];
  const now = new Date().toISOString();
  const uidBase = routeResult.routeId + routeResult.scheduleId;
  
  if (!routeResult.isBoardable) {
    routeResult.blockReasons.forEach((reason, i) => {
      hints.push({
        id: `hint_${uidBase}_${i}`,
        studentId: "",
        scheduleId: routeResult.scheduleId,
        routeId: routeResult.routeId,
        type: "error",
        message: reason,
        timestamp: now,
      });
    });
  }
  
  if (rollCallStatus === "absent") {
    hints.push({
      id: `hint_${uidBase}_rollcall`,
      studentId: "",
      scheduleId: routeResult.scheduleId,
      routeId: routeResult.routeId,
      type: "warning",
      message: "老师点名未到，请确认是否乘车",
      timestamp: now,
    });
  }
  
  if (hasAbnormal) {
    hints.push({
      id: `hint_${uidBase}_abnormal`,
      studentId: "",
      scheduleId: routeResult.scheduleId,
      routeId: routeResult.routeId,
      type: "error",
      message: "存在未处理的刷卡异常，请联系随车老师",
      timestamp: now,
    });
  }
  
  if (stopCapacity && stopCapacity.currentCount >= stopCapacity.maxCapacity * 0.8) {
    hints.push({
      id: `hint_${uidBase}_capacity`,
      studentId: "",
      scheduleId: routeResult.scheduleId,
      routeId: routeResult.routeId,
      type: "warning",
      message: `站点候车人数较多（${stopCapacity.currentCount}/${stopCapacity.maxCapacity}），请注意秩序`,
      timestamp: now,
    });
  }
  
  tempArrangements.forEach((ta, i) => {
    hints.push({
      id: `hint_${uidBase}_temp_${i}`,
      studentId: "",
      scheduleId: routeResult.scheduleId,
      routeId: routeResult.routeId,
      type: "info",
      message: `临时安排：${ta.title} - ${ta.description}`,
      timestamp: now,
    });
  });
  
  return hints;
}

export function useBusDerivation(inputs: DerivationInputs) {
  const {
    student,
    routes,
    stops,
    vehicles,
    schedules,
    drivers,
    detours,
    outages,
    stopClosures,
    weatherDelays,
    gradeRouteRules,
    tempStopRules,
    escortRules,
    parentAuths,
    leaveRecords,
    swipeRecords,
    teacherRollCalls,
    stopCapacities,
    driverSchedules,
    tempArrangements,
    swipeAbnormalRecords,
    simulatedDate,
  } = inputs;

  const effectiveDate = simulatedDate || todayStr();
  const dayOfWeek = getDayOfWeekFromDate(effectiveDate);

  const derivationResult = useMemo<DerivationResult | null>(() => {
    if (!student) return null;

    const steps: RuleStep[] = [];
    const availableRoutes: AvailableRoute[] = [];
    const blockedRoutes: AvailableRoute[] = [];

    steps.push({
      id: uid("step_"),
      name: "学生身份验证",
      description: "验证学生基本信息和乘车资格",
      passed: true,
      data: {
        studentId: student.id,
        name: student.name,
        grade: student.grade,
        identity: student.identity,
      },
    });

    const activeLeave = getActiveLeave(student.id, leaveRecords);
    if (activeLeave) {
      steps.push({
        id: uid("step_"),
        name: "请假检查",
        description: "检查学生是否在请假期间",
        passed: false,
        reason: `学生处于请假期间：${activeLeave.reason}（${activeLeave.startDate} 至 ${activeLeave.endDate}）`,
        data: { leaveId: activeLeave.id },
      });
      return {
        studentId: student.id,
        studentName: student.name,
        availableRoutes: [],
        blockedRoutes: [],
        steps,
        generatedAt: new Date().toISOString(),
      };
    }
    steps.push({
      id: uid("step_"),
      name: "请假检查",
      description: "确认学生不在请假期间",
      passed: true,
    });

    if (!student.parentAuthorized) {
      steps.push({
        id: uid("step_"),
        name: "家长授权检查",
        description: "检查家长是否已授权乘车",
        passed: false,
        reason: "家长尚未授权学生乘车，请联系家长完成授权",
        data: { studentId: student.id },
      });
      return {
        studentId: student.id,
        studentName: student.name,
        availableRoutes: [],
        blockedRoutes: [],
        steps,
        generatedAt: new Date().toISOString(),
      };
    }

    const parentAuth = getParentAuth(student.id, parentAuths);
    if (!parentAuth) {
      steps.push({
        id: uid("step_"),
        name: "家长授权验证",
        description: "验证有效的家长授权记录",
        passed: false,
        reason: "未找到有效的家长授权记录，请重新授权",
      });
      return {
        studentId: student.id,
        studentName: student.name,
        availableRoutes: [],
        blockedRoutes: [],
        steps,
        generatedAt: new Date().toISOString(),
      };
    }
    steps.push({
      id: uid("step_"),
      name: "家长授权验证",
      description: "验证家长授权记录有效",
      passed: true,
      data: {
        parentName: parentAuth.parentName,
        authorizedRoutes: parentAuth.routeIds,
        expiresAt: parentAuth.expiresAt,
      },
    });

    const stopClosure = getActiveStopClosure(student.stopId, stopClosures);
    const studentStop = stops.find((s) => s.id === student.stopId);

    if (stopClosure || studentStop?.isClosed) {
      steps.push({
        id: uid("step_"),
        name: "站点封闭检查",
        description: "检查学生乘车站点是否开放",
        passed: false,
        reason: stopClosure?.reason || "该站点临时封闭",
        data: {
          stopId: student.stopId,
          stopName: studentStop?.name,
          alternativeStopId: stopClosure?.alternativeStopId,
        },
      });
    } else {
      steps.push({
        id: uid("step_"),
        name: "站点开放检查",
        description: "确认学生乘车站点正常开放",
        passed: true,
        data: { stopId: student.stopId, stopName: studentStop?.name },
      });
    }

    const gradeRule = gradeRouteRules.find((r) => r.grade === student.grade);
    if (gradeRule) {
      steps.push({
        id: uid("step_"),
        name: "年级线路规则",
        description: `应用${student.grade}年级可乘线路限制`,
        passed: true,
        data: {
          grade: student.grade,
          allowedRoutes: gradeRule.allowedRouteIds,
          teacher: gradeRule.teacherId,
        },
      });
    } else if (student.grade <= 3) {
      steps.push({
        id: uid("step_"),
        name: "低年级线路限制",
        description: "低年级学生需要老师配置可乘线路",
        passed: false,
        reason: "低年级学生请联系老师配置可乘线路",
        data: { grade: student.grade },
      });
    }

    const escortRule = escortRules.find((r) => r.grade === student.grade);

    const activeSchedules = schedules.filter(
      (s) => s.isActive && s.dayOfWeek.includes(dayOfWeek)
    );

    for (const schedule of activeSchedules) {
      const route = routes.find((r) => r.id === schedule.routeId);
      const vehicle = vehicles.find((v) => v.id === schedule.vehicleId);
      const driver = drivers.find((d) => d.id === schedule.driverId);

      if (!route || !vehicle || !driver) continue;

      const blockReasons: string[] = [];
      let isBoardable = true;
      let delayMinutes = 0;

      const routeStepData: Record<string, unknown> = {
        routeId: route.id,
        routeName: route.name,
        scheduleId: schedule.id,
        departureTime: schedule.departureTime,
      };

      if (!route.isActive) {
        blockReasons.push("线路未启用");
        isBoardable = false;
      }

      const routeOutage = getActiveOutage({ routeId: route.id }, outages);
      const vehicleOutage = getActiveOutage({ vehicleId: vehicle.id }, outages);
      const scheduleOutage = getActiveOutage({ scheduleId: schedule.id }, outages);

      if (routeOutage || vehicleOutage || scheduleOutage) {
        const outage = routeOutage || vehicleOutage || scheduleOutage;
        blockReasons.push(outage?.reason || "班次停运");
        isBoardable = false;
        routeStepData["outageReason"] = outage?.reason;
      }

      if (vehicle.status === "fault" || vehicle.status === "inspection_expired") {
        blockReasons.push(
          vehicle.status === "fault"
            ? `车辆故障：${vehicle.faultReason || "待修"}`
            : "车辆年检已过期"
        );
        isBoardable = false;
      }

      const driverStatus = getDriverScheduleStatus(schedule.driverId, schedule.id, driverSchedules, effectiveDate);
      routeStepData["driverStatus"] = driverStatus;
      if (driverStatus === "leave" || driverStatus === "off_duty") {
        const ds = driverSchedules.find(
          (d) => d.driverId === schedule.driverId && d.scheduleId === schedule.id && d.date === effectiveDate
        );
        if (ds?.replacementDriverId) {
          const replacementDriver = drivers.find((d) => d.id === ds.replacementDriverId);
          routeStepData["replacementDriver"] = replacementDriver?.name;
        } else {
          blockReasons.push(`司机${driverStatus === "leave" ? "请假" : "未到岗"}，暂无代班司机`);
          isBoardable = false;
        }
      }

      const stopOrder = getStopOrderInRoute(route, student.stopId);
      if (stopOrder < 0) {
        blockReasons.push("线路不经过该学生的乘车站点");
        isBoardable = false;
      }

      const activeDetour = getActiveDetour(route.id, detours);
      if (activeDetour && activeDetour.skippedStopIds.includes(student.stopId)) {
        blockReasons.push(
          `线路临时绕行：${activeDetour.reason}，该站点临时跳过，请前往 ${activeDetour.alternativeStopIds
            .map((id) => stops.find((s) => s.id === id)?.name)
            .join("、")} 乘车`
        );
        isBoardable = false;
        routeStepData["detour"] = activeDetour.reason;
      }

      if (gradeRule && !gradeRule.allowedRouteIds.includes(route.id)) {
        blockReasons.push(`年级限制：${student.grade}年级不可乘坐此线路`);
        isBoardable = false;
      }

      if (parentAuth && !parentAuth.routeIds.includes(route.id)) {
        blockReasons.push("家长未授权此线路");
        isBoardable = false;
      }

      const rollCallStatus = getRollCallStatus(student.id, schedule.id, student.stopId, teacherRollCalls, effectiveDate);
      routeStepData["rollCallStatus"] = rollCallStatus;
      if (rollCallStatus === "absent") {
        blockReasons.push("老师点名未到，如已到校请联系老师更新状态");
        isBoardable = false;
      }

      const abnormalSwipe = hasActiveAbnormalSwipe(student.id, schedule.id, swipeAbnormalRecords, effectiveDate);
      if (abnormalSwipe) {
        blockReasons.push(`刷卡异常：${abnormalSwipe.description}，请联系随车老师处理`);
        isBoardable = false;
      }

      const stopCapacity = getStopCapacity(student.stopId, schedule.id, stopCapacities, effectiveDate);
      routeStepData["stopCapacity"] = stopCapacity
        ? `${stopCapacity.currentCount}/${stopCapacity.maxCapacity}`
        : "未统计";
      if (stopCapacity && stopCapacity.currentCount >= stopCapacity.maxCapacity) {
        blockReasons.push(`站点候车人数已满（${stopCapacity.currentCount}/${stopCapacity.maxCapacity}），建议乘坐后续班次`);
        isBoardable = false;
      }

      const activeTempArrangements = getActiveTempArrangements(
        tempArrangements,
        student.id,
        route.id,
        student.stopId,
        effectiveDate
      );
      activeTempArrangements.forEach((ta) => {
        if (ta.type === "capacity_increase" || ta.type === "priority_student" || ta.type === "extra_vehicle") {
          routeStepData["tempArrangement"] = ta.title;
        }
      });

      const weatherDelay = getActiveWeatherDelay(weatherDelays, route.id);
      if (weatherDelay) {
        delayMinutes += weatherDelay.delayMinutes;
        routeStepData["weatherDelay"] = `${weatherDelay.delayMinutes}分钟（${weatherDelay.reason}）`;
      }

      if (activeDetour) {
        delayMinutes += activeDetour.addedMinutes;
      }

      const tempStop = getTempStop(schedule.id, student.stopId, tempStopRules);
      if (tempStop) {
        delayMinutes += tempStop.duration;
        routeStepData["tempStop"] = `临时停靠${tempStop.duration}分钟：${tempStop.reason}`;
      }

      const baseMinutes = getStopMinutesInRoute(route, student.stopId);
      const originalArrival = addMinutes(schedule.departureTime, baseMinutes);
      const estimatedArrival = addMinutes(schedule.departureTime, baseMinutes + delayMinutes);

      const availableSeats = vehicle.capacity - vehicle.currentLoad;

      if (vehicle.status === "full" || availableSeats <= 0) {
        blockReasons.push("车辆已满员，无法上车");
        isBoardable = false;
      }

      let requiresEscort = false;
      if (escortRule && escortRule.requireEscort && escortRule.escortStopIds.includes(student.stopId)) {
        requiresEscort = true;
        routeStepData["escort"] = "需要老师护送下车";
      }

      const boarded = hasBoarded(student.id, schedule.id, swipeRecords);
      const driverStatus = getDriverScheduleStatus(schedule.driverId, schedule.id, driverSchedules, effectiveDate);
      const finalDriverName = driverStatus === "replaced" || driverStatus === "leave"
        ? (driverSchedules.find((d) => d.driverId === schedule.driverId && d.scheduleId === schedule.id && d.date === effectiveDate)?.replacementDriverId
            ? drivers.find((d) => d.id === driverSchedules.find((ds) => ds.driverId === schedule.driverId && ds.scheduleId === schedule.id && ds.date === effectiveDate)?.replacementDriverId)?.name
            : driver.name)
        : driver.name;
      
      const invisibilityReasons: RouteInvisibilityReason[] = [];
      if (!isBoardable) {
        blockReasons.forEach((reason, i) => {
          const steps = ["线路状态", "车辆状态", "司机状态", "站点匹配", "线路绕行", "年级限制", "家长授权", "老师点名", "刷卡异常", "站点容量", "车辆容量"];
          invisibilityReasons.push(
            createInvisibilityReason(
              route,
              steps[Math.min(i, steps.length - 1)],
              reason,
              availableRoutes.length > 0 ? `建议乘坐 ${availableRoutes[0]?.routeName}（${availableRoutes[0]?.estimatedArrival}）` : undefined,
              { blockIndex: i, stepData: routeStepData }
            )
          );
        });
      }

      const baseBoardingHints = generateBoardingHints(
        { routeId: route.id, routeName: route.name, routeCode: route.code, colorIndex: route.colorIndex, scheduleId: schedule.id, departureTime: schedule.departureTime, estimatedArrival, originalArrival, delayMinutes, vehicleId: vehicle.id, vehiclePlate: vehicle.plateNumber, driverName: finalDriverName, availableSeats, isBoardable, blockReasons, requiresEscort: false, isTempStop: !!tempStop },
        rollCallStatus,
        !!abnormalSwipe,
        stopCapacity,
        activeTempArrangements
      );
      const boardingHints = [...baseBoardingHints];
      if (student.grade <= 3 && isBoardable) {
        boardingHints.push({
          id: `hint_lower_grade_${route.id}_${schedule.id}`,
          studentId: student.id,
          scheduleId: schedule.id,
          routeId: route.id,
          type: "warning",
          message: `${student.grade}年级低年级同学请注意：请在老师或家长陪同下乘车，下车前请确认有人接送`,
          timestamp: new Date().toISOString(),
        });
      }
      if (requiresEscort) {
        boardingHints.push({
          id: `hint_escort_${route.id}_${schedule.id}`,
          studentId: student.id,
          scheduleId: schedule.id,
          routeId: route.id,
          type: "info",
          message: "该站点需要老师护送下车，请在座位上等候老师提醒",
          timestamp: new Date().toISOString(),
        });
      }

      const transferHint = !isBoardable && blockReasons.some((b) => b.includes("绕行") || b.includes("封闭"))
        ? availableRoutes.length > 0
          ? `建议换乘 ${availableRoutes[0]?.routeName}（${availableRoutes[0]?.estimatedArrival}）`
          : undefined
        : undefined;

      const routeResult: AvailableRoute = {
        routeId: route.id,
        routeName: route.name,
        routeCode: route.code,
        colorIndex: route.colorIndex,
        scheduleId: schedule.id,
        departureTime: schedule.departureTime,
        estimatedArrival,
        originalArrival,
        delayMinutes,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plateNumber,
        driverName: finalDriverName,
        driverStatus,
        availableSeats: Math.max(0, availableSeats),
        isBoardable,
        boarded,
        blockReasons,
        requiresEscort,
        isTempStop: !!tempStop,
        stopCurrentCount: stopCapacity?.currentCount,
        stopMaxCapacity: stopCapacity?.maxCapacity,
        rollCallStatus,
        hasAbnormalSwipe: !!abnormalSwipe,
        abnormalReason: abnormalSwipe?.description,
        tempArrangement: activeTempArrangements.find((ta) => ta.studentIds?.includes(student.id)),
        transferHint,
        boardingHints,
        invisibilityReasons: invisibilityReasons.length > 0 ? invisibilityReasons : undefined,
      };

      if (isBoardable) {
        availableRoutes.push(routeResult);
      } else {
        blockedRoutes.push(routeResult);
      }
    }

    availableRoutes.sort((a, b) => {
      const minsA = minutesBetween(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }), a.estimatedArrival);
      const minsB = minutesBetween(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }), b.estimatedArrival);
      return Math.abs(minsA) - Math.abs(minsB);
    });

    if (stopClosure?.alternativeStopId) {
      const altStop = stops.find((s) => s.id === stopClosure.alternativeStopId);
      if (altStop) {
        steps.push({
          id: uid("step_"),
          name: "换乘建议",
          description: "站点封闭时提供换乘建议",
          passed: true,
          data: {
            fromStop: studentStop?.name,
            toStop: altStop.name,
            hint: `请前往 ${altStop.name} 乘车`,
          },
        });
      }
    }

    steps.push({
      id: uid("step_"),
      name: "乘车核验检查",
      description: "检查老师点名、刷卡异常、站点容量等核验信息",
      passed: true,
      data: {
        activeAbnormalRecords: swipeAbnormalRecords.filter((a) => !a.handled && a.swipeTime.startsWith(effectiveDate)).length,
        rollCallDoneCount: teacherRollCalls.filter((r) => r.date === effectiveDate).length,
        tempArrangementsActive: tempArrangements.filter((t) => t.isActive && isDateInRange(effectiveDate, t.startDate, t.endDate)).length,
      },
    });

    steps.push({
      id: uid("step_"),
      name: "可乘线路生成",
      description: "综合所有规则生成可乘线路列表",
      passed: availableRoutes.length > 0,
      reason: availableRoutes.length === 0 ? "没有符合条件的可乘线路" : undefined,
      data: {
        availableCount: availableRoutes.length,
        blockedCount: blockedRoutes.length,
      },
    });

    const transferHints = generateTransferHints(blockedRoutes, availableRoutes, student, stops, gradeRouteRules);

    const systemState = {
      weatherDelays: weatherDelays.filter((w) => w.isActive && isDateInRange(effectiveDate, w.effectiveDate)).length,
      activeDetours: detours.filter((d) => d.isActive && isDateInRange(effectiveDate, d.startDate, d.endDate)).length,
      activeOutages: outages.filter((o) => o.isActive && isDateInRange(effectiveDate, o.startDate, o.endDate)).length,
      stopClosures: stopClosures.filter((c) => c.isActive && isDateInRange(effectiveDate, c.startDate, c.endDate)).length,
      vehicleFaults: vehicles.filter((v) => v.status === "fault").length,
      driverLeaves: driverSchedules.filter((d) => d.date === effectiveDate && d.status === "leave").length,
      tempArrangements: tempArrangements.filter((t) => t.isActive && isDateInRange(effectiveDate, t.startDate, t.endDate)).length,
    };

    return {
      studentId: student.id,
      studentName: student.name,
      availableRoutes,
      blockedRoutes,
      steps,
      generatedAt: new Date().toISOString(),
      systemState,
      transferHints,
    };
  }, [
    student,
    routes,
    stops,
    vehicles,
    schedules,
    drivers,
    detours,
    outages,
    stopClosures,
    weatherDelays,
    gradeRouteRules,
    tempStopRules,
    escortRules,
    parentAuths,
    leaveRecords,
    swipeRecords,
    teacherRollCalls,
    stopCapacities,
    driverSchedules,
    tempArrangements,
    swipeAbnormalRecords,
    dayOfWeek,
  ]);

  const stopArrivals = useMemo<StopArrival[]>(() => {
    const results: StopArrival[] = [];
    const activeSchedules = schedules.filter(
      (s) => s.isActive && s.dayOfWeek.includes(dayOfWeek)
    );

    for (const stop of stops) {
      for (const schedule of activeSchedules) {
        const route = routes.find((r) => r.id === schedule.routeId);
        const vehicle = vehicles.find((v) => v.id === schedule.vehicleId);
        if (!route || !vehicle) continue;

        const stopOrder = getStopOrderInRoute(route, stop.id);
        if (stopOrder < 0) continue;

        const activeDetour = getActiveDetour(route.id, detours);
        if (activeDetour && activeDetour.skippedStopIds.includes(stop.id)) continue;

        const routeOutage = getActiveOutage({ routeId: route.id }, outages);
        const vehicleOutage = getActiveOutage({ vehicleId: vehicle.id }, outages);
        const scheduleOutage = getActiveOutage({ scheduleId: schedule.id }, outages);
        const isOutage = !!routeOutage || !!vehicleOutage || !!scheduleOutage;

        const stopClosure = getActiveStopClosure(stop.id, stopClosures);
        const isClosed = stop.isClosed || !!stopClosure;

        let isShowing = true;
        let hideReason: string | undefined;

        if (isOutage) {
          isShowing = false;
          hideReason = "车辆/线路停运";
        }

        if (vehicle.status === "fault" || vehicle.status === "inspection_expired") {
          isShowing = false;
          hideReason = vehicle.status === "fault" ? "车辆故障" : "车辆年检过期";
        }

        const driverStatus = getDriverScheduleStatus(schedule.driverId, schedule.id, driverSchedules, effectiveDate);
        if (driverStatus === "leave" || driverStatus === "off_duty") {
          const ds = driverSchedules.find(
            (d) => d.driverId === schedule.driverId && d.scheduleId === schedule.id && d.date === effectiveDate
          );
          if (!ds?.replacementDriverId) {
            isShowing = false;
            hideReason = `司机${driverStatus === "leave" ? "请假" : "未到岗"}`;
          }
        }

        let delayMinutes = 0;
        const weatherDelay = getActiveWeatherDelay(weatherDelays, route.id);
        if (weatherDelay) delayMinutes += weatherDelay.delayMinutes;
        if (activeDetour) delayMinutes += activeDetour.addedMinutes;

        const tempStop = getTempStop(schedule.id, stop.id, tempStopRules);
        if (tempStop) delayMinutes += tempStop.duration;

        const baseMinutes = getStopMinutesInRoute(route, stop.id);
        const originalArrival = addMinutes(schedule.departureTime, baseMinutes);
        const estimatedArrival = addMinutes(schedule.departureTime, baseMinutes + delayMinutes);

        const availableSeats = vehicle.capacity - vehicle.currentLoad;

        const stopCapacity = getStopCapacity(stop.id, schedule.id, stopCapacities, effectiveDate);
        const stopRollCalls = teacherRollCalls.filter(
          (r) => r.stopId === stop.id && r.scheduleId === schedule.id && r.date === effectiveDate
        );
        const rollCallPresent = stopRollCalls.filter((r) => r.status === "present").length;
        const rollCallAbsent = stopRollCalls.filter((r) => r.status === "absent").length;

        let transferHint: string | undefined;
        if (isClosed && stopClosure?.alternativeStopId) {
          const altStop = stops.find((s) => s.id === stopClosure.alternativeStopId);
          transferHint = `站点封闭，请前往 ${altStop?.name || "替代站点"} 乘车`;
        } else if (activeDetour) {
          const altStops = activeDetour.alternativeStopIds
            .map((id) => stops.find((s) => s.id === id)?.name)
            .filter(Boolean)
            .join("、");
          if (altStops) {
            transferHint = `线路绕行，改经 ${altStops}`;
          }
        }

        const boardingHints: BoardingHint[] = [];
        const nowTs = new Date().toISOString();

        if (weatherDelay) {
          boardingHints.push({
            id: `hint_weather_${stop.id}_${schedule.id}`,
            studentId: "",
            scheduleId: schedule.id,
            routeId: route.id,
            type: "info",
            message: `${weatherDelay.weatherType === "rain" ? "降雨" : weatherDelay.weatherType === "snow" ? "降雪" : weatherDelay.weatherType === "fog" ? "大雾" : weatherDelay.weatherType === "storm" ? "暴雨" : "高温"}影响，预计延误${weatherDelay.delayMinutes}分钟`,
            timestamp: nowTs,
          });
        }

        if (activeDetour) {
          boardingHints.push({
            id: `hint_detour_${stop.id}_${schedule.id}`,
            studentId: "",
            scheduleId: schedule.id,
            routeId: route.id,
            type: "warning",
            message: `线路绕行：${activeDetour.reason}，增加行程${activeDetour.addedMinutes}分钟`,
            timestamp: nowTs,
          });
        }

        if (stopCapacity) {
          if (stopCapacity.currentCount >= stopCapacity.maxCapacity) {
            boardingHints.push({
              id: `hint_cap_full_${stop.id}_${schedule.id}`,
              studentId: "",
              scheduleId: schedule.id,
              routeId: route.id,
              type: "error",
              message: `站点已满员（${stopCapacity.currentCount}/${stopCapacity.maxCapacity}），建议后续班次`,
              timestamp: nowTs,
            });
          } else if (stopCapacity.currentCount >= stopCapacity.maxCapacity * 0.8) {
            boardingHints.push({
              id: `hint_cap_warn_${stop.id}_${schedule.id}`,
              studentId: "",
              scheduleId: schedule.id,
              routeId: route.id,
              type: "warning",
              message: `站点候车人数较多（${stopCapacity.currentCount}/${stopCapacity.maxCapacity}），请有序候车`,
              timestamp: nowTs,
            });
          }
        }

        if (rollCallAbsent > 0) {
          boardingHints.push({
            id: `hint_rollcall_${stop.id}_${schedule.id}`,
            studentId: "",
            scheduleId: schedule.id,
            routeId: route.id,
            type: "warning",
            message: `点名情况：已到${rollCallPresent}人，未到${rollCallAbsent}人，未到同学请联系老师`,
            timestamp: nowTs,
          });
        }

        if (driverStatus === "replaced") {
          const ds = driverSchedules.find(
            (d) => d.driverId === schedule.driverId && d.scheduleId === schedule.id && d.date === effectiveDate
          );
          boardingHints.push({
            id: `hint_driver_${stop.id}_${schedule.id}`,
            studentId: "",
            scheduleId: schedule.id,
            routeId: route.id,
            type: "warning",
            message: `司机代班：${ds?.notes || "原司机请假，已安排代班"}`,
            timestamp: nowTs,
          });
        }

        if (vehicle.status === "replacement") {
          boardingHints.push({
            id: `hint_vehicle_${stop.id}_${schedule.id}`,
            studentId: "",
            scheduleId: schedule.id,
            routeId: route.id,
            type: "warning",
            message: `替换车辆：原车辆故障，已启用备用车辆`,
            timestamp: nowTs,
          });
        }

        if (availableSeats === 0) {
          boardingHints.push({
            id: `hint_seats_${stop.id}_${schedule.id}`,
            studentId: "",
            scheduleId: schedule.id,
            routeId: route.id,
            type: "warning",
            message: `车辆已满员，无空余座位`,
            timestamp: nowTs,
          });
        } else if (availableSeats <= 5) {
          boardingHints.push({
            id: `hint_seats_few_${stop.id}_${schedule.id}`,
            studentId: "",
            scheduleId: schedule.id,
            routeId: route.id,
            type: "warning",
            message: `仅剩${availableSeats}个座位，请尽快上车`,
            timestamp: nowTs,
          });
        }

        results.push({
          stopId: stop.id,
          stopName: stop.name,
          routeId: route.id,
          routeName: route.name,
          routeCode: route.code,
          colorIndex: route.colorIndex,
          scheduleId: schedule.id,
          estimatedArrival: isShowing ? estimatedArrival : "--:--",
          originalArrival,
          delayMinutes,
          vehiclePlate: vehicle.plateNumber,
          availableSeats: Math.max(0, availableSeats),
          isShowing,
          hideReason,
          isClosed,
          closureHint: stopClosure?.reason,
          driverStatus,
          stopCurrentCount: stopCapacity?.currentCount,
          stopMaxCapacity: stopCapacity?.maxCapacity,
          rollCallPresent,
          rollCallAbsent,
          transferHint,
          boardingHints: boardingHints.length > 0 ? boardingHints : undefined,
        });
      }
    }

    return results.sort((a, b) => {
      if (!a.isShowing && b.isShowing) return 1;
      if (a.isShowing && !b.isShowing) return -1;
      return minutesBetween(
        new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        a.estimatedArrival
      ) - minutesBetween(
        new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        b.estimatedArrival
      );
    });
  }, [
    routes,
    stops,
    vehicles,
    schedules,
    detours,
    outages,
    stopClosures,
    weatherDelays,
    tempStopRules,
    teacherRollCalls,
    stopCapacities,
    driverSchedules,
    dayOfWeek,
  ]);

  return {
    derivationResult,
    stopArrivals,
  };
}
