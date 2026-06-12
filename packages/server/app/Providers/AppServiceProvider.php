<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Services\DecompositionStreamService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Singleton: agent:serve accumulates ephemeral decompose-* session
        // output in this service across WebSocket messages — it must be the
        // same instance for the lifetime of the process.
        $this->app->singleton(DecompositionStreamService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Use custom PersonalAccessToken model for Sanctum
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Prevent lazy loading in production
        Model::preventLazyLoading(! $this->app->isProduction());

        // Enable strict mode in development
        if ($this->app->isLocal()) {
            Model::shouldBeStrict();
        }

        // API-only backend: there is no named web route `password.reset`, so the
        // default ResetPassword notification URL builder would throw a
        // RouteNotFoundException BEFORE sending — the reset email would never
        // leave the server. Point the action link at the SPA route instead.
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            return rtrim((string) config('app.url'), '/')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });

        // Note: vector type registration is handled automatically by pgvector extension
    }
}
