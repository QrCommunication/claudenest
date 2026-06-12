<?php

declare(strict_types=1);

namespace App\Services\Redis;

/**
 * A RESP error reply ("-ERR ...") parsed by RespParser.
 *
 * Errors are data on a pub/sub connection (e.g. AUTH rejected), not
 * exceptions: the subscriber decides how to react (log + reconnect).
 */
final class RespError
{
    public function __construct(public readonly string $message)
    {
    }
}
