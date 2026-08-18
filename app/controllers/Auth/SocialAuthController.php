<?php

namespace App\Controllers\Auth;

use App\Controllers\Controller;
use App\Models\User;
use App\Models\PasswordReset;
use Exception;

class SocialAuthController extends Controller
{
    /**
     * Redirect user to the OAuth provider.
     */
    public function redirect(string $provider): \Leaf\Response
    {
        $validProviders = ['google', 'facebook'];

        if (!in_array($provider, $validProviders, true)) {
            return response()
                ->withFlash('error', ['general' => 'Invalid provider.'])
                ->redirect('/auth/login', 303);
        }

        $state = bin2hex(random_bytes(16));
        $_SESSION['oauth_state_' . $provider] = $state;

        $redirectUrl = $this->getProviderRedirectUrl($provider, $state);

        return response()
            ->redirect($redirectUrl, 303);
    }

    /**
     * Handle the OAuth callback.
     */
    public function callback(string $provider): \Leaf\Response
    {
        $validProviders = ['google', 'facebook'];

        if (!in_array($provider, $validProviders, true)) {
            return response()
                ->withFlash('error', ['general' => 'Invalid provider.'])
                ->redirect('/auth/login', 303);
        }

        // Verify state parameter to prevent CSRF
        $expectedState = $_SESSION['oauth_state_' . $provider] ?? null;
        $actualState = request()->get('state') ?? null;

        if (!$expectedState || $expectedState !== $actualState) {
            return response()
                ->withFlash('error', ['general' => 'Invalid state parameter.'])
                ->redirect('/auth/login', 303);
        }

        unset($_SESSION['oauth_state_' . $provider]);

        try {
            $userData = $this->fetchUserData($provider, request()->get('code') ?? '');

            // Find or create user
            $user = User::query()
                ->where('email', $userData['email'])
                ->first();

            if (!$user) {
                // Create new user
                $user = User::create([
                    'id' => (string) \Ramsey\Uuid\Uuid::uuid4(),
                    'email' => $userData['email'],
                    'password_hash' => '' . \Leaf\Hash::make(uniqid()), // Empty password for social login
                    'role' => $userData['role'] ?? User::ROLE_STUDENT,
                    'is_active' => true,
                    'base_currency' => 'USD',
                    'remember_token' => strval(\Ramsey\Uuid\Uuid::uuid4()),
                ]);
            }

            // Create or update social account record
            $user->socialAccounts()->updateOrCreate(
                ['provider' => $provider, 'provider_id' => $userData['provider_id']],
                ['access_token' => $userData['access_token'] ?? null]
            );

            // Log the user in
            auth()->login($user);

            return response()
                ->withFlash('success', 'You have been logged in with ' . ucfirst($provider) . '.')
                ->redirect('/dashboard', 303);

        } catch (Exception $e) {
            return response()
                ->withFlash('error', ['general' => 'Failed to authenticate with ' . ucfirst($provider) . ': ' . $e->getMessage()])
                ->redirect('/auth/login', 303);
        }
    }

    /**
     * Get the OAuth provider redirect URL.
     */
    private function getProviderRedirectUrl(string $provider, string $state): string
    {
        $params = [
            'client_id' => $this->getProviderClientId($provider),
            'redirect_uri' => $this->getProviderRedirectUri($provider),
            'response_type' => 'code',
            'scope' => $this->getProviderScope($provider),
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'select_account',
        ];

        $baseUrls = [
            'google' => 'https://accounts.google.com/o/oauth2/v2/auth',
            'facebook' => 'https://www.facebook.com/v18.0/dialog/oauth',
        ];

        $url = $baseUrls[$provider] . '?' . http_build_query($params);

        return $url;
    }

    /**
     * Get the OAuth client ID for the provider.
     */
    private function getProviderClientId(string $provider): string
    {
        $config = [
            'google' => env('GOOGLE_CLIENT_ID', ''),
            'facebook' => env('FACEBOOK_CLIENT_ID', ''),
        ];

        return $config[$provider] ?? '';
    }

    /**
     * Get the OAuth redirect URI for the provider.
     */
    private function getProviderRedirectUri(string $provider): string
    {
        $baseUrl = env('APP_URL', 'http://localhost:5500');
        return $baseUrl . '/auth/' . $provider . '/callback';
    }

    /**
     * Get the OAuth scope for the provider.
     */
    private function getProviderScope(string $provider): string
    {
        $scopes = [
            'google' => 'email profile',
            'facebook' => 'email public_profile',
        ];

        return $scopes[$provider] ?? 'email';
    }

    /**
     * Fetch user profile data from the OAuth provider.
     */
    private function fetchUserData(string $provider, string $code): array
    {
        $accessToken = $this->exchangeCodeForToken($provider, $code);

        switch ($provider) {
            case 'google':
                return $this->fetchGoogleUser($accessToken);
            case 'facebook':
                return $this->fetchFacebookUser($accessToken);
            default:
                throw new Exception('Unsupported provider: ' . $provider);
        }
    }

    /**
     * Exchange authorization code for access token.
     */
    private function exchangeCodeForToken(string $provider, string $code): string
    {
        $tokenUrls = [
            'google' => 'https://oauth2.googleapis.com/token',
            'facebook' => 'https://graph.facebook.com/v18.0/oauth/access_token',
        ];

        $tokenUrl = $tokenUrls[$provider];
        $clientIds = [
            'google' => env('GOOGLE_CLIENT_SECRET', ''),
            'facebook' => env('FACEBOOK_CLIENT_SECRET', ''),
        ];

        $params = [
            'code' => $code,
            'client_id' => $this->getProviderClientId($provider),
            'client_secret' => $clientIds[$provider] ?? '',
            'redirect_uri' => $this->getProviderRedirectUri($provider),
            'grant_type' => 'authorization_code',
        ];

        $ch = curl_init($tokenUrl);
        curl_init_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($params),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);

        return $data['access_token'] ?? '';
    }

    /**
     * Fetch user data from Google.
     */
    private function fetchGoogleUser(string $accessToken): array
    {
        $ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
        curl_init_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);

        return [
            'email' => $data['email'] ?? '',
            'name' => $data['name'] ?? '',
            'provider_id' => $data['id'] ?? '',
            'avatar' => $data['picture'] ?? '',
            'role' => User::ROLE_STUDENT,
        ];
    }

    /**
     * Fetch user data from Facebook.
     */
    private function fetchFacebookUser(string $accessToken): array
    {
        $ch = curl_init('https://graph.facebook.com/v18.0/me');
        curl_init_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_PARAMS => ['fields' => 'id,name,email'],
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);

        return [
            'email' => $data['email'] ?? '',
            'name' => $data['name'] ?? '',
            'provider_id' => $data['id'] ?? '',
            'avatar' => 'https://graph.facebook.com/v18.0/' . $data['id'] . '/picture?width=200',
            'role' => User::ROLE_STUDENT,
        ];
    }
}