<?php

namespace App\Controllers\Auth;

use App\Models\UserActivity;

class LoginController extends Controller
{
    public function show()
    {
        $form = flash()->display('form') ?? [];

        response()->inertia('auth/login', array_merge($form, [
            'errors' => flash()->display('error') ?? [],
        ]));
    }

    public function store()
    {
        $data = request()->validate([
            'email' => 'email',
            'password' => 'min:8',
        ]);

        if (!$data) {
            response()
                ->withFlash('form', request()->body())
                ->withFlash('error', request()->errors())
                ->redirect('/auth/login', 303);
        }

        $data['password_hash'] = $data['password'];
        unset($data['password']);

        $success = auth()->login($data);

        if (!$success) {
            response()
                ->withFlash('form', request()->body())
                ->withFlash('error', request()->errors())
                ->redirect('/auth/login', 303);
        }

        UserActivity::log(auth()->id(), UserActivity::TYPE_LOGIN, 'Signed in');

        response()->redirect('/dashboard', 303);
    }

    public function logout()
    {
        $user = auth()->user();

        if ($user) {
            UserActivity::log($user->id(), UserActivity::TYPE_LOGOUT, 'Signed out');
        }

        auth()->logout('/');
    }
}
