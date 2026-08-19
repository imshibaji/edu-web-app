<?php

namespace App\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;

class RoleStudent
{
    public function handle(Request $request, Closure $next, ...$args)
    {
        $user = User::query()->find(auth()->id());

        if (!$user || $user->role !== User::ROLE_STUDENT) {
            return response()
                ->withFlash('error', ['general' => 'You do not have permission to access this page.'])
                ->redirect('/dashboard', 303);
        }

        return $next($request);
    }
}

class RoleTutor
{
    public function handle(Request $request, Closure $next, ...$args)
    {
        $user = User::query()->find(auth()->id());

        if (!$user || $user->role !== User::ROLE_TUTOR) {
            return response()
                ->withFlash('error', ['general' => 'You do not have permission to access this page.'])
                ->redirect('/dashboard', 303);
        }

        return $next($request);
    }
}

class RoleAdmin
{
    public function handle(Request $request, Closure $next, ...$args)
    {
        $user = User::query()->find(auth()->id());

        if (!$user || $user->role !== User::ROLE_ADMIN) {
            return response()
                ->withFlash('error', ['general' => 'You do not have permission to access this page.'])
                ->redirect('/dashboard', 303);
        }

        return $next($request);
    }
}

class RoleBoth
{
    public function handle(Request $request, Closure $next, ...$args)
    {
        $user = User::query()->find(auth()->id());

        if (!$user || !in_array($user->role, [User::ROLE_STUDENT, User::ROLE_TUTOR])) {
            return response()
                ->withFlash('error', ['general' => 'You do not have permission to access this page.'])
                ->redirect('/dashboard', 303);
        }

        return $next($request);
    }
}