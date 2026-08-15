<?php

namespace App\Controllers;

use App\Models\User;

/**
 * This is the base controller for your Leaf MVC Project.
 * You can initialize packages or define methods here to use
 * them across all your other controllers which extend this one.
 */
class Controller extends \Leaf\Controller
{
    /**
     * Resolve the authenticated user as a full Eloquent model.
     *
     * auth()->user() returns a Leaf\Auth\User wrapper whose __call()
     * never throws and always returns a truthy object, so role checks
     * (isTutor/isAdmin) must run against the real model instead.
     */
    protected function authUser(): ?User
    {
        $auth = auth()->user();

        if (!$auth || !$auth->id()) {
            return null;
        }

        return User::query()->find($auth->id());
    }
}
