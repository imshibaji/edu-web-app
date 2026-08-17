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
        app()->get('/payments', 'Auth\admin\PaymentsController@index');
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
