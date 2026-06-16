<?php

declare(strict_types=1);

namespace Tests\Feature\Models;

use App\Models\Session;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The Session model exposes the per-session input/output token split (backing
 * the input/output-aware cost). These specs pin that the columns are mass
 * assignable and cast to integers (the agent reports them as strings/numbers).
 */
class SessionTokenCastTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_mass_assigns_and_integer_casts_input_and_output_tokens(): void
    {
        $session = Session::factory()->create([
            'input_tokens' => '12000',
            'output_tokens' => '3400',
        ]);

        $fresh = $session->fresh();

        $this->assertSame(12000, $fresh->input_tokens);
        $this->assertSame(3400, $fresh->output_tokens);
    }

    #[Test]
    public function input_and_output_tokens_default_to_zero(): void
    {
        $session = Session::factory()->create();
        $fresh = $session->fresh();

        $this->assertSame(0, $fresh->input_tokens);
        $this->assertSame(0, $fresh->output_tokens);
    }
}
