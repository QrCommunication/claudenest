<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

/**
 * Domain error of the server-driven worker pool, mapped by controllers to
 * the standard error envelope ({code, message}, HTTP status).
 */
class WorkerPoolException extends Exception
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $httpStatus,
    ) {
        parent::__construct($message);
    }

    public static function machineOffline(): self
    {
        return new self('MACHINE_OFFLINE', 'Machine is not online', 422);
    }

    public static function planLimitReached(int $cap): self
    {
        return new self(
            'PLAN_001',
            "Your plan allows at most {$cap} concurrent Claude sessions. Terminate a session or upgrade your plan.",
            403,
        );
    }
}
