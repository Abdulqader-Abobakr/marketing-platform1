import { useEffect, useState } from 'react';
import { ArrowRight, Bell, Lock, ShieldCheck, Sparkles, UserCog } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function ProfileSettings({ pageTitle, user = {} }) {
    const [notifications, setNotifications] = useState(() => {
        try {
            return localStorage.getItem('company_notifications') !== 'false';
        } catch {
            return true;
        }
    });
    const [twoFactor, setTwoFactor] = useState(() => {
        try {
            return localStorage.getItem('company_two_factor') === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        localStorage.setItem('company_notifications', String(notifications));
    }, [notifications]);

    useEffect(() => {
        localStorage.setItem('company_two_factor', String(twoFactor));
    }, [twoFactor]);

    return (
        <div className="p-8 space-y-8" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{pageTitle || 'الإعدادات'}</h1>
                    <p className="text-slate-500">إدارة إعدادات الحساب والخصوصية.</p>
                </div>
                <Link href="/company" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
                    <ArrowRight size={18} />
                    العودة إلى لوحة التحكم
                </Link>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center gap-2 mb-5">
                        <UserCog size={20} className="text-slate-700" />
                        <h2 className="text-xl font-bold">إعدادات الحساب</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bell className="text-primary" size={18} />
                                    <div>
                                        <p className="font-bold text-slate-800">الإشعارات</p>
                                        <p className="text-xs text-slate-500">استلام تنبيهات الطلبات والعروض</p>
                                    </div>
                                </div>
                                <button type="button" aria-pressed={notifications} aria-label="تبديل الإشعارات" onClick={() => setNotifications(!notifications)} className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-slate-200'}`}>
                                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} style={{ marginTop: '4px' }} />
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="text-primary" size={18} />
                                    <div>
                                        <p className="font-bold text-slate-800">التحقق الثنائي</p>
                                        <p className="text-xs text-slate-500">تفعيل الحماية الإضافية لحسابك</p>
                                    </div>
                                </div>
                                <button type="button" aria-pressed={twoFactor} aria-label="تبديل التحقق الثنائي" onClick={() => setTwoFactor(!twoFactor)} className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${twoFactor ? 'bg-primary' : 'bg-slate-200'}`}>
                                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-1'}`} style={{ marginTop: '4px' }} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center gap-2 mb-5">
                        <Lock size={20} className="text-slate-700" />
                        <h2 className="text-xl font-bold">الأمان</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50">
                            <div>
                                <p className="font-bold text-slate-800">تغيير كلمة المرور</p>
                                <p className="text-xs text-slate-500">قم بتحديث كلمة المرور بانتظام للحفاظ على الأمان.</p>
                            </div>
                            <button type="button" disabled className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed">قريباً</button>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50">
                            <div>
                                <p className="font-bold text-slate-800">حماية البيانات</p>
                                <p className="text-xs text-slate-500">إعدادات الخصوصية للملف الشخصي والوثائق.</p>
                            </div>
                            <button type="button" disabled className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed">قريباً</button>
                        </div>
                    </div>
                </section>

                <section className="bg-linear-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/10 p-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={20} className="text-primary" />
                        <h2 className="text-xl font-bold text-slate-800">نصيحة</h2>
                    </div>
                    <p className="text-sm text-slate-600">يمكنك تحديث بيانات الشركة بانتظام لعرض هوية احترافية واضحة للملاءمة والمشاريع.</p>
                </section>
            </div>
        </div>
    );
}
