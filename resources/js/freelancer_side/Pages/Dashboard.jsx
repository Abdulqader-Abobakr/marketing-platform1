import React from 'react';
import { Link } from '@inertiajs/react';
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Send
} from 'lucide-react';

export default function Dashboard({
  auth,
  statsData = {},
  openBriefs = []
}) {
  // Dynamic statistics mapping with YER currency
  const stats = [
    {
      label: 'المشاريع النشطة',
      value: statsData.activeProjects ?? '0',
      icon: <Clock className="text-slate-700" size={24} />,
      change: 'حالي'
    },
    {
      label: 'الأرباح هذا الشهر',
      value: `${statsData.monthlyEarnings ?? '0'} ر.ي`,
      icon: <TrendingUp className="text-slate-700" size={24} />,
      change: statsData.earningsChange ?? '↑ 0%',
      highlight: true
    },
    {
      label: 'التقييم العام',
      value: statsData.rating ?? '5.0',
      icon: <Award className="text-slate-700" size={24} />,
      change: 'من 5.0'
    },
    {
      label: 'نسبة الإنجاز',
      value: `${statsData.completionRate ?? '100'}%`,
      icon: <CheckCircle2 className="text-slate-700" size={24} />,
      change: 'ممتاز'
    },
  ];

  const userName = auth?.user?.user_name || 'المستقل';

  return (
    <div className="p-8 space-y-8" dir="rtl">

      {/* Welcome Banner */}
      <div className="bg-linear-to-br from-primary via-primary/80 to-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً {userName}، إليك ملخص نشاطك اليوم.</h1>
            <p className="text-white/80">
              لديك {statsData.unreadMessagesCount ?? 0} رسائل جديدة ومشروع واحد يتطلب تسليماً قريباً.
            </p>
          </div>
          <Link
            href="/freelancer/projects"
            className="bg-white text-slate-700 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors shrink-0 flex items-center gap-2"
          >
            عرض المهام العاجلة ←
          </Link>
        </div>
        {/* Abstract Background Elements */}
        <div className="absolute top-0 inset-s-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <TrendingUp className="absolute bottom-4 inset-s-8 text-white/10 w-32 h-32 -scale-x-100 rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.highlight ? 'bg-primary/10 text-slate-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-black bg-linear-to-r from-primary to-primary bg-clip-text text-transparent mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">فرص متاحة لك</h2>
          <span className="text-sm text-gray-500">{openBriefs.length} طلب</span>
        </div>
        {openBriefs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {openBriefs.map((brief) => (
              <article key={brief.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-800">{brief.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">العميل: {brief.client}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-slate-700">
                    {brief.category}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">{brief.description}</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-400">{brief.createdAt}</p>
                  <Link
                    href={`/freelancer/proposals/create-for-brief/${brief.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1f6fd4]"
                  >
                    إرسال عرض
                    <Send size={14} className="rotate-180" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            لا توجد طلبات متاحة حالياً
          </div>
        )}
      </section>

    </div>
  );
}
