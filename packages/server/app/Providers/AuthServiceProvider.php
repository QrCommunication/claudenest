<?php

namespace App\Providers;

use App\Models\DiscoveredCommand;
use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Policies\CommandPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\SharedTaskPolicy;
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
        DiscoveredCommand::class => CommandPolicy::class,
        SharedProject::class => ProjectPolicy::class,
        SharedTask::class => SharedTaskPolicy::class,
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
