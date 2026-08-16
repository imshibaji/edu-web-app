<?php

namespace App\Controllers;

class HomeController extends Controller
{
    public function index()
    {
        response()->inertia('home', $this->tutorListingData(request()));
    }
}
