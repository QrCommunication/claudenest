<?php

namespace Tests\Unit\Policies;

use PHPUnit\Framework\Attributes\Test;

use App\Models\Machine;
use App\Models\User;
use App\Policies\MachinePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MachinePolicyTest extends TestCase
{
    use RefreshDatabase;

    private MachinePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->policy = new MachinePolicy();
    }

    #[Test]
    public function user_can_view_any_of_their_machines(): void
    {
        $user = User::factory()->create();

        $canViewAny = $this->policy->viewAny($user);

        $this->assertTrue($canViewAny);
    }

    #[Test]
    public function user_can_view_their_own_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $canView = $this->policy->view($user, $machine);

        $this->assertTrue($canView);
    }

    #[Test]
    public function user_cannot_view_other_users_machine(): void
    {
        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create(); // Different user

        $canView = $this->policy->view($user, $otherMachine);

        $this->assertFalse($canView);
    }

    #[Test]
    public function user_can_create_machine(): void
    {
        $user = User::factory()->create();

        $canCreate = $this->policy->create($user);

        $this->assertTrue($canCreate);
    }

    #[Test]
    public function user_can_update_their_own_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $canUpdate = $this->policy->update($user, $machine);

        $this->assertTrue($canUpdate);
    }

    #[Test]
    public function user_cannot_update_other_users_machine(): void
    {
        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create();

        $canUpdate = $this->policy->update($user, $otherMachine);

        $this->assertFalse($canUpdate);
    }

    #[Test]
    public function user_can_delete_their_own_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $canDelete = $this->policy->delete($user, $machine);

        $this->assertTrue($canDelete);
    }

    #[Test]
    public function user_cannot_delete_other_users_machine(): void
    {
        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create();

        $canDelete = $this->policy->delete($user, $otherMachine);

        $this->assertFalse($canDelete);
    }

    #[Test]
    public function user_can_regenerate_token_for_their_machine(): void
    {
        $user = User::factory()->create();
        $machine = Machine::factory()->for($user)->create();

        $canRegenerate = $this->policy->regenerateToken($user, $machine);

        $this->assertTrue($canRegenerate);
    }

    #[Test]
    public function user_cannot_regenerate_token_for_other_users_machine(): void
    {
        $user = User::factory()->create();
        $otherMachine = Machine::factory()->create();

        $canRegenerate = $this->policy->regenerateToken($user, $otherMachine);

        $this->assertFalse($canRegenerate);
    }
}
