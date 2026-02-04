<?php

namespace App\Providers;

use App\Models\SharedProject;
use App\Policies\ProjectPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        SharedProject::class => ProjectPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Define abilities
        Gate::define('manage-project', function ($user, $project) {
            return $project->user_id === $user->id;
        });

        Gate::define('access-project', function ($user, $project) {
            return $project->user_id === $user->id;
        });
    }
}
