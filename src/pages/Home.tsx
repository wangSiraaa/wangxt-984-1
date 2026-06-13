import { Link } from "react-router-dom";
import {
  Route,
  Bus,
  User,
  MapPin,
  Settings,
  MonitorPlay,
  History,
  BookOpen,
  AlertTriangle,
  LayoutDashboard,
  Users,
  Wrench,
  Shield,
} from "lucide-react";
import { useBusStore } from "@/stores/busStore";

interface NavCard {
  title: string;
  description: string;
  icon: typeof Route;
  path: string;
  color: string;
  gradient: string;
}

export default function Home() {
  const { routes, vehicles, students, drivers, stops, darkMode, setDarkMode } = useBusStore();

  const navCards: NavCard[] = [
    {
      title: "调度中心",
      description: "线路、站点、车辆、班次统一调度管理",
      icon: LayoutDashboard,
      path: "/dispatcher",
      color: "navy",
      gradient: "from-navy-500 to-navy-600",
    },
    {
      title: "站点牌大屏",
      description: "实时到站信息大屏展示",
      icon: MonitorPlay,
      path: "/stop-display",
      color: "jade",
      gradient: "from-jade-500 to-jade-600",
    },
    {
      title: "学生视图",
      description: "学生查看可乘线路与到站预估",
      icon: Users,
      path: "/student",
      color: "amber",
      gradient: "from-amber-500 to-amber-600",
    },
    {
      title: "老师配置",
      description: "低年级线路、临时停靠、护送规则",
      icon: BookOpen,
      path: "/teacher",
      color: "crimson",
      gradient: "from-crimson-500 to-crimson-600",
    },
    {
      title: "车辆管理",
      description: "车辆状态、故障、替换车管理",
      icon: Bus,
      path: "/vehicle-manager",
      color: "navy",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "司机看板",
      description: "司机排班、驾驶证有效期、车辆年检",
      icon: User,
      path: "/driver-dashboard",
      color: "jade",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "线路模拟器",
      description: "模拟车辆运行、到站预测演示",
      icon: Route,
      path: "/simulator",
      color: "amber",
      gradient: "from-orange-500 to-orange-600",
    },
    {
      title: "应急调度",
      description: "紧急绕行、停运、临时调度",
      icon: AlertTriangle,
      path: "/emergency",
      color: "crimson",
      gradient: "from-red-500 to-red-600",
    },
    {
      title: "规则解释",
      description: "可乘规则推导过程与原因说明",
      icon: Shield,
      path: "/rules",
      color: "navy",
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: "历史回放",
      description: "操作历史记录与时间线回放",
      icon: History,
      path: "/history",
      color: "jade",
      gradient: "from-teal-500 to-teal-600",
    },
  ];

  const stats = [
    { label: "运营线路", value: routes.filter((r) => r.isActive).length, icon: Route },
    { label: "运营站点", value: stops.filter((s) => !s.isClosed).length, icon: MapPin },
    { label: "在校车辆", value: vehicles.length, icon: Bus },
    { label: "注册学生", value: students.length, icon: Users },
    { label: "在岗司机", value: drivers.filter((d) => d.status === "on_duty").length, icon: User },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-ink-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950" />
      <div className="absolute inset-0 bg-grid-slate opacity-40" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-navy-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <header className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center shadow-glow">
              <Bus size={32} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="font-display text-4xl font-bold tracking-tight text-navy-900 dark:text-white">
                校园校车智能调度系统
              </h1>
              <p className="text-ink-500 dark:text-ink-400 mt-1">
                站点牌 · 线路调度 · 学生可乘规则一体化平台
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn-secondary text-sm"
            >
              <Settings size={16} />
              {darkMode ? "浅色模式" : "深色模式"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-5 gap-4 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card p-5 text-center animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                  <Icon size={20} className="text-navy-600 dark:text-navy-300" />
                </div>
                <div className="text-3xl font-bold text-navy-700 dark:text-navy-200">
                  {stat.value}
                </div>
                <div className="text-sm text-ink-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-4">
          {navCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.path}
                to={card.path}
                className="group relative glass-card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${(idx + 5) * 60}ms` }}
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`}
                />
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg mb-4`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg text-navy-900 dark:text-white mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-4 flex items-center text-navy-600 dark:text-navy-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  进入系统
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6">
          <div className="glass-card p-6 col-span-2">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-amber-500" />
              系统演示场景
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "车辆故障换车", desc: "V003发动机故障，V007替换车自动接管" },
                { title: "满员隐藏上车", desc: "V002满员，学生视图隐藏刷卡按钮" },
                { title: "低年级限制", desc: "一年级仅可乘坐3号低年级专线" },
                { title: "站点封闭换乘", desc: "体育馆站施工封闭，提示前往实验楼站" },
                { title: "天气延误", desc: "降雨天气，全线预计延误8分钟" },
                { title: "刷卡异常", desc: "家长未授权学生刷卡触发异常提醒" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-ink-50 dark:bg-navy-800/50 border border-ink-100 dark:border-navy-700"
                >
                  <div className="font-medium text-sm text-navy-700 dark:text-navy-200">
                    {item.title}
                  </div>
                  <div className="text-xs text-ink-500 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Shield size={20} className="text-jade-500" />
              实时规则推导
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">学生年级</span>
                <span className="font-medium">1-6年级分级</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">家长授权</span>
                <span className="font-medium">线路级授权</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">车辆容量</span>
                <span className="font-medium">实时载客计算</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">站点状态</span>
                <span className="font-medium">封闭/开放联动</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">绕行影响</span>
                <span className="font-medium">多站点时间偏移</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">老师规则</span>
                <span className="font-medium">可乘/护送配置</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-ink-400">
          <p>校园校车智能调度系统 · 演示版本 · 本地数据存储</p>
        </footer>
      </div>
    </div>
  );
}
