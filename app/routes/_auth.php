<?php

use App\Models\User;

auth()->middleware('auth.required', function () {
    response()->redirect('/auth/login');
});

auth()->middleware('auth.guest', function () {
    response()->redirect('/dashboard');
});

app()->registerMiddleware('role.student', function () {
    $user = User::query()->find(auth()->id());
    if (!$user || $user->role !== User::ROLE_STUDENT) {
        response()->redirect('/dashboard');
    }
});

app()->registerMiddleware('role.tutor', function () {
    $user = User::query()->find(auth()->id());
    if (!$user || $user->role !== User::ROLE_TUTOR) {
        response()->redirect('/dashboard');
    }
});

app()->registerMiddleware('role.admin', function () {
    $user = User::query()->find(auth()->id());
    if (!$user || $user->role !== User::ROLE_ADMIN) {
        response()->redirect('/dashboard');
    }
});

app()->registerMiddleware('role.both', function () {
    $user = User::query()->find(auth()->id());
    if (!$user || !in_array($user->role, [User::ROLE_STUDENT, User::ROLE_TUTOR])) {
        response()->redirect('/dashboard');
    }
});

app()->group('/auth', [
    'middleware' => 'auth.guest',
    function () {
        app()->get('/login', 'Auth\LoginController@show');
        app()->post('/login', 'Auth\LoginController@store');
        app()->get('/register', 'Auth\RegisterController@show');
        app()->post('/register', 'Auth\RegisterController@store');
        app()->get('/forgot-password', 'Auth\ForgotPasswordController@show');
        app()->post('/forgot-password', 'Auth\ForgotPasswordController@store');
        app()->get('/reset-password/{token}', 'Auth\ResetPasswordController@show');
        app()->post('/reset-password', 'Auth\ResetPasswordController@store');
        app()->get('/social/{provider}', 'Auth\SocialAuthController@redirect');
        app()->get('/social/{provider}/callback', 'Auth\SocialAuthController@callback');
    },
]);

app()->post('/auth/logout', [
    'middleware' => 'auth.required',
    'Auth\LoginController@logout'
]);

app()->group('/dashboard', [
    'middleware' => ['auth.required'],
    function () {
        app()->get('/', 'Auth\DashboardController@index');
    },
]);

app()->group('/student', [
    'middleware' => ['auth.required', 'role.student'],
    function () {
        app()->get('/', 'Auth\DashboardController@index');
    },
]);

app()->group('/tutor', [
    'middleware' => ['auth.required', 'role.tutor'],
    function () {
        app()->get('/', 'TutorController@index');
        app()->get('/availability', 'TutorController@availability');
        app()->get('/enquiries', 'TutorController@enquiries');
        app()->get('/subjects', 'TutorController@subjects');
        app()->post('/subjects', 'TutorController@addSubject');
        app()->post('/subjects/propose', 'TutorController@proposeSubject');
        app()->post('/subjects/update', 'TutorController@updateSubject');
        app()->post('/subjects/remove', 'TutorController@removeSubject');
        app()->post('/slots', 'TutorController@addSlot');
        app()->post('/slots/delete', 'TutorController@deleteSlot');
        app()->get('/profile', 'TutorController@editProfile');
        app()->post('/profile', 'TutorController@updateProfile');
        app()->get('/connect', 'PaymentController@connect');
    },
]);

app()->group('/admin', [
    'middleware' => ['auth.required', 'role.admin'],
    function () {
        app()->get('/reviews', 'Auth\admin\ReviewsController@reviews');
        app()->post('/reviews/approve', 'Auth\admin\ReviewsController@approve');
        app()->post('/reviews/reject', 'Auth\admin\ReviewsController@reject');
        app()->get('/activities', 'Auth\admin\ActivitiesController@index');
        app()->get('/users', 'Auth\admin\UsersController@index');
        app()->post('/users/toggle', 'Auth\admin\UsersController@toggle');
        app()->get('/tutors', 'Auth\admin\TutorsController@index');
        app()->post('/tutors/verify', 'Auth\admin\TutorsController@verify');
        app()->get('/students', 'Auth\admin\StudentsController@index');
        app()->get('/subjects', 'Auth\admin\SubjectsController@index');
        app()->post('/subjects/create', 'Auth\admin\SubjectsController@create');
        app()->post('/subjects/update', 'Auth\admin\SubjectsController@update');
        app()->post('/subjects/delete', 'Auth\admin\SubjectsController@delete');
        app()->post('/subjects/approve', 'Auth\admin\SubjectsController@approve');
        app()->post('/subjects/reject', 'Auth\admin\SubjectsController@reject');
        app()->get('/payments', 'Auth\admin\PaymentsController@index');
        app()->get('/payment-settings', 'Auth\admin\AdminPaymentSettingsController@index');
        app()->post('/payment-settings', 'Auth\admin\AdminPaymentSettingsController@update');
        app()->get('/payouts', 'Auth\admin\AdminPayoutController@index');
        app()->post('/payouts/release', 'Auth\admin\AdminPayoutController@release');
        app()->post('/payouts/schedule', 'Auth\admin\AdminPayoutController@schedule');
        app()->get('/payouts/history', 'Auth\admin\AdminPayoutController@payoutHistory');
        app()->get('/currencies', 'Auth\admin\CurrenciesController@index');
        app()->post('/currencies', 'Auth\admin\CurrenciesController@update');
        app()->post('/currencies/add', 'Auth\admin\CurrenciesController@add');
        app()->post('/currencies/remove', 'Auth\admin\CurrenciesController@remove');
        app()->post('/currencies/base', 'Auth\admin\CurrenciesController@setBase');
    },
]);

app()->group('/settings', function () {
    app()->get('/profile', 'Profile\AccountController@show_update');
    app()->patch('/profile', 'Profile\AccountController@update');
});

app()->group('/lessons', [
    'middleware' => ['auth.required', 'role.both'],
    function () {
        app()->get('/', 'LessonController@index');
        app()->get('/{id}', 'LessonController@show');
        app()->post('/{id}/complete', 'LessonController@complete');
        app()->post('/{id}/cancel', 'LessonController@cancel');
    },
]);

app()->group('/messages', [
    'middleware' => ['auth.required', 'role.both'],
    function () {
        app()->get('/', 'MessageController@index');
        app()->post('/start', 'MessageController@start');
        app()->get('/{id}', 'MessageController@show');
        app()->post('/{id}', 'MessageController@store');
    },
]);

app()->group('/notifications', [
    'middleware' => ['auth.required', 'role.both'],
    function () {
        app()->get('/', 'NotificationController@index');
        app()->post('/read-all', 'NotificationController@markAllRead');
        app()->post('/{id}/read', 'NotificationController@markRead');
        app()->get('/unread-count', 'NotificationController@unreadCount');
    },
]);

app()->post('/lessons/{id}/review', [
    'middleware' => ['auth.required', 'role.both'],
    'ReviewController@store',
]);
app()->get('/reviews/tutor/{id}', 'ReviewController@forTutor');
app()->get('/lessons/{id}/review-check', [
    'middleware' => ['auth.required', 'role.both'],
    'ReviewController@check',
]);
