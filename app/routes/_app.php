<?php

/*
|--------------------------------------------------------------------------
| Larnr application routes
|--------------------------------------------------------------------------
*/

app()->get('/', 'PublicController@index');

app()->get('/tutors', 'PublicController@tutors');
app()->get('/t/{username}', 'PublicController@tutorProfileByUsername');
app()->get('/username-available', 'PublicController@usernameAvailable');
app()->get('/subjects', 'PublicController@subjects');
app()->get('/subject/{slug}', 'PublicController@subject');
app()->get('/interview-prep', 'PublicController@interviewPrep');
app()->get('/about', 'PublicController@about');
app()->get('/careers', 'PublicController@careers');
app()->get('/contact', 'PublicController@contact');
app()->post('/contact', 'PublicController@contactSubmit');
app()->get('/privacy', 'PublicController@privacy');
app()->get('/help', 'PublicController@help');
app()->get('/terms', 'PublicController@terms');
app()->get('/trust-safety', 'PublicController@trustSafety');

app()->post('/enquiry', 'EnquiryController@store');

app()->get('/payment/checkout/{id}', 'PaymentController@showCheckout');

app()->get('/api/currency-rates', 'PublicController@currencyRates');
app()->get('/api/tutor/{id}/available-slots', 'PublicController@availableSlots');

app()->post('/payment/checkout/{id}', 'PaymentController@createCheckout');
app()->get('/payment/success', 'PaymentController@success');
app()->post('/payment/success', 'PaymentController@success');
app()->get('/payment/cancel', 'PaymentController@cancel');
app()->post('/payment/cancel', 'PaymentController@cancel');
app()->get('/payment/connect', 'PaymentController@connect');
app()->post('/stripe/webhook', 'PaymentController@webhook');
