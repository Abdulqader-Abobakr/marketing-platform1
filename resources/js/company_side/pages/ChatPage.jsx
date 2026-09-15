import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export default function ChatPage({ conversation }) {
    const [body, setBody] = useState('');

    const sendMessage = (event) => {
        event.preventDefault();
        if (!body.trim() || !conversation?.id) return;

        router.post(`/company/conversations/${conversation.id}/messages`, { body }, {
            preserveScroll: true,
            onSuccess: () => setBody(''),
        });
    };

    if (!conversation) {
        return <div className="rounded-2xl bg-white p-8 text-center text-[#7a7974]">اختر مناقشة من أحد العروض لبدء المحادثة.</div>;
    }

    return (
        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#e6e4de] bg-white shadow-sm" dir="rtl">
            <header className="border-b border-[#e6e4de] bg-[#fcfbf9] p-5">
                <h1 className="text-xl font-bold text-[#28251d]">مناقشة العرض</h1>
                <p className="mt-1 text-sm text-[#7a7974]">{conversation.freelancer} · {conversation.subject}</p>
            </header>
            <div className="min-h-80 space-y-3 p-5">
                {conversation.messages?.length > 0 ? conversation.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.mine ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.mine ? 'bg-primary text-white' : 'bg-[#f7f6f2] text-[#28251d]'}`}>
                            <p className="mb-1 text-[10px] font-bold opacity-70">{message.sender}</p>
                            {message.body}
                        </div>
                    </div>
                )) : <p className="text-center text-sm text-[#7a7974]">لا توجد رسائل بعد.</p>}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#e6e4de] p-4">
                <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="اكتب رسالتك..." className="min-w-0 flex-1 rounded-xl border border-[#d4d1ca] px-4 py-3 text-sm outline-none focus:border-primary" />
                <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-[#1b62c4]">إرسال</button>
            </form>
        </div>
    );
}
