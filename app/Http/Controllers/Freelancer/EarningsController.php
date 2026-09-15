<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Transaction;
use App\Models\WithdrawalRequest;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EarningsController extends Controller
{
    public function index()
    {
        $user       = auth()->user();
        $wallet     = $user->wallet;

        // ─── Fix #3: Cache project IDs ONCE → all subsequent queries use
        //     a fast WHERE IN (...) instead of 4× correlated EXISTS subqueries.
        // ─── Fix #4: withdrawal_requests.freelancer_id FK points to users.id,
        //     so we always use $user->id, never $freelancer->id.
        $projectIds = Project::where('freelancer_id', $user->id)
            ->pluck('id');

        // ── Wallet balances ───────────────────────────────────────────────
        $walletData = [
            'available_balance'       => (float) ($wallet?->available_balance ?? 0),
            'pending_balance'         => (float) ($wallet?->pending_balance ?? 0),
            // Fix #3: whereIn instead of whereHas — single fast query
            'total_lifetime_earnings' => (float) Transaction::whereIn('project_id', $projectIds)
                ->where('verification_status', 'verified')
                ->sum('amount'),
        ];

        // ── Transaction log ───────────────────────────────────────────────
        $transactions = [];

        // 1. Real project payments (incoming earnings)
        // Fix #3: whereIn replaces whereHas
        $projectPayments = Transaction::whereIn('project_id', $projectIds)
            ->where('verification_status', 'verified')
            ->with([
                'project:id,title,client_id',
                'project.client:id,user_name',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($projectPayments as $tx) {
            $transactions[] = [
                'id'         => $tx->id,
                'date'       => $tx->created_at->format('d M Y'),
                'desc'       => $tx->project?->title ?? 'مشروع',
                'client'     => $tx->project?->client?->user_name ?? '-',
                'amount'     => '+' . number_format($tx->amount, 0) . ' ر.ي',
                'status'     => 'تم الاستلام',
                'statusType' => 'success',
            ];
        }

        // 2. Withdrawal requests (outgoing)
        // Fix #4: use $user->id — FK points to users.id, not freelancers.id
        $withdrawals = WithdrawalRequest::where('freelancer_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($withdrawals as $w) {
            $statusType = match ($w->status) {
                'approved' => 'success',
                'pending'  => 'pending',
                default    => 'withdrawn',
            };
            $statusName = match ($w->status) {
                'approved' => 'تم التحويل',
                'pending'  => 'قيد المراجعة',
                'rejected' => 'مرفوض',
                default    => $w->status,
            };

            $transactions[] = [
                'id'         => $w->id,
                'date'       => $w->created_at->format('d M Y'),
                'desc'       => 'سحب رصيد (' . $w->method . ')',
                'client'     => '-',
                'amount'     => '-' . number_format($w->amount, 0) . ' ر.ي',
                'status'     => $statusName,
                'statusType' => $statusType,
            ];
        }

        // Sort combined list by date descending
        usort($transactions, fn($a, $b) => strcmp($b['date'], $a['date']));

        // ── Chart data ────────────────────────────────────────────────────
        // Fix #3: single whereIn for monthly chart — no subquery
        $monthlyData = Transaction::whereIn('project_id', $projectIds)
            ->where('verification_status', 'verified')
            ->whereYear('created_at', now()->year)
            ->selectRaw("TO_CHAR(created_at, 'MM') as month_num, SUM(amount) as total")
            ->groupByRaw("TO_CHAR(created_at, 'MM')")
            ->orderByRaw("TO_CHAR(created_at, 'MM')")
            ->pluck('total', 'month_num')
            ->toArray();

        $monthNames = [
            '01' => 'يناير', '02' => 'فبراير', '03' => 'مارس',
            '04' => 'أبريل', '05' => 'مايو',   '06' => 'يونيو',
            '07' => 'يوليو', '08' => 'أغسطس',  '09' => 'سبتمبر',
            '10' => 'أكتوبر','11' => 'نوفمبر', '12' => 'ديسمبر',
        ];

        $chartMonthly = array_map(
            fn($num, $name) => ['name' => $name, 'value' => (float) ($monthlyData[$num] ?? 0)],
            array_keys($monthNames),
            array_values($monthNames)
        );

        // Fix #3: single whereIn for daily chart — no subquery
        $dailyData = Transaction::whereIn('project_id', $projectIds)
            ->where('verification_status', 'verified')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->selectRaw("EXTRACT(DAY FROM created_at)::int as day_num, SUM(amount) as total")
            ->groupByRaw("EXTRACT(DAY FROM created_at)::int")
            ->orderByRaw("EXTRACT(DAY FROM created_at)::int")
            ->pluck('total', 'day_num')
            ->toArray();

        $daysInMonth = now()->daysInMonth;
        $chartDaily  = array_map(
            fn($day) => ['name' => (string) $day, 'value' => (float) ($dailyData[$day] ?? 0)],
            range(1, $daysInMonth)
        );

        return Inertia::render('freelancer/Earnings', [
            'pageTitle'    => 'الأرباح',
            'wallet'       => $walletData,
            'transactions' => array_values($transactions),
            'chartData'    => [
                'monthly' => $chartMonthly,
                'daily'   => $chartDaily,
            ],
        ]);
    }

    public function withdraw(Request $request)
    {
        $request->validate([
            'amount'  => 'required|numeric|min:1',
            'method'  => 'required|string|in:bank,jeeb,local',
            'details' => 'required|array',
        ]);

        $user   = auth()->user();
        $wallet = $user->wallet;

        if (! $wallet || $wallet->available_balance < $request->amount) {
            return redirect()->back()->withErrors([
                'amount' => 'الرصيد المتاح غير كافٍ لإتمام عملية السحب.',
            ]);
        }

        $wallet->decrement('available_balance', $request->amount);

        // Fix #4: freelancer_id FK points to users.id — use $user->id
        WithdrawalRequest::create([
            'freelancer_id' => $user->id,
            'amount'        => $request->amount,
            'method'        => $request->method,
            'details'       => $request->details,
            'status'        => 'pending',
        ]);

        return redirect()->back()->with('success', 'تم إرسال طلب السحب بنجاح، وهو قيد المراجعة.');
    }
}
