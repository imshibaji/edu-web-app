<?php

/*
|--------------------------------------------------------------------------
| Larnr application routes
|--------------------------------------------------------------------------
*/

app()->get('/', 'HomeController@index');

app()->post('/enquiry', 'EnquiryController@store');
