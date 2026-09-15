<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show()
    {
        $user = auth()->user();
        $company = $user?->clientCompany;

        return Inertia::render('company_side/Profile', [
            'pageTitle' => 'ملفي الشخصي',
            'user' => [
                'user_name' => $user?->user_name ?? '',
                'email' => $user?->email ?? '',
                'phone_number' => $user?->phone_number ?? '',
                'city' => $user?->city ?? '',
                'country' => $user?->country ?? '',
                'avatar_path' => $user?->avatar_path,
            ],
            'company' => [
                'business_name' => $company?->business_name ?? '',
                'industry' => $company?->industry ?? '',
                'company_description' => $company?->company_description ?? '',
            ],
        ]);
    }

    public function settings()
    {
        $user = auth()->user();
        $company = $user?->clientCompany;

        return Inertia::render('company_side/ProfileSettings', [
            'pageTitle' => 'الإعدادات',
            'user' => [
                'user_name' => $user?->user_name ?? '',
                'email' => $user?->email ?? '',
                'phone_number' => $user?->phone_number ?? '',
                'city' => $user?->city ?? '',
                'country' => $user?->country ?? '',
                'avatar_path' => $user?->avatar_path,
            ],
            'company' => [
                'business_name' => $company?->business_name ?? '',
                'industry' => $company?->industry ?? '',
                'company_description' => $company?->company_description ?? '',
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'user_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone_number' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'company_description' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($request->hasFile('avatar')) {
            $avatarFile = $request->file('avatar');
            $ext = strtolower($avatarFile->getClientOriginalExtension());
            $fileName = "{$user->id}-" . now()->timestamp . ".{$ext}";
            $storagePath = "{$user->id}";

            try {
                $disk = Storage::build([
                    'driver'                  => 's3',
                    'key'                     => env('SUPABASE_KEY'),
                    'secret'                  => env('SUPABASE_SECRET'),
                    'region'                  => env('SUPABASE_REGION', 'eu-central-1'),
                    'bucket'                  => 'avatars',
                    'endpoint'                => env('SUPABASE_ENDPOINT'),
                    'use_path_style_endpoint' => true,
                    'throw'                   => true,
                ]);

                $uploaded = $disk->putFileAs($storagePath, $avatarFile, $fileName);

                if (! $uploaded) {
                    throw new \RuntimeException('لم يتم تأكيد رفع الصورة إلى مخزن الصور.');
                }

                $filePath = "{$storagePath}/{$fileName}";
                $user->avatar_path = rtrim(env('SUPABASE_URL'), '/')
                    . '/storage/v1/object/public/avatars/'
                    . $filePath;
                $user->save();
            } catch (\Exception $e) {
                return back()->withErrors(['avatar' => 'فشل رفع الصورة الشخصية: ' . $e->getMessage()]);
            }
        }

        $user->update([
            'user_name' => $request->user_name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'city' => $request->city,
            'country' => $request->country,
            'avatar_path' => $user->avatar_path,
        ]);

        if ($user->clientCompany) {
            $user->clientCompany()->update([
                'business_name' => $request->business_name ?? $user->clientCompany->business_name,
                'industry' => $request->industry ?? $user->clientCompany->industry,
                'company_description' => $request->company_description ?? $user->clientCompany->company_description,
            ]);
        } else {
            $user->clientCompany()->create([
                'business_name' => $request->business_name ?? $user->user_name,
                'industry' => $request->industry ?? '',
                'company_description' => $request->company_description ?? '',
            ]);
        }

        return redirect()->back()->with('success', 'تم تحديث الملف الشخصي للشركة بنجاح.');
    }
}
