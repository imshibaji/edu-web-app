<?php

namespace App\Controllers\Profile;

use App\Models\User;
use App\Models\UserActivity;

class AccountController extends Controller
{
    public function show_update()
    {
        $user = auth()->user();

        $name = null;

        if ($user) {
            $user = User::query()->with('tutorProfile', 'studentProfile')->find($user->id());
            $name = $user?->tutorProfile?->full_name ?? $user?->studentProfile?->full_name;
        }

        response()->inertia('profile/update', [
            'errors' => flash()->display('errors') ?? [],
            'name' => $name,
            'email' => $user?->email ?? null,
            'baseCurrency' => $user?->base_currency ?? \App\Models\Currency::DEFAULT,
        ]);
    }

    public function update()
    {
        $data = request()->validate([
            'email' => 'optional|email',
            'password' => 'optional|min:8',
            'baseCurrency' => 'optional|in<[USD,INR,EUR,GBP,AED,SGD]>',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/settings/profile', 303);
        }

        $auth = auth()->user();

        if (!$auth) {
            return response()->redirect('/auth/login', 303);
        }

        $update = [];

        if (!empty($data['email'])) {
            $update['email'] = $data['email'];
        }

        if (!empty($data['password'])) {
            $update['password_hash'] = $data['password'];
        }

        $success = empty($update) ? true : auth()->update($update);

        if (!$success) {
            return response()
                ->withFlash('errors', auth()->errors())
                ->redirect('/settings/profile', 303);
        }

        if (!empty($data['baseCurrency'])) {
            User::query()
                ->where('id', $auth->id)
                ->update(['base_currency' => $data['baseCurrency']]);
        }

        $user = auth()->user();

        if ($user) {
            UserActivity::log($user->id(), UserActivity::TYPE_ACCOUNT_UPDATED, 'Updated account settings');
        }

        return response()
            ->withFlash('success', 'Account updated.')
            ->redirect('/dashboard', 303);
    }
}
