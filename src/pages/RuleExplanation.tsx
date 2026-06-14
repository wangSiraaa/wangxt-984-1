import { useState } from "react";
import {
  Scale,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  User,
  Bus,
  Clock,
  MapPin,
  Shield,
  Sun,
  CloudRain,
  GitBranch,
  Users,
  FileText,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";
import { useBusDerivation } from "@/hooks/useBusDerivation";
import { gradeLabel, routeColorClass } from "@/lib/utils";
import type { RuleStep } from "@/types";

export default function RuleExplanation() {
  const {
    students,
    stops,
    routes,
    vehicles,
    drivers,
    schedules,
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
  } = useBusStore();
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const { derivationResult: derivation } = useBusDerivation({
    student: selectedStudent,
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
  });

  const stepIcons: Record<string, typeof User> = {
    "学生身份验证": User,
    "请假检查": Calendar,
    "家长授权检查": Shield,
    "家长授权验证": Shield,
    "站点封闭检查": MapPin,
    "站点开放检查": MapPin,
    "年级线路规则": Users,
    "车辆停运检查": Bus,
    "线路绕行检查": GitBranch,
    "满员检查": Users,
    "天气延误计算": CloudRain,
    "临时停靠调整": Clock,
    "护送规则检查": Shield,
  };

  const StepCard = ({ step, index }: { step: RuleStep; index: number }) => {
    const Icon = stepIcons[step.name] || Info;
    return (
      <div className="relative">
        {index > 0 && (
          <div className="absolute left-5 -top-3 w-0.5 h-3 bg-ink-200 dark:bg-navy-700" />
        )}
        <div
          className={`glass-card p-5 border-l-4 transition-all ${
            step.passed
              ? "border-l-jade-500"
              : "border-l-crimson-500"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                step.passed
                  ? "bg-jade-100 text-jade-600 dark:bg-jade-900/30 dark:text-jade-400"
                  : "bg-crimson-100 text-crimson-600 dark:bg-crimson-900/30 dark:text-crimson-400"
              }`}
            >
              {step.passed ? (
                <CheckCircle2 size={20} />
              ) : (
                <XCircle size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-base">{step.name}</h3>
                <span className="text-xs text-ink-400">步骤 {index + 1}</span>
              </div>
              <p className="text-sm text-ink-500 mt-1">{step.description}</p>
              {step.reason && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        判定原因
                      </div>
                      <div className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                        {step.reason}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {step.data && Object.keys(step.data).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(step.data).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2.5 py-1 rounded-md text-xs bg-ink-100 dark:bg-navy-800 text-ink-600 dark:text-ink-300"
                    >
                      <span className="text-ink-400 dark:text-ink-500">{key}：</span>
                      <span className="font-medium">{String(value)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl flex items-center gap-3">
            <Scale className="text-purple-500" size={28} />
            规则解释面板
          </h1>
          <p className="text-ink-500 mt-1">
            实时推导学生可乘线路的完整判定流程，每一步都可追溯
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-4">
          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              选择学生
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {students.map((student) => {
                const stop = stops.find((s) => s.id === student.stopId);
                const isSelected = student.id === selectedStudentId;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600"
                        : "bg-ink-50 dark:bg-navy-900/30 border-2 border-transparent hover:bg-ink-100 dark:hover:bg-navy-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-ink-500">
                          {gradeLabel(student.grade)} · {stop?.name}
                        </div>
                      </div>
                      {student.parentAuthorized ? (
                        <Shield size={16} className="text-jade-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedStudent && (
            <div className="glass-card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} className="text-purple-500" />
                学生档案
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">学号</span>
                  <span className="font-mono">{selectedStudent.studentNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">年级班级</span>
                  <span>
                    {gradeLabel(selectedStudent.grade)} {selectedStudent.className}班
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">乘车身份</span>
                  <span>
                    {selectedStudent.identity === "day_student" ? "走读生" : "住校生"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">乘车站点</span>
                  <span>{stops.find((s) => s.id === selectedStudent.stopId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">家长授权</span>
                  <span className={selectedStudent.parentAuthorized ? "text-jade-600" : "text-crimson-600"}>
                    {selectedStudent.parentAuthorized ? "已授权" : "未授权"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">卡号</span>
                  <span className="font-mono">{selectedStudent.cardNumber}</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-jade-500" />
              推导统计
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-jade-50 dark:bg-jade-900/20 text-center">
                <div className="text-2xl font-bold text-jade-600">
                  {derivation.availableRoutes.length}
                </div>
                <div className="text-xs text-ink-500 mt-1">可乘线路</div>
              </div>
              <div className="p-3 rounded-xl bg-crimson-50 dark:bg-crimson-900/20 text-center">
                <div className="text-2xl font-bold text-crimson-600">
                  {derivation.blockedRoutes.length}
                </div>
                <div className="text-xs text-ink-500 mt-1">限制线路</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {derivation.steps.length}
                </div>
                <div className="text-xs text-ink-500 mt-1">判定步骤</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {derivation.steps.filter((s) => !s.passed).length}
                </div>
                <div className="text-xs text-ink-500 mt-1">拦截步骤</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <GitBranch size={20} className="text-purple-500" />
              规则推导流水线
            </h2>
            <div className="space-y-4">
              {derivation.steps.map((step, i) => (
                <StepCard key={step.id} step={step} index={i} />
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Info size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-purple-800 dark:text-purple-300">
                    推导完成
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    共 {derivation.steps.length} 个规则步骤，生成于{" "}
                    {new Date(derivation.generatedAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bus size={20} className="text-blue-500" />
              可乘线路详情
            </h2>
            {derivation.availableRoutes.length === 0 ? (
              <div className="text-center py-12 text-ink-400">
                <XCircle size={48} className="mx-auto mb-3 text-crimson-500 opacity-50" />
                <p>暂无可用线路</p>
                <p className="text-sm mt-1">请查看上方推导步骤了解原因</p>
              </div>
            ) : (
              <div className="space-y-3">
                {derivation.availableRoutes.map((route) => (
                  <div
                    key={`${route.routeId}-${route.scheduleId}`}
                    className="p-4 rounded-xl border border-ink-200 dark:border-navy-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold ${routeColorClass(route.colorIndex)}`}
                        >
                          {route.routeCode}
                        </span>
                        <div>
                          <div className="font-medium">{route.routeName}</div>
                          <div className="text-xs text-ink-500">
                            {route.vehiclePlate} · {route.driverName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-ink-400" />
                          <span className="font-mono text-lg font-bold">
                            {route.estimatedArrival}
                          </span>
                        </div>
                        {route.delayMinutes > 0 && (
                          <div className="text-xs text-amber-600">
                            晚点 {route.delayMinutes} 分钟（原定 {route.originalArrival}）
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-jade-100 text-jade-700 dark:bg-jade-900/30 dark:text-jade-300">
                        余座 {route.availableSeats} 个
                      </span>
                      {route.isTempStop && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          临时停靠
                        </span>
                      )}
                      {route.requiresEscort && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          需护送
                        </span>
                      )}
                      {route.boarded && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          已刷卡
                        </span>
                      )}
                      {route.transferHint && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                          {route.transferHint}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {derivation.blockedRoutes.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-crimson-600">
                <XCircle size={20} />
                不可乘线路及原因
              </h2>
              <div className="space-y-3">
                {derivation.blockedRoutes.map((route) => (
                  <div
                    key={`${route.routeId}-${route.scheduleId}`}
                    className="p-4 rounded-xl border border-crimson-200 dark:border-crimson-800 bg-crimson-50 dark:bg-crimson-950/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold opacity-60 ${routeColorClass(route.colorIndex)}`}
                        >
                          {route.routeCode}
                        </span>
                        <div>
                          <div className="font-medium opacity-70">{route.routeName}</div>
                          <div className="text-xs text-ink-500">
                            {route.vehiclePlate} · {route.driverName}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {route.blockReasons.map((reason, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full text-xs bg-crimson-100 text-crimson-700 dark:bg-crimson-900/30 dark:text-crimson-300"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
