<?php

/*
|--------------------------------------------------------------------------
| Larnr application routes
|--------------------------------------------------------------------------
*/

app()->get('/', 'PublicController@index');

app()->get('/tutors', 'PublicController@tutors');
app()->get('/subjects', 'PublicController@subjects');
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

app()->get('/api/currency-rates', 'PublicController@currencyRates');
