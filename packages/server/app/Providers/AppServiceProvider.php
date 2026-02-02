<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

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
        // Prevent lazy loading in production
        Model::preventLazyLoading(! $this->app->isProduction());

        // Enable strict mode in development
        if ($this->app->isLocal()) {
            Model::shouldBeStrict();
        }

        // Register vector type for PostgreSQL
        DB::connection()->getSchemaBuilder()->registerCustomDbType('vector', 'vector');
    }
}
