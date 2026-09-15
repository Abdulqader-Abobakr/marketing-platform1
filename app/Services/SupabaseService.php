<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseService
{
    protected string $url;
    protected string $key;

    public function __construct()
    {
        $this->url = config('services.supabase.url');
        $this->key = config('services.supabase.key');
    }

    public function signUp(string $email, string $password, array $profileData)
    {
        return Http::connectTimeout(5)->timeout(15)->withHeaders([
            'apikey' => $this->key,
            'Content-Type' => 'application/json',
        ])->post("{$this->url}/auth/v1/signup", [
            'email' => $email,
            'password' => $password,
            'data' => $profileData,
        ])->json();
    }

    public function signIn(string $email, string $password)
    {
        return Http::connectTimeout(5)->timeout(15)->withHeaders([
            'apikey' => $this->key,
            'Content-Type' => 'application/json',
        ])->post("{$this->url}/auth/v1/token?grant_type=password", [
            'email' => $email,
            'password' => $password,
        ])->json();
    }
}
