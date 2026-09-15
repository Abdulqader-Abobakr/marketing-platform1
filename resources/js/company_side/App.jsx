import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/NavItem';
import Header from './components/Header.jsx';
import ExplorePage from './pages/ExplorePage';
import MyRequestsPage from './pages/MyRequestsPage';
import MyProjectsPage from './pages/MyProjectsPage';
import ChatPage from './pages/ChatPage';
import { router } from '@inertiajs/react';

// 👇 official list — same as the old code
const defaultIndustries = [
    'خدمات التسويق',
    'التصميم الجرافيكي والهوية البصرية',
    'تطوير المواقع وتطبيقات الجوال',
    'إدارة وسائل التواصل الاجتماعي',
    'الاستشارات التجارية',
    'أبحاث السوق',
    'إعداد خطط الأعمال',
];

export default function App({
    requests = [],
    freelancers = [],
    exploreFreelancers = [],
    projects = [],
    conversation = null,
}) {
    const [activePage, setActivePage] = useState(conversation ? 'chat' : 'explore');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => router.on('start', () => setIsNavigating(true)), []);
    useEffect(() => router.on('finish', () => setIsNavigating(false)), []);
    useEffect(() => {
        if (conversation) setActivePage('chat');
    }, [conversation]);

    useEffect(() => {
        setActiveFilter('all');
        setSearch('');
    }, [activePage]);

    const pagePlaceholders = {
        explore: 'ابحث عن مستقل أو تخصص أو خبرة...',
        requests: 'ابحث في الطلبات أو الوصف أو الفئة...',
        projects: 'ابحث في المشاريع أو العملاء...',
        chat: 'ابحث في الرسائل أو المرسل...',
    };

    const searchPlaceholder = pagePlaceholders[activePage] || pagePlaceholders.explore;

    const pageTitle = activePage === 'requests' ? 'طلباتي'
        : activePage === 'projects' ? 'مشاريعي'
            : activePage === 'chat' ? 'المحادثات'
                : 'استكشف الباقات والخدمات';

    // 👇 same logic as the old ExplorePage filter
    const industryOptions = useMemo(() => {
        const merged = [
            ...defaultIndustries,
            ...exploreFreelancers.flatMap((f) => f.industries || []),
        ];

        return [
            { value: 'all', label: 'الكل' },
            ...[...new Set(merged)].map((industry) => ({
                value: industry,
                label: industry,
            })),
        ];
    }, [exploreFreelancers]);

    const pageFilters = {
        explore: {
            label: 'المجال',
            options: industryOptions,
        },
        requests: {
            label: 'الحالة',
            options: [
                { value: 'all', label: 'الكل' },
                { value: 'open', label: 'مفتوح' },
                { value: 'with_proposals', label: 'لديه عروض' },
                { value: 'no_proposals', label: 'بدون عروض' },
            ],
        },
        projects: {
            label: 'الحالة',
            options: [
                { value: 'all', label: 'الكل' },
                { value: 'active', label: 'نشط' },
                { value: 'completed', label: 'مكتمل' },
            ],
        },
        chat: {
            label: 'الترتيب',
            options: [
                { value: 'all', label: 'الأحدث' },
                { value: 'unread', label: 'غير مقروءة' },
            ],
        },
    };

    const currentFilter = pageFilters[activePage] || pageFilters.explore;

    const handleSearch = (event) => {
        event.preventDefault();
        setSearch(search.trim());
    };

    const submitRequest = (request, requestId, onSuccess) => {
        const category = {
            'خدمات التسويق': 'marketing_services',
            'التصميم الجرافيكي والهوية البصرية': 'graphic_design_branding',
            'تطوير المواقع وتطبيقات الجوال': 'web_mobile_development',
            'إدارة وسائل التواصل الاجتماعي': 'social_media_management',
            'الاستشارات التجارية': 'business_consulting',
            'أبحاث السوق': 'market_research',
            'إعداد خطط الأعمال': 'business_plan_preparation',
            'تسويق رقمي': 'digital_marketing',
            'تصميم': 'branding',
            'تطوير': 'dev',
            'تحليلات': 'analytics',
            'كتابة محتوى': 'content',
        }[request.category] ?? request.category;
        const options = { onSuccess };
        const payload = {
            title: request.title,
            category,
            provider_type: request.providerType === 'specific' ? 'specific' : 'public',
            targeted_freelancer_id: request.targetedFreelancerId,
            description: request.description,
        };

        if (requestId) {
            router.put(`/company/briefs/${requestId}`, payload, options);
        } else {
            router.post('/company/briefs', payload, options);
        }
    };

    return (
        <div dir="rtl" className="flex h-screen bg-gray-50 font-sans">
            {isNavigating && <div className="fixed inset-x-0 top-0 z-100 h-0.5 bg-[#ffb548] animate-pulse" />}
            <Sidebar activePage={activePage} onPageChange={setActivePage} isSidebarOpen={isSidebarOpen} />

            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <Header
                    pageTitle={pageTitle}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    search={search}
                    setSearch={setSearch}
                    searchPlaceholder={searchPlaceholder}
                    onSearchSubmit={handleSearch}
                    filterLabel={currentFilter.label}
                    filterOptions={currentFilter.options}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />

                <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
                    {activePage === 'requests' && (
                        <MyRequestsPage
                            requests={requests}
                            freelancers={freelancers}
                            onSubmit={submitRequest}
                            onDelete={(requestId) => router.delete(`/company/briefs/${requestId}`)}
                            search={search}
                            activeFilter={activeFilter}
                        />
                    )}
                    {activePage === 'projects' && (
                        <MyProjectsPage
                            projects={projects}
                            search={search}
                            activeFilter={activeFilter}
                        />
                    )}
                    {activePage === 'chat' && (
                        <ChatPage
                            conversation={conversation}
                            search={search}
                            activeFilter={activeFilter}
                        />
                    )}
                    {activePage === 'explore' && (
                        <ExplorePage
                            freelancers={exploreFreelancers}
                            onSubmit={submitRequest}
                            search={search}
                            activeFilter={activeFilter}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}