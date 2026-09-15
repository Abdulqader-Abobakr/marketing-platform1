import React, { useMemo } from 'react';
import { Plus, FolderOpen, Clock, CheckCircle2 } from 'lucide-react';

export default function MyProjectsPage({
    projects = [],
    onCreateRequest,
    search = '',
    activeFilter = 'all',
}) {
    const filteredProjects = useMemo(() => {
        const q = search.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesSearch =
                !q ||
                project.title?.toLowerCase().includes(q) ||
                project.client?.toLowerCase().includes(q);

            const matchesFilter =
                activeFilter === 'all' ||
                (activeFilter === 'active' && project.status === 'active') ||
                (activeFilter === 'completed' && project.status === 'completed');

            return matchesSearch && matchesFilter;
        });
    }, [projects, search, activeFilter]);

    const isFiltering = search.trim() !== '' || activeFilter !== 'all';
    const hasAnyProjects = projects.length > 0;

    const activeCount = projects.filter((p) => p.status === 'active').length;
    const completedCount = projects.filter((p) => p.status === 'completed').length;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#28251d]">مشاريعي</h1>
                {onCreateRequest && (
                    <button
                        onClick={onCreateRequest}
                        className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-[#1b62c4] transition-colors shadow-sm cursor-pointer"
                    >
                        <Plus size={18} />
                        مشروع جديد
                    </button>
                )}
            </div>

            {!isFiltering && hasAnyProjects && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <StatusPill
                        icon={<Clock size={18} />}
                        label="مشاريع نشطة"
                        count={activeCount}
                        color="bg-primary/10 text-primary"
                    />
                    <StatusPill
                        icon={<CheckCircle2 size={18} />}
                        label="مشاريع مكتملة"
                        count={completedCount}
                        color="bg-emerald-50 text-emerald-700"
                    />
                </div>
            )}

            {filteredProjects.length > 0 ? (
                <div className="space-y-4">
                    {filteredProjects.map((project) => (
                        <article
                            key={project.id}
                            className="rounded-2xl border border-[#e6e4de] bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-[#28251d]">{project.title}</h2>
                                    <p className="mt-1 text-sm text-[#7a7974]">
                                        العميل: {project.client}
                                    </p>
                                </div>
                                <span
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${project.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-primary/10 text-primary'
                                        }`}
                                >
                                    {project.status === 'completed' ? 'مكتمل' : 'نشط'}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-[#7a7974]">
                    <FolderOpen size={64} className="mb-4 opacity-30" />
                    {hasAnyProjects && isFiltering ? (
                        <>
                            <p className="text-lg">لا توجد مشاريع مطابقة للتصفية</p>
                            <p className="text-sm mt-1">جرّب تغيير البحث أو التصفية.</p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg">لا توجد مشاريع حالياً</p>
                            <p className="text-sm mt-1">
                                ستظهر هنا المشاريع التي يتم الاتفاق عليها مع المستقلين.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

const StatusPill = ({ icon, label, count, color }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e6e4de] bg-white p-4 shadow-sm">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-[#7a7974]">{label}</p>
            <p className="text-lg font-black text-[#28251d]">{count}</p>
        </div>
    </div>
);