<?php

return [

    'driver' => env('MAIL_DRIVER', 'smtp'),

    'host' => env('MAIL_HOST', 'smtp.mailtrap.io'),

    'port' => env('MAIL_PORT', 2525),

    'encryption' => env('MAIL_ENCRYPTION', 'tls'),

    'username' => env('MAIL_USERNAME', 'username'),

    'password' => env('MAIL_PASSWORD', 'password'),

    'timeout' => env('MAIL_TIMEOUT', 10.0),

    'local_domain' => env('MAIL_LOCAL_DOMAIN', 'localhost'),

    'sendmail' => '/usr/sbin/sendmail -bs',

    'markdown' => [
        'renderer' => ' League\Markdown\Renderer\HtmlRenderer',
    ],

];