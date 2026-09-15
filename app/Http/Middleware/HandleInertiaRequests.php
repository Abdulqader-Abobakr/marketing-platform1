<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $clientCompany = $user?->role === 'client_company'
            ? $user->clientCompany
            : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only([
                        'id',
                        'user_name',
                        'email',
                        'role',
                        'avatar_path',
                        'account_state',
                    ]),
                    [
                        'client_company' => $clientCompany ? $clientCompany->only([
                            'id',
                            'user_id',
                            'business_name',
                            'industry',
                            'company_description',
                            'commercial_register_path',
                        ]) : null,
                    ]
                ) : null,
            ],
            'pageTitle' => null,
            // Flash messages — available as usePage().props.flash in React
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
        ];
    }
}
