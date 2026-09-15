import { useState } from 'react';
import ProposalDetailsModal from '../Components/ProposalDetailsModal';
import { Link, router, useForm } from '@inertiajs/react';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  Calendar,
  User,
  Pencil,
  Trash2
} from 'lucide-react';

export default function Proposals({
  negotiations = [],
  directOrders = [],
  sentProposals = []
}) {
  const [activeTab, setActiveTab] = useState('negotiation');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalActionId, setProposalActionId] = useState(null);

  // Form handling for Accepting / Rejecting direct orders using Inertia useForm
  const { post, processing } = useForm({});

  const handleAcceptOrder = (orderId) => {
    post(route('freelancer.orders.accept', orderId));
  };

  const handleRejectOrder = (orderId) => {
    post(route('freelancer.orders.reject', orderId));
  };

  const deleteProposal = (proposalId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    setProposalActionId(proposalId);
    router.delete(`/freelancer/proposals/${proposalId}`, {
      preserveScroll: true,
      onFinish: () => setProposalActionId(null),
    });
  };

  return (
    <div className="p-8 space-y-8" dir="rtl">
      {/* SECTION 1: Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">العروض والطلبات</h1>
        <p className="text-slate-500 max-w-2xl">
          أدر طلبات العملاء، تفاوض على المشاريع، وتابع عروض الأسعار المرسلة.
        </p>
      </header>

      {/* SECTION 2: Tabs Navigation */}
      <div className="flex border-b border-gray-200 mb-8 gap-8 overflow-x-auto whitespace-nowrap">
        <TabButton
          label={`قيد التفاوض (${negotiations.length})`}
          active={activeTab === 'negotiation'}
          onClick={() => setActiveTab('negotiation')}
        />
        <TabButton
          label={`الطلبات المباشرة (${directOrders.length})`}
          active={activeTab === 'direct'}
          onClick={() => setActiveTab('direct')}
        />
        <TabButton
          label={`العروض المرسلة (${sentProposals.length})`}
          active={activeTab === 'sent'}
          onClick={() => setActiveTab('sent')}
        />
      </div>

      {/* SECTION 3: Tab Content Area */}
      <div>
        {/* A. Content for "قيد التفاوض" (Inquiries & Chats) */}
        {activeTab === 'negotiation' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2a7de1] rounded-full"></span>
                قيد التفاوض
              </h2>
            </div>
            {negotiations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {negotiations.map((item) => (
                  <NegotiationCard key={item.id} {...item} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 font-bold">
                لا توجد محادثات قيد التفاوض حالياً.
              </div>
            )}
          </section>
        )}

        {/* B. Content for "الطلبات المباشرة" (Direct Orders) */}
        {activeTab === 'direct' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2a7de1] rounded-full"></span>
                الطلبات المباشرة
              </h2>
              <span className="bg-blue-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                جديد
              </span>
            </div>
            {directOrders.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {directOrders.map((order) => (
                  <DirectOrderCard
                    key={order.id}
                    {...order}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onReject={() => handleRejectOrder(order.id)}
                    processing={processing}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 font-bold">
                لا توجد طلبات مباشرة حالياً.
              </div>
            )}
          </section>
        )}

        {/* C. Content for "العروض المرسلة" (Sent Proposals) */}
        {activeTab === 'sent' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#2a7de1] rounded-full"></span>
                العروض المرسلة مؤخراً
              </h2>
            </div>
            {sentProposals.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                {sentProposals.map((prop) => (
                  <SentProposalRow
                    key={prop.id}
                    {...prop}
                    onViewDetails={() => setSelectedProposal(prop.rawProposal || prop)}
                    onEdit={() => router.visit(`/freelancer/proposals/${prop.id}/edit`)}
                    onDelete={() => deleteProposal(prop.id)}
                    actionProcessing={proposalActionId === prop.id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100 font-bold">
                لم تقم بإرسال عروض حتى الآن.
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modal display for selected proposal details */}
      {selectedProposal && (
        <ProposalDetailsModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
}

// --- Helper Components ---

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${active ? 'text-slate-700 border-[#2a7de1]' : 'text-slate-400 border-transparent hover:text-slate-600'
      }`}
  >
    {label}
  </button>
);

const NegotiationCard = ({ id, client, service, lastMsg, time, status, statusColor, chatId }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
    <div className="flex gap-4 items-start">
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        <User size={24} />
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-bold text-slate-800">{client}</h3>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${statusColor || 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20'}`}>
            {status}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-700 mb-2">{service}</p>
        <p className="text-sm text-slate-500 line-clamp-1">"{lastMsg}"</p>
      </div>
    </div>

    <div className="flex flex-col md:items-end gap-3 shrink-0">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Clock size={14} />
        {time}
      </div>
      <Link
        href={`/chat/${chatId || id}`}
        className="px-5 py-2.5 bg-white border border-gray-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center gap-2"
      >
        <MessageSquare size={16} />
        فتح المحادثة
      </Link>
    </div>
  </div>
);

const DirectOrderCard = ({ client, service, price, delivery, onAccept, onReject, processing }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs text-slate-400 font-bold mb-1">العميل: {client}</p>
        <h3 className="font-bold text-slate-800 text-lg leading-tight max-w-[200px]">{service}</h3>
      </div>
      <div className="text-end shrink-0">
        <p className="text-slate-700 font-black text-2xl leading-none">{price} <span className="text-xs font-bold text-slate-400">ر.ي</span></p>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">الميزانية المقترحة</p>
      </div>
    </div>

    <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 mb-6 flex-1">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-700 shadow-sm shrink-0">
        <Calendar size={20} />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase">تاريخ التسليم المطلوب</p>
        <p className="text-sm font-bold text-slate-700">{delivery}</p>
      </div>
    </div>

    <div className="flex items-center gap-3 pt-2 mt-auto">
      <button
        onClick={onAccept}
        disabled={processing}
        className="flex-1 py-3 bg-[#2a7de1] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#2a7de1]/20 hover:bg-[#1f6fd4] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <CheckCircle2 size={18} />
        قبول وبدء العمل
      </button>
      <button
        onClick={onReject}
        disabled={processing}
        className="px-5 py-3 bg-white border border-gray-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
      >
        <XCircle size={18} />
        رفض
      </button>
    </div>
  </div>
);

const SentProposalRow = ({ client, title, amount, date, status, statusType, onViewDetails, onEdit, onDelete, actionProcessing }) => {
  const statusStyles = {
    pending: 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20',
    accepted: 'bg-green-50 text-green-600 border-green-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors group">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-slate-700 transition-colors truncate">{title}</h3>
          <p className="text-sm text-slate-500">العميل: {client}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 shrink-0">
          <div className="text-center">
            <p className="text-sm text-slate-600 font-bold mb-1">{date}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">تاريخ الإرسال</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-slate-800">{amount} <span className="text-xs font-bold text-slate-400">ر.ي</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">القيمة الإجمالية</p>
          </div>
          <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${statusStyles[statusType] || statusStyles.pending}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails && onViewDetails();
          }}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-700 transition-colors"
        >
          عرض التفاصيل
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        </button>

        <div className="flex items-center gap-2">
          {statusType === 'pending' && (
            <>
              <button
                type="button"
                onClick={onEdit}
                disabled={actionProcessing}
                title="تعديل العرض"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:opacity-50"
              >
                <Pencil size={15} />
                تعديل
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={actionProcessing}
                title="حذف العرض"
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={15} />
                {actionProcessing ? 'جاري الحذف...' : 'حذف'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
