<?php

declare(strict_types=1);

namespace Tests\Unit\Services\Redis;

use App\Services\Redis\RespError;
use App\Services\Redis\RespParser;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use UnexpectedValueException;

/**
 * Pure unit tests (no Laravel app) for the incremental RESP2 parser that
 * backs AgentWakeSubscriber. The pmessage frame layout tested here is
 * exactly what Redis sends on a PSUBSCRIBE'd connection.
 */
class RespParserTest extends TestCase
{
    #[Test]
    public function parses_a_simple_string(): void
    {
        $this->assertSame(['OK', 5], RespParser::tryParse("+OK\r\n"));
    }

    #[Test]
    public function parses_an_error_as_a_resp_error_value(): void
    {
        $result = RespParser::tryParse("-ERR invalid password\r\n");

        $this->assertNotNull($result);
        $this->assertInstanceOf(RespError::class, $result[0]);
        $this->assertSame('ERR invalid password', $result[0]->message);
        $this->assertSame(23, $result[1]);
    }

    #[Test]
    public function parses_an_integer(): void
    {
        $this->assertSame([42, 5], RespParser::tryParse(":42\r\n"));
    }

    #[Test]
    public function parses_a_bulk_string(): void
    {
        $this->assertSame(['hello', 11], RespParser::tryParse("\$5\r\nhello\r\n"));
    }

    #[Test]
    public function parses_a_bulk_string_containing_crlf(): void
    {
        // Length-prefixed payloads must not be split on CRLF.
        $this->assertSame(["a\r\nb", 10], RespParser::tryParse("\$4\r\na\r\nb\r\n"));
    }

    #[Test]
    public function parses_null_bulk_and_null_array(): void
    {
        $this->assertSame([null, 5], RespParser::tryParse("\$-1\r\n"));
        $this->assertSame([null, 5], RespParser::tryParse("*-1\r\n"));
    }

    #[Test]
    public function parses_a_psubscribe_confirmation_frame(): void
    {
        // PSUBSCRIBE reply: [psubscribe, pattern, subscription count]
        $pattern = '*claudenest:agent:wake';
        $frame = "*3\r\n\$10\r\npsubscribe\r\n\$" . strlen($pattern) . "\r\n{$pattern}\r\n:1\r\n";

        $result = RespParser::tryParse($frame);

        $this->assertNotNull($result);
        $this->assertSame(['psubscribe', $pattern, 1], $result[0]);
        $this->assertSame(strlen($frame), $result[1]);
    }

    #[Test]
    public function parses_a_pmessage_frame(): void
    {
        // pmessage frame: [pmessage, pattern, channel, payload] — the channel
        // carries the Laravel Redis prefix, the payload is the machineId.
        $pattern = '*claudenest:agent:wake';
        $channel = 'claudenest_database_claudenest:agent:wake';
        $machineId = '0196c2f3-1111-7222-8333-444455556666';

        $frame = "*4\r\n"
            . "\$8\r\npmessage\r\n"
            . '$' . strlen($pattern) . "\r\n{$pattern}\r\n"
            . '$' . strlen($channel) . "\r\n{$channel}\r\n"
            . '$' . strlen($machineId) . "\r\n{$machineId}\r\n";

        $result = RespParser::tryParse($frame);

        $this->assertNotNull($result);
        $this->assertSame(['pmessage', $pattern, $channel, $machineId], $result[0]);
        $this->assertSame(strlen($frame), $result[1]);
    }

    #[Test]
    public function returns_null_on_incomplete_input(): void
    {
        // Truncated at every interesting boundary: the parser must request
        // more data (null), never crash or return a partial value.
        $this->assertNull(RespParser::tryParse(''));
        $this->assertNull(RespParser::tryParse('+OK'));            // header CRLF missing
        $this->assertNull(RespParser::tryParse("\$5\r\nhel"));      // bulk payload cut
        $this->assertNull(RespParser::tryParse("\$5\r\nhello"));    // trailing CRLF cut
        $this->assertNull(RespParser::tryParse("*2\r\n\$2\r\nhi\r\n")); // array element missing
    }

    #[Test]
    public function parses_incrementally_as_bytes_arrive(): void
    {
        $frame = "*3\r\n\$8\r\npmessage\r\n\$3\r\nabc\r\n\$2\r\nid\r\n";

        // Feed one byte at a time: every prefix must return null, the full
        // frame must parse — this is the streaming contract onData relies on.
        for ($i = 1; $i < strlen($frame); $i++) {
            $this->assertNull(
                RespParser::tryParse(substr($frame, 0, $i)),
                "prefix of {$i} bytes should be incomplete"
            );
        }

        $result = RespParser::tryParse($frame);
        $this->assertNotNull($result);
        $this->assertSame(strlen($frame), $result[1]);
    }

    #[Test]
    public function consumed_offset_allows_draining_multiple_values(): void
    {
        $buffer = "+OK\r\n:7\r\n\$2\r\nhi\r\n";

        $values = [];
        while (($parsed = RespParser::tryParse($buffer)) !== null) {
            [$value, $consumed] = $parsed;
            $values[] = $value;
            $buffer = substr($buffer, $consumed);
        }

        $this->assertSame(['OK', 7, 'hi'], $values);
        $this->assertSame('', $buffer);
    }

    #[Test]
    public function throws_on_an_unknown_type_byte(): void
    {
        // Protocol desync (e.g. RESP3 push frame) must surface as an
        // exception so the subscriber resets the connection.
        $this->expectException(UnexpectedValueException::class);

        RespParser::tryParse("x4\r\njunk\r\n");
    }
}
