<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LoginController extends Controller
{
    protected SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function create()
    {
        return Inertia::render('Auth/Login');
    }

   public function store(Request $request)
{
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $email = strtolower(trim($credentials['email']));

    $response = $this->supabase->signIn(
        $email,
        $credentials['password']
    );

    if (isset($response['error']) || isset($response['error_code']) || empty($response['user']['id'])) {
        Log::warning('Supabase login failed', [
            'email' => $email,
            'error_code' => $response['error_code'] ?? null,
            'error' => $response['error'] ?? null,
        ]);

        $errorCode = $response['error_code'] ?? $response['error'] ?? null;

        $message = $errorCode === 'email_not_confirmed'
            ? 'يرجى تأكيد بريدك الإلكتروني أولاً.'
            : ($errorCode === 'invalid_grant'
                ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة في Supabase.'
                : 'تعذر تسجيل الدخول. تحقق من إعدادات حسابك وحاول مرة أخرى.');

        return back()->withErrors(['email' => $message])->withInput();
    }

    $supabaseUser = $response['user'];
    $user = User::find($supabaseUser['id']);

    if (! $user) {
        Log::error('Supabase user has no local profile', [
            'supabase_user_id' => $supabaseUser['id'],
            'email' => $email,
        ]);

        return back()->withErrors([
            'email' => 'لم يكتمل إعداد هذا الحساب. يرجى التواصل مع الدعم.',
        ])->withInput();
    }

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();
    session(['supabase_token' => $response['access_token'] ?? null]);

    $role = $user->role;

    $destination = $role === 'freelancer' ? '/freelancer' : '/company';

    return redirect($destination)
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
}

    public function destroy()
    {
        Auth::logout();
        session()->forget('supabase_token');
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect('/login')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }
}