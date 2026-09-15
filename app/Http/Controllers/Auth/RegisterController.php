<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientCompany;
use App\Models\Freelancer;
use App\Models\User;
use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RegisterController extends Controller
{
    protected SupabaseService $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }

    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'role' => 'required|in:freelancer,company',
            'name' => 'required_if:role,freelancer|nullable|string|max:255',
            'companyName' => 'required_if:role,company|nullable|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:50',
            'country' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'sector' => 'required|string|max:255',
            'idDocument' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:10240',
            'password' => 'required|min:8|confirmed',
        ]);

        $userName = $validated['name'] ?? $validated['companyName'];
        $databaseRole = $validated['role'] === 'company'
            ? 'client_company'
            : $validated['role'];

        // 1. Create user in Supabase Auth (auth.users)
        $response = $this->supabase->signUp(
            $validated['email'],
            $validated['password'],
            ['role' => $databaseRole, 'user_name' => $userName]
        );

        if (isset($response['error']) || isset($response['error_code']) || empty($response['user']['id'])) {
            return back()->withErrors([
                'email' => $response['error_description'] ?? $response['msg'] ?? 'تعذر إنشاء الحساب.',
            ])->withInput();
        }

        $userId = $response['user']['id'];
        $document = $validated['idDocument'];
        $documentName = Str::uuid() . '.' . $document->getClientOriginalExtension();
        $documentPath = $documentName;

        try {
            $uploaded = Storage::disk('verification-docs')->putFileAs(
                '',
                $document,
                $documentName
            );

            if (! $uploaded) {
                throw new \RuntimeException('Identity document upload failed.');
            }
        } catch (\Throwable $exception) {
            return back()->withErrors([
                'idDocument' => 'تعذر رفع الوثيقة. يرجى المحاولة مرة أخرى.',
            ])->withInput();
        }

        DB::transaction(function () use ($validated, $userId, $userName, $documentPath, $databaseRole) {
            $user = User::updateOrCreate(
                ['id' => $userId],
                [
                    'user_name' => $userName,
                    'email' => $validated['email'],
                    'role' => $databaseRole,
                    'phone_number' => $validated['phone'],
                    'country' => $validated['country'],
                    'city' => $validated['city'],
                    'id_document_path' => $documentPath,
                ]
            );

            if ($validated['role'] === 'freelancer') {
                Freelancer::firstOrCreate(
                    ['user_id' => $user->id],
                    ['marketing_specialties' => [$validated['sector']]]
                );
            } else {
                ClientCompany::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'business_name' => $userName,
                        'industry' => $validated['sector'],
                        'commercial_register_path' => $documentPath,
                    ]
                );
            }
        });

        return redirect('/login');
    }
}