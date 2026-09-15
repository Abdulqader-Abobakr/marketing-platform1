<?php

namespace App\Http\Controllers\Freelancer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function settings()
    {
        $user = auth()->user();

        return Inertia::render('freelancer/ProfileSettings', [
            'pageTitle' => 'الإعدادات',
            'user' => [
                'user_name' => $user->user_name ?? '',
                'email' => $user->email ?? '',
            ],
        ]);
    }

    public function show()
    {
        $user       = auth()->user();
        $freelancer = $user->freelancer;

        $avatarUrl = $user->avatar_path; // avatar_path now stores the full public URL

        return Inertia::render('freelancer/Profile', [
            'pageTitle'  => 'ملفي',
            'user'       => [
                'user_name'    => $user->user_name ?? '',
                'email'        => $user->email ?? '',
                'phone_number' => $user->phone_number ?? '',
                'city'         => $user->city ?? '',
                'avatar_path'  => $avatarUrl,
            ],
            'freelancer' => [
                // job_title and bio now exist as real DB columns on sila_p.freelancers
                'job_title'              => $freelancer?->job_title ?? '',
                'bio'                    => $freelancer?->bio ?? '',
                'marketing_specialties'  => $freelancer?->marketing_specialties ?? [],
                'experienced_sectors'    => $freelancer?->experienced_sectors ?? [],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'user_name'              => 'required|string|max:255',
            'email'                  => [
                'required',
                'email',
                'max:255',
                Rule::unique(
                    ($user->getConnectionName() ?: config('database.default')) . '.' . $user->getTable(),
                    'email'
                )->ignore($user->getKey(), $user->getKeyName()),
            ],
            'phone_number'           => 'nullable|string|max:50',
            'city'                   => 'nullable|string|max:255',
            'job_title'              => 'nullable|string|max:255',
            'bio'                    => 'nullable|string',
            'marketing_specialties'  => 'nullable|array',
            'marketing_specialties.*' => 'string',
            'experienced_sectors'    => 'nullable|array',
            'experienced_sectors.*'  => 'string',
            'avatar'                 => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Handle avatar upload to Supabase 'avatars' bucket
        if ($request->hasFile('avatar')) {
            $avatarFile = $request->file('avatar');
            $ext = strtolower($avatarFile->getClientOriginalExtension());
            $fileName = "{$user->id}-" . now()->timestamp . ".{$ext}";
            $storagePath = "{$user->id}"; // Store in a folder named after the user ID

            try {
                $disk = Storage::build([
                    'driver'                  => 's3',
                    'key'                     => env('SUPABASE_KEY'),
                    'secret'                  => env('SUPABASE_SECRET'),
                    'region'                  => env('SUPABASE_REGION', 'eu-central-1'),
                    'bucket'                  => 'avatars',
                    'endpoint'                => env('SUPABASE_ENDPOINT'),
                    'use_path_style_endpoint' => true,
                ]);

                $disk->putFileAs($storagePath, $avatarFile, $fileName);
                
                $filePath = "{$storagePath}/{$fileName}";
                $publicUrl = rtrim(env('SUPABASE_URL'), '/')
                    . '/storage/v1/object/public/avatars/'
                    . $filePath;

                $user->avatar_path = $publicUrl;
            } catch (\Exception $e) {
                return back()->withErrors(['avatar' => 'فشل رفع الصورة الشخصية: ' . $e->getMessage()]);
            }
        }

        $user->update([
            'user_name'    => $validated['user_name'],
            'email'        => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'city'         => $validated['city'] ?? null,
            'avatar_path'  => $user->avatar_path,
        ]);

        // Create the freelancer profile record if it doesn't exist yet
        $freelancer = $user->freelancer;
        if (! $freelancer) {
            $freelancer = $user->freelancer()->create();
        }

        $freelancer->update([
            'job_title'             => $validated['job_title'] ?? null,
            'bio'                   => $validated['bio'] ?? null,
            'marketing_specialties' => $validated['marketing_specialties'] ?? [],
            'experienced_sectors'   => $validated['experienced_sectors'] ?? [],
        ]);

        return redirect()->back()->with('success', 'تم تحديث الملف الشخصي بنجاح.');
    }
}
