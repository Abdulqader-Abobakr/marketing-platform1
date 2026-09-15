<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\Conversation;
use App\Models\Brief;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProposalController extends Controller
{
    /**
     * Display listing of freelancer proposals, direct orders, and active negotiations.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));

        // 1. Negotiations / Inquiries (Chats)
        $negotiations = Conversation::query()
            ->where('freelancer_id', $user->id)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('subject', 'ilike', "%{$search}%")
                        ->orWhereHas('client', fn ($client) => $client->where('user_name', 'ilike', "%{$search}%"));
                });
            })
            ->with(['client', 'latestMessage'])
            ->latest('updated_at')
            ->get()
            ->map(function ($chat) {
                return [
                    'id'          => $chat->id,
                    'chatId'      => $chat->id,
                    // Fixed: user_name instead of name
                    'client'      => $chat->client?->user_name ?? 'عميل',
                    'service'     => $chat->subject ?? 'تفاوض حول مشروع',
                    'lastMsg'     => $chat->latestMessage?->body ?? 'لا توجد رسائل بعد',
                    'time'        => $chat->updated_at ? $chat->updated_at->diffForHumans() : 'الآن',
                    // Fixed: unread_count column now exists on conversations
                    'status'      => ($chat->unread_count ?? 0) > 0 ? 'بانتظار ردك' : 'بانتظار العميل',
                    'statusColor' => ($chat->unread_count ?? 0) > 0
                        ? 'bg-[#ffb548]/10 text-slate-700 border-[#ffb548]/20'
                        : 'bg-slate-100 text-slate-500 border-slate-200',
                ];
            });

        // 2. Direct Orders (projects with status=inquiry assigned to this freelancer)
        $directOrders = Project::query()
            ->where('freelancer_id', $user->id)
            ->where('status', 'inquiry')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'ilike', "%{$search}%")
                        ->orWhereHas('client', fn ($client) => $client->where('user_name', 'ilike', "%{$search}%"));
                });
            })
            ->with('client')
            ->latest()
            ->get()
            ->map(function ($order) {
                return [
                    'id'       => $order->id,
                    // Fixed: user_name instead of name
                    'client'   => $order->client?->user_name ?? 'عميل جديد',
                    'service'  => $order->title,
                    'price'    => number_format($order->price ?? 0),
                    'delivery' => $order->delivery_date
                        ? $order->delivery_date->format('d F Y')
                        : 'بعد 5 أيام',
                ];
            });

        // 3. Sent Proposals
        $sentProposals = Proposal::query()
            ->where('freelancer_id', $user->id)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'ilike', "%{$search}%")
                        ->orWhereHas('brief', function ($brief) use ($search) {
                            $brief->where('title', 'ilike', "%{$search}%")
                                ->orWhereHas('client', fn ($client) => $client->where('user_name', 'ilike', "%{$search}%"));
                        })
                        ->orWhereHas('project', function ($project) use ($search) {
                            $project->where('title', 'ilike', "%{$search}%")
                                ->orWhereHas('client', fn ($client) => $client->where('user_name', 'ilike', "%{$search}%"));
                        });
                });
            })
            ->with(['project.client', 'brief.client', 'milestones'])
            ->latest()
            ->get()
            ->map(function ($proposal) {
                $statusType = match ($proposal->status) {
                    'accepted' => 'accepted',
                    'rejected' => 'rejected',
                    default    => 'pending',
                };
                $statusLabel = match ($proposal->status) {
                    'accepted' => 'مقبول',
                    'rejected' => 'مرفوض',
                    default    => 'قيد المراجعة',
                };

                return [
                    'id'         => $proposal->id,
                    // Fixed: user_name instead of name
                    'client'     => $proposal->client?->user_name ?? 'عميل',
                    'title'      => $proposal->title,
                    'amount'     => number_format($proposal->price ?? 0),
                    'date'       => $proposal->created_at
                        ? $proposal->created_at->format('d F')
                        : 'اليوم',
                    'status'     => $statusLabel,
                    'statusType' => $statusType,
                    'rawProposal' => [
                        'id'              => (string) $proposal->id,
                        'title'           => $proposal->title,
                        'totalPrice'      => number_format($proposal->price ?? 0),
                        'revisions'       => $proposal->revision_limit
                            ? "{$proposal->revision_limit} تعديلات"
                            : 'غير محدد',
                        'timeline'        => $proposal->timeline ?? 'أسبوعين',
                        'validity'        => $proposal->validity ?? '7 أيام',
                        'additionalTerms' => $proposal->additional_terms ?? null,
                        'milestones'      => $proposal->milestones->map(fn($item) => [
                            'id'          => (string) $item->id,
                            'title'       => $item->title,
                            'description' => $item->description,
                        ]),
                    ],
                ];
            });

        return Inertia::render('freelancer/Proposals', [
            'negotiations' => $negotiations,
            'directOrders' => $directOrders,
            'sentProposals' => $sentProposals,
        ]);
    }

    /**
     * Accept a direct order.
     */
    public function acceptOrder(Request $request, $id)
    {
        $project = Project::where('freelancer_id', $request->user()->id)
            ->findOrFail($id);

        $project->update(['status' => 'active']);

        return redirect()->back()->with('success', 'تم قبول الطلب وبدء العمل بنجاح.');
    }

    /**
     * Reject a direct order.
     */
    public function rejectOrder(Request $request, $id)
    {
        $project = Project::where('freelancer_id', $request->user()->id)
            ->findOrFail($id);

        $project->update(['status' => 'canceled']);

        return redirect()->back()->with('success', 'تم رفض الطلب.');
    }

    public function edit(Request $request, string $id)
    {
        $proposal = $this->pendingProposal($request, $id)->load(['brief.client', 'milestones']);
        $chatId = $proposal->brief?->conversations()
            ->where('freelancer_id', $request->user()->id)
            ->value('id');

        return Inertia::render('freelancer/CreateProposal', [
            'chatId' => $chatId,
            'clientName' => $proposal->brief?->client?->user_name ?? 'عميل',
            'clientRequest' => $proposal->brief?->title ?? 'طلب غير محدد',
            'proposalId' => (string) $proposal->id,
            'initialData' => [
                'title' => $proposal->title ?? '',
                'price' => (string) $proposal->price,
                'timeline' => $proposal->timeline ?? '',
                'revision_limit' => (string) $proposal->revision_limit,
                'validity' => $proposal->validity ?? '',
                'additional_terms' => $proposal->additional_terms ?? '',
                'milestones' => $proposal->milestones->map(fn ($milestone) => [
                    'id' => (string) $milestone->id,
                    'title' => $milestone->title,
                    'description' => $milestone->description ?? '',
                ])->values(),
            ],
        ]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $proposal = $this->pendingProposal($request, $id);
        $validated = $this->validatedProposal($request);

        DB::transaction(function () use ($proposal, $validated) {
            $proposal->update([
                'title' => $validated['title'],
                'price' => $validated['price'],
                'timeline' => $validated['timeline'],
                'revision_limit' => $validated['revision_limit'],
                'validity' => $validated['validity'],
                'additional_terms' => $validated['additional_terms'] ?? null,
            ]);
            $proposal->milestones()->delete();
            $this->createMilestones($proposal, $validated['milestones']);
        });

        return redirect()->route('freelancer.proposals')->with('success', 'تم تحديث العرض بنجاح.');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $proposal = $this->pendingProposal($request, $id);

        DB::transaction(function () use ($proposal) {
            $proposal->milestones()->delete();
            $proposal->delete();
        });

        return redirect()->route('freelancer.proposals')->with('success', 'تم حذف العرض بنجاح.');
    }

    /**
     * Show the proposal creation form for a specific conversation.
     */
    public function create(Request $request, $chatId)
    {
        $user = $request->user();
        $chat = Conversation::with('client')->findOrFail($chatId);

        abort_if($chat->freelancer_id !== $user->id, 403);

        return Inertia::render('freelancer/CreateProposal', [
            'chatId'        => $chatId,
            // Fixed: user_name instead of name
            'clientName'    => $chat->client?->user_name ?? 'عميل',
            'clientRequest' => $chat->subject ?? 'طلب غير محدد',
        ]);
    }

    /**
     * Start a conversation for an open brief before creating a proposal.
     */
    public function createForBrief(Request $request, $briefId)
    {
        $user = $request->user();
        $brief = Brief::findOrFail($briefId);

        abort_unless(
            $brief->status === 'open'
                && ($brief->targeted_freelancer_id === null || $brief->targeted_freelancer_id === $user->id),
            403
        );

        $chat = Conversation::firstOrCreate(
            [
                'brief_id' => $brief->id,
                'client_id' => $brief->client_id,
                'freelancer_id' => $user->id,
            ],
            [
                'subject' => $brief->title,
                'unread_count' => 0,
            ]
        );

        return redirect()->route('freelancer.proposals.create', $chat->id);
    }

    /**
     * Store a newly submitted proposal.
     */
    public function store(Request $request, $chatId)
    {
        $user = $request->user();
        $chat = Conversation::findOrFail($chatId);

        abort_if($chat->freelancer_id !== $user->id, 403);

        $request->validate([
            'title'                        => 'required|string|max:255',
            'price'                        => 'required|numeric|min:1',
            'timeline'                     => 'required|string|max:100',
            'revision_limit'               => 'required|integer',
            'validity'                     => 'required|string|max:100',
            'additional_terms'             => 'nullable|string',
            'milestones'                   => 'required|array|min:1',
            'milestones.*.title'           => 'required|string|max:255',
            'milestones.*.description'     => 'required|string',
        ]);

        $proposal = Proposal::create([
            'freelancer_id'    => $user->id,
            'brief_id'         => $chat->brief_id ?? null,
            'title'            => $request->title,
            'price'            => $request->price,
            'timeline'         => $request->timeline,
            'revision_limit'   => $request->revision_limit,
            'validity'         => $request->validity,
            'additional_terms' => $request->additional_terms,
            'status'           => 'pending',
        ]);

        $totalAmountCents = (int) round(((float) $request->price) * 100);
        $milestoneCount = count($request->milestones);
        $baseAmountCents = intdiv($totalAmountCents, $milestoneCount);

        foreach ($request->milestones as $milestoneIndex => $milestone) {
            $milestoneAmountCents = $milestoneIndex === $milestoneCount - 1
                ? $totalAmountCents - ($baseAmountCents * ($milestoneCount - 1))
                : $baseAmountCents;

            $proposal->milestones()->create([
                'title'       => $milestone['title'],
                'description' => $milestone['description'],
                'amount'      => number_format($milestoneAmountCents / 100, 2, '.', ''),
                'status'      => 'pending',
            ]);
        }

        return redirect()->route('freelancer.proposals')
            ->with('success', 'تم إرسال العرض للعميل بنجاح!');
    }

    private function pendingProposal(Request $request, string $id): Proposal
    {
        $proposal = Proposal::query()
            ->whereKey($id)
            ->where('freelancer_id', $request->user()->id)
            ->with('brief')
            ->firstOrFail();

        abort_if($proposal->status !== 'pending', 403, 'لا يمكن تعديل أو حذف عرض تمت مراجعته.');

        return $proposal;
    }

    private function validatedProposal(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:1',
            'timeline' => 'required|string|max:100',
            'revision_limit' => 'required|integer',
            'validity' => 'required|string|max:100',
            'additional_terms' => 'nullable|string',
            'milestones' => 'required|array|min:1',
            'milestones.*.title' => 'required|string|max:255',
            'milestones.*.description' => 'required|string',
        ]);
    }

    private function createMilestones(Proposal $proposal, array $milestones): void
    {
        $totalAmountCents = (int) round(((float) $proposal->price) * 100);
        $milestoneCount = count($milestones);
        $baseAmountCents = intdiv($totalAmountCents, $milestoneCount);

        foreach ($milestones as $milestoneIndex => $milestone) {
            $milestoneAmountCents = $milestoneIndex === $milestoneCount - 1
                ? $totalAmountCents - ($baseAmountCents * ($milestoneCount - 1))
                : $baseAmountCents;

            $proposal->milestones()->create([
                'title' => $milestone['title'],
                'description' => $milestone['description'],
                'amount' => number_format($milestoneAmountCents / 100, 2, '.', ''),
                'status' => 'pending',
            ]);
        }
    }
}
