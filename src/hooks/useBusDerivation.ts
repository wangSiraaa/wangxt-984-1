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
        driverName: driver.name,
        availableSeats: Math.max(0, availableSeats),
        isBoardable,
        boarded,
        blockReasons,
        requiresEscort,
        isTempStop: !!tempStop,
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
      name: "可乘线路生成",
      description: "综合所有规则生成可乘线路列表",
      passed: availableRoutes.length > 0,
      reason: availableRoutes.length === 0 ? "没有符合条件的可乘线路" : undefined,
      data: {
        availableCount: availableRoutes.length,
        blockedCount: blockedRoutes.length,
      },
    });

    return {
      studentId: student.id,
      studentName: student.name,
      availableRoutes,
      blockedRoutes,
      steps,
      generatedAt: new Date().toISOString(),
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
    dayOfWeek,
  ]);

  return {
    derivationResult,
    stopArrivals,
  };
}
