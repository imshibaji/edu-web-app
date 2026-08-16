<?php

auth()->middleware('auth.required', function () {
    response()->redirect('/auth/login');
});

auth()->middleware('auth.guest', function () {
    response()->redirect('/dashboard');
});

app()->group('/auth', [
    'middleware' => 'auth.guest',
    function () {
        app()->get('/login', 'Auth\LoginController@show');
        app()->post('/login', 'Auth\LoginController@store');
        app()->get('/register', 'Auth\RegisterController@show');
        app()->post('/register', 'Auth\RegisterController@store');
    },
]);

app()->post('/auth/logout', [
    'middleware' => 'auth.required',
    'Auth\LoginController@logout'
]);

app()->group('/dashboard', [
    'middleware' => 'auth.required',
    function () {
        app()->get('/', 'Auth\DashboardController@index');
    },
]);

app()->group('/tutor', [
    'middleware' => 'auth.required',
    function () {
        app()->get('/', 'TutorController@index');
        app()->get('/availability', 'TutorController@availability');
        app()->get('/enquiries', 'TutorController@enquiries');
        app()->get('/subjects', 'TutorController@subjects');
        app()->post('/subjects', 'TutorController@addSubject');
        app()->post('/subjects/update', 'TutorController@updateSubject');
        app()->post('/subjects/remove', 'TutorController@removeSubject');
        app()->post('/slots', 'TutorController@addSlot');
        app()->post('/slots/delete', 'TutorController@deleteSlot');
        app()->get('/profile', 'TutorController@editProfile');
        app()->post('/profile', 'TutorController@updateProfile');
    },
]);

app()->group('/admin', [
    'middleware' => 'auth.required',
    function () {
        app()->get('/reviews', 'Auth\AdminController@reviews');
        app()->post('/reviews/approve', 'Auth\AdminController@approve');
        app()->post('/reviews/reject', 'Auth\AdminController@reject');
        app()->get('/activities', 'Auth\AdminController@activities');
        app()->get('/users', 'Auth\AdminController@users');
        app()->post('/users/toggle', 'Auth\AdminController@toggleUser');
        app()->get('/tutors', 'Auth\AdminController@tutors');
        app()->post('/tutors/verify', 'Auth\AdminController@toggleVerify');
        app()->get('/students', 'Auth\AdminController@students');
        app()->get('/subjects', 'Auth\AdminController@subjects');
        app()->post('/subjects/create', 'Auth\AdminController@createSubject');
        app()->post('/subjects/update', 'Auth\AdminController@updateSubject');
        app()->post('/subjects/delete', 'Auth\AdminController@deleteSubject');
        app()->get('/payments', 'Auth\AdminController@payments');
    },
]);

app()->group('/settings', function () {
    app()->get('/profile', 'Profile\AccountController@show_update');
    app()->patch('/profile', 'Profile\AccountController@update');
});
