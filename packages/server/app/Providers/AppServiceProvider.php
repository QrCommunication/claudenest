<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
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
        //
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

        // Note: vector type registration is handled automatically by pgvector extension
    }
}
