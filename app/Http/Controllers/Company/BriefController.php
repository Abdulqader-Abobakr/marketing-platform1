<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Brief;
use App\Models\Freelancer;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BriefController extends Controller
{
    public function index(Request $request): Response
    {
        $requests = Brief::query()
            ->where('client_id', $request->user()->id)
            ->withCount('proposals')
            ->with([
                'targetedFreelancer:id,user_name',
                'proposals.freelancer:id,user_name',
                'proposals.milestones:id,proposal_id,title,description,amount,status',
            ])
            ->latest()
            ->get()
            ->map(fn (Brief $brief) => [
                'id' => (string) $brief->id,
                'title' => $brief->title,
                'category' => $brief->category,
                'providerType' => $brief->provider_type,
                'description' => $brief->description,
                'status' => $brief->status,
                'proposalsCount' => $brief->proposals_count,
                'targetedFreelancer' => $brief->targetedFreelancer?->user_name,
                'targetedFreelancerId' => $brief->targeted_freelancer_id,
                'createdAt' => $brief->created_at?->toISOString(),
                'proposals' => $brief->proposals->map(fn ($proposal) => [
                    'id' => (string) $proposal->id,
                    'freelancerName' => $proposal->freelancer?->user_name ?? 'مستقل',
                    'title' => $proposal->title,
                    'price' => (float) $proposal->price,
                    'revision_limit' => $proposal->revision_limit,
                    'timeline' => $proposal->timeline,
                    'validity' => $proposal->validity,
                    'additional_terms' => $proposal->additional_terms,
                    'status' => $proposal->status,
                    'milestones' => $proposal->milestones->map(fn ($milestone) => [
                        'id' => (string) $milestone->id,
                        'title' => $milestone->title,
                        'description' => $milestone->description,
                        'amount' => (float) $milestone->amount,
                        'status' => $milestone->status,
                    ]),
                ]),
            ]);

        return Inertia::render('company_side/App', [
            'requests' => $requests,
            'conversation' => $this->conversationData($request),
            'freelancers' => User::query()
                ->where('role', 'freelancer')
                ->orderBy('user_name')
                ->get(['id', 'user_name']),
            'exploreFreelancers' => Freelancer::query()
                ->with([
                    'user:id,user_name,avatar_path',
                    'portfolios:id,freelancer_id,title,marketing_domain',
                ])
                ->whereHas('user', fn ($query) => $query->where('role', 'freelancer'))
                ->latest()
                ->get()
                ->map(fn (Freelancer $freelancer) => [
                    'id' => (string) $freelancer->user_id,
                    'name' => $freelancer->user?->user_name ?? 'مستقل',
                    'avatar' => $freelancer->user?->avatar_path,
                    'jobTitle' => $freelancer->job_title,
                    'bio' => $freelancer->bio,
                    'industries' => array_values(array_unique(array_merge(
                        $freelancer->experienced_sectors ?? [],
                        $freelancer->marketing_specialties ?? [],
                    ))),
                    'portfolio' => $freelancer->portfolios->first()?->title,
                ]),
        ]);
    }

    private function conversationData(Request $request): ?array
    {
        $conversationId = $request->query('conversation');

        if (! $conversationId) {
            return null;
        }

        $conversation = \App\Models\Conversation::query()
            ->where('client_id', $request->user()->id)
            ->with(['freelancer:id,user_name', 'messages.sender:id,user_name'])
            ->findOrFail($conversationId);

        return [
            'id' => (string) $conversation->id,
            'subject' => $conversation->subject,
            'freelancer' => $conversation->freelancer?->user_name ?? 'المستقل',
            'messages' => $conversation->messages->map(fn ($message) => [
                'id' => (string) $message->id,
                'body' => $message->body,
                'sender' => $message->sender?->user_name ?? 'مستخدم',
                'mine' => $message->sender_id === $request->user()->id,
            ]),
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:marketing_services,graphic_design_branding,web_mobile_development,social_media_management,business_consulting,market_research,business_plan_preparation,digital_marketing,branding,dev,analytics,content'],
            'provider_type' => ['required', 'in:public,specific'],
            'targeted_freelancer_id' => ['nullable', 'uuid', 'exists:users,id'],
            'description' => ['required', 'string', 'max:10000'],
        ]);

        if ($validated['provider_type'] === 'specific') {
            $targetedFreelancer = User::query()
                ->whereKey($validated['targeted_freelancer_id'] ?? null)
                ->where('role', 'freelancer')
                ->exists();

            abort_unless($targetedFreelancer, 422, 'يرجى اختيار مستقل صحيح.');
        } else {
            $validated['targeted_freelancer_id'] = null;
        }

        Brief::create([
            'client_id' => $request->user()->id,
            'targeted_freelancer_id' => $validated['targeted_freelancer_id'],
            'title' => $validated['title'],
            'category' => $validated['category'],
            'provider_type' => $validated['provider_type'],
            'description' => $validated['description'],
            'status' => 'open',
        ]);

        return redirect()->route('company.dashboard');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $brief = Brief::where('client_id', $request->user()->id)->findOrFail($id);

        abort_if($brief->proposals()->exists(), 403, 'لا يمكن تعديل الطلب بعد تلقي عروض.');

        $validated = $this->validatedBrief($request);
        $brief->update($this->briefData($validated));

        return redirect()->route('company.dashboard');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $brief = Brief::where('client_id', $request->user()->id)->findOrFail($id);
        $brief->delete();

        return redirect()->route('company.dashboard');
    }

    private function validatedBrief(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:marketing_services,graphic_design_branding,web_mobile_development,social_media_management,business_consulting,market_research,business_plan_preparation,digital_marketing,branding,dev,analytics,content'],
            'provider_type' => ['required', 'in:public,specific'],
            'targeted_freelancer_id' => ['nullable', 'uuid', 'exists:users,id'],
            'description' => ['required', 'string', 'max:10000'],
        ]);

        if ($validated['provider_type'] === 'specific') {
            abort_unless(
                User::whereKey($validated['targeted_freelancer_id'] ?? null)
                    ->where('role', 'freelancer')
                    ->exists(),
                422,
                'يرجى اختيار مستقل صحيح.'
            );
        } else {
            $validated['targeted_freelancer_id'] = null;
        }

        return $validated;
    }

    private function briefData(array $validated): array
    {
        return [
            'targeted_freelancer_id' => $validated['targeted_freelancer_id'],
            'title' => $validated['title'],
            'category' => $validated['category'],
            'provider_type' => $validated['provider_type'],
            'description' => $validated['description'],
        ];
    }
}
