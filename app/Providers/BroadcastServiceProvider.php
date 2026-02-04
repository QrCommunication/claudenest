<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Disabled - causes Pusher errors
        // Broadcast::routes();
        // require base_path('routes/channels.php');
    }
}
