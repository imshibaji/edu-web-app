<?php

uses()->group('unit');

describe('Basic Setup', function () {
    it('can run a simple test', function () {
        expect(true)->toBeTrue();
    });
    
    it('has the application loaded', function () {
        expect(function_exists('app'))->toBeTrue();
    });
});