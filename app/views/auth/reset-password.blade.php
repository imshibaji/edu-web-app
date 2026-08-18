<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Larnr</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/daisyui/4.12.23/full.min.css" rel="stylesheet" />
</head>
<body class="min-h-screen bg-background p-6 flex items-center justify-center">

    <div class="max-w-md w-full space-y-6 p-8 bg-card rounded-xl shadow-xl">
        <h2 class="text-2xl font-bold text-center">Reset Password</h2>
        
        @if (isset($error))
            <div class="bg-red-100 text-red-800 rounded-xl p-4 text-center">
                {{ $error }}
            </div>
        @endif
        
        @if (isset($token))
            <input type="hidden" name="token" value="{{ $token }}">
        @endif
        
        <form method="POST" action="/auth/reset-password" class="space-y-4">
            @if (isset($token))
                @csrf()
            @endif
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500" disabled>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">New password</label>
                <input type="password" name="password" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Confirm password</label>
                <input type="password" name="password_confirmation" required minlength="8" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500">
            </div>
            
            <button type="submit" class="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700">
                Reset password
            </button>
        </form>
        
        <p class="text-center text-sm text-gray-500">
            <a href="/auth/login">Back to login</a>
        </p>
    </div>

</body>
</html>