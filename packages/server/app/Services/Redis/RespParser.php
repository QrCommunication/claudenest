<?php

declare(strict_types=1);

namespace App\Services\Redis;

use UnexpectedValueException;

/**
 * Minimal incremental RESP2 parser for the AgentWakeSubscriber.
 *
 * Handles exactly the reply types a SUBSCRIBE-mode connection receives:
 * simple strings (+), errors (-), integers (:), bulk strings ($) and
 * arrays (*). A HELLO is never sent, so the connection stays in RESP2 —
 * no push (>) frames to deal with.
 *
 * The parser is stateless and incremental: feed it the start of a buffer,
 * it returns one complete value plus the number of bytes consumed, or null
 * when the buffer does not yet contain a complete value (keep buffering).
 */
final class RespParser
{
    /**
     * Try to parse ONE complete RESP value from the start of $buffer.
     *
     * @return array{0: mixed, 1: int}|null [value, bytesConsumed], or null if the value is incomplete.
     *
     * @throws UnexpectedValueException on an unknown type byte (protocol desync — caller should reconnect).
     */
    public static function tryParse(string $buffer): ?array
    {
        return self::parseAt($buffer, 0);
    }

    /**
     * @return array{0: mixed, 1: int}|null [value, offsetAfterValue]
     */
    private static function parseAt(string $buffer, int $offset): ?array
    {
        if ($offset >= strlen($buffer)) {
            return null;
        }

        $lineEnd = strpos($buffer, "\r\n", $offset);
        if ($lineEnd === false) {
            return null; // header line not complete yet
        }

        $type = $buffer[$offset];
        $line = substr($buffer, $offset + 1, $lineEnd - $offset - 1);
        $next = $lineEnd + 2;

        switch ($type) {
            case '+':
                return [$line, $next];

            case '-':
                return [new RespError($line), $next];

            case ':':
                return [(int) $line, $next];

            case '$':
                $length = (int) $line;
                if ($length < 0) {
                    return [null, $next]; // null bulk string ($-1)
                }
                if (strlen($buffer) < $next + $length + 2) {
                    return null; // payload (+ trailing CRLF) not complete yet
                }

                return [substr($buffer, $next, $length), $next + $length + 2];

            case '*':
                $count = (int) $line;
                if ($count < 0) {
                    return [null, $next]; // null array (*-1)
                }
                $items = [];
                $cursor = $next;
                for ($i = 0; $i < $count; $i++) {
                    $item = self::parseAt($buffer, $cursor);
                    if ($item === null) {
                        return null; // an element is incomplete — wait for more data
                    }
                    $items[] = $item[0];
                    $cursor = $item[1];
                }

                return [$items, $cursor];

            default:
                throw new UnexpectedValueException(
                    sprintf("RESP protocol desync: unexpected type byte 0x%02x ('%s')", ord($type), $type)
                );
        }
    }
}
