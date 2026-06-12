<?php

declare(strict_types=1);

namespace Tests\Unit\Services\Redis;

use App\Services\Redis\AgentWakeSubscriber;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Pure unit tests (no Laravel app, no socket) for the connection parameter
 * resolution — the only non-event-driven logic in the subscriber. The
 * live subscribe path is covered by the manual verification procedure
 * (agent:serve logs "wake subscriber: subscribed" on boot).
 */
class AgentWakeSubscriberTest extends TestCase
{
    #[Test]
    public function resolves_defaults_to_plain_tcp_without_auth(): void
    {
        [$uri, $commands] = AgentWakeSubscriber::connectionParams([
            'host' => '127.0.0.1',
            'port' => '6379',
            'username' => null,
            'password' => null,
            'database' => '0',
        ]);

        $this->assertSame('tcp://127.0.0.1:6379', $uri);
        $this->assertSame([], $commands);
    }

    #[Test]
    public function resolves_password_only_auth(): void
    {
        [$uri, $commands] = AgentWakeSubscriber::connectionParams([
            'host' => '10.0.0.5',
            'port' => 6380,
            'password' => 's3cret',
        ]);

        $this->assertSame('tcp://10.0.0.5:6380', $uri);
        $this->assertSame([['AUTH', 's3cret']], $commands);
    }

    #[Test]
    public function resolves_acl_username_and_password_auth(): void
    {
        [, $commands] = AgentWakeSubscriber::connectionParams([
            'host' => '127.0.0.1',
            'port' => 6379,
            'username' => 'claudenest',
            'password' => 's3cret',
        ]);

        $this->assertSame([['AUTH', 'claudenest', 's3cret']], $commands);
    }

    #[Test]
    public function resolves_tls_scheme_to_a_tls_uri(): void
    {
        [$uri] = AgentWakeSubscriber::connectionParams([
            'scheme' => 'tls',
            'host' => 'redis.internal',
            'port' => 6379,
        ]);

        $this->assertSame('tls://redis.internal:6379', $uri);
    }

    #[Test]
    public function resolves_a_redis_url_with_credentials(): void
    {
        [$uri, $commands] = AgentWakeSubscriber::connectionParams([
            'url' => 'rediss://user:p%40ss@redis.example.com:6380/0',
            // host/port below must be ignored when url is present (same
            // precedence as Laravel's own connector).
            'host' => 'ignored',
            'port' => 1,
        ]);

        $this->assertSame('tls://redis.example.com:6380', $uri);
        $this->assertSame([['AUTH', 'user', 'p@ss']], $commands);
    }

    #[Test]
    public function resolves_a_url_without_port_to_the_default_port(): void
    {
        [$uri, $commands] = AgentWakeSubscriber::connectionParams([
            'url' => 'redis://redis.example.com',
        ]);

        $this->assertSame('tcp://redis.example.com:6379', $uri);
        $this->assertSame([], $commands);
    }

    #[Test]
    public function resolves_a_unix_socket_host(): void
    {
        [$uri] = AgentWakeSubscriber::connectionParams([
            'host' => '/var/run/redis/redis.sock',
            'port' => 0,
        ]);

        $this->assertSame('unix:///var/run/redis/redis.sock', $uri);
    }

    #[Test]
    public function treats_empty_password_as_no_auth(): void
    {
        // .env REDIS_PASSWORD=null arrives as null, but an explicit empty
        // string must not produce an invalid bare AUTH command either.
        [, $commands] = AgentWakeSubscriber::connectionParams([
            'host' => '127.0.0.1',
            'port' => 6379,
            'password' => '',
        ]);

        $this->assertSame([], $commands);
    }
}
