<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Transaction;
use App\Models\Brief;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Render the Freelancer Dashboard view with real-time statistics and project activities.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));

        // 1. Statistics
        $activeProjectsCount = Project::where('freelancer_id', $user->id)
            ->where('status', 'active')
            ->count();

        // Fixed: sum real earnings from verified transactions instead of hardcoded value.
        // Transactions tied to this freelancer's projects where payment is verified.
        $monthlyEarnings = Transaction::query()
            ->whereHas('project', fn($q) => $q->where('freelancer_id', $user->id))
            ->where('verification_status', 'verified')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $statsData = [
            'activeProjects'      => (string) $activeProjectsCount,
            'monthlyEarnings'     => number_format((float) $monthlyEarnings),
            'earningsChange'      => '↑ 0%',   // TODO: compare with previous month
            'rating'              => '4.8',     // TODO: from reviews table when implemented
            'completionRate'      => '95',      // TODO: from project completion rate
            'unreadMessagesCount' => 0,         // TODO: sum conversations.unread_count
        ];

        $openBriefs = Brief::query()
            ->where('status', 'open')
            ->where(function ($query) use ($user) {
                $query->whereNull('targeted_freelancer_id')
                    ->orWhere('targeted_freelancer_id', $user->id);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'ilike', "%{$search}%")
                        ->orWhere('description', 'ilike', "%{$search}%")
                        ->orWhereHas('client', fn ($client) => $client->where('user_name', 'ilike', "%{$search}%"));
                });
            })
            ->with('client:id,user_name')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (Brief $brief) => [
                'id' => (string) $brief->id,
                'title' => $brief->title,
                'category' => $brief->category,
                'description' => $brief->description,
                'client' => $brief->client?->user_name ?? 'عميل',
                'createdAt' => $brief->created_at?->diffForHumans(),
            ]);

        return Inertia::render('freelancer/Dashboard', [
            'statsData' => $statsData,
            'openBriefs' => $openBriefs,
        ]);
    }
}
