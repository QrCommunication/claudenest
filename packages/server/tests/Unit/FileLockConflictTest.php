<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\FileLock;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Unit coverage for FileLock::conflictsWith() — the advanced (shared/exclusive +
 * line-range) lock conflict matrix.
 *
 * This is the decision that the FileLockController turns into the enriched 409
 * (conflictResponse) / 202 queue / shared-join responses, so pinning it here
 * pins the controller's branching too.
 *
 * Pure in-memory: locks are built with `new FileLock([...])` and never saved.
 * conflictsWith() only reads model attributes (path, locked_by, lock_type via
 * is_shared/is_exclusive, line_range), so no database is touched — which also
 * means this suite is independent of the advanced-lock columns migration
 * (lock_type/line_range), owned by a separate sprint task and not required here.
 *
 * Conflict matrix (same path, different holder, overlapping ranges):
 *   - exclusive vs anything → conflict
 *   - shared    vs shared   → compatible (no conflict)
 * A null line_range = whole-file lock and overlaps every range.
 */
class FileLockConflictTest extends TestCase
{
    /**
     * Build a transient (unsaved) FileLock for conflict evaluation.
     *
     * @param array{start:int,end:int}|null $lineRange
     */
    private function lock(
        string $path,
        string $lockedBy,
        string $lockType = FileLock::LOCK_TYPE_EXCLUSIVE,
        ?array $lineRange = null,
    ): FileLock {
        return new FileLock([
            'path' => $path,
            'locked_by' => $lockedBy,
            'lock_type' => $lockType,
            'line_range' => $lineRange,
        ]);
    }

    // ==================== PATH / HOLDER GUARDS ====================

    #[Test]
    public function locks_on_different_paths_never_conflict(): void
    {
        $a = $this->lock('src/a.ts', 'instance-1');
        $b = $this->lock('src/b.ts', 'instance-2');

        // Exclusive whole-file locks, but different files — independent.
        $this->assertFalse($a->conflictsWith($b));
        $this->assertFalse($b->conflictsWith($a));
    }

    #[Test]
    public function a_lock_never_conflicts_with_another_held_by_the_same_instance(): void
    {
        // Same path, same holder, both exclusive whole-file: re-acquiring /
        // extending one's own lock is never a conflict.
        $a = $this->lock('src/auth.ts', 'instance-1');
        $b = $this->lock('src/auth.ts', 'instance-1');

        $this->assertFalse($a->conflictsWith($b));
    }

    #[Test]
    public function two_null_holders_are_not_treated_as_the_same_holder(): void
    {
        // The same-holder shortcut only fires when locked_by is non-null AND
        // equal. Two null holders must fall through to the lock_type/range eval
        // (here: exclusive whole-file → conflict).
        $a = $this->lock('src/auth.ts', '');
        $a->locked_by = null;
        $b = $this->lock('src/auth.ts', '');
        $b->locked_by = null;

        $this->assertTrue($a->conflictsWith($b));
    }

    // ==================== LOCK-TYPE MATRIX ====================

    #[Test]
    public function shared_vs_shared_is_compatible(): void
    {
        $a = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_SHARED);
        $b = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_SHARED);

        $this->assertFalse($a->conflictsWith($b));
        $this->assertFalse($b->conflictsWith($a));
    }

    #[Test]
    public function two_shared_readers_are_compatible_even_on_overlapping_ranges(): void
    {
        // Reader/reader coexistence is unconditional — range overlap is irrelevant.
        $a = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_SHARED, ['start' => 1, 'end' => 50]);
        $b = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_SHARED, ['start' => 10, 'end' => 20]);

        $this->assertFalse($a->conflictsWith($b));
    }

    #[Test]
    public function exclusive_vs_shared_conflicts_on_the_whole_file(): void
    {
        $exclusive = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_EXCLUSIVE);
        $shared = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_SHARED);

        $this->assertTrue($exclusive->conflictsWith($shared));
    }

    #[Test]
    public function shared_vs_exclusive_conflicts_on_the_whole_file(): void
    {
        // Conflict must be symmetric: a shared lock evaluated against an
        // exclusive one still conflicts.
        $shared = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_SHARED);
        $exclusive = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE);

        $this->assertTrue($shared->conflictsWith($exclusive));
    }

    #[Test]
    public function exclusive_vs_exclusive_conflicts_on_the_whole_file(): void
    {
        $a = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_EXCLUSIVE);
        $b = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE);

        $this->assertTrue($a->conflictsWith($b));
    }

    #[Test]
    public function a_missing_lock_type_is_treated_as_exclusive_fail_closed(): void
    {
        // A persisted row predating the advanced-lock columns has a null
        // lock_type; is_exclusive must default it to exclusive (fail-closed) so
        // it still blocks a new exclusive acquire.
        $legacy = $this->lock('src/auth.ts', 'instance-1');
        $legacy->lock_type = null;
        $candidate = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE);

        $this->assertTrue($legacy->is_exclusive);
        $this->assertFalse($legacy->is_shared);
        $this->assertTrue($candidate->conflictsWith($legacy));
    }

    // ==================== LINE-RANGE OVERLAP (exclusive) ====================

    #[Test]
    public function exclusive_locks_on_overlapping_ranges_conflict(): void
    {
        $a = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 1, 'end' => 20]);
        $b = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 15, 'end' => 30]);

        $this->assertTrue($a->conflictsWith($b));
    }

    #[Test]
    public function exclusive_locks_on_disjoint_ranges_do_not_conflict(): void
    {
        // [1,5] and [6,10] are adjacent but non-overlapping — distinct regions
        // of the same file can be edited concurrently.
        $a = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 1, 'end' => 5]);
        $b = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 6, 'end' => 10]);

        $this->assertFalse($a->conflictsWith($b));
    }

    #[Test]
    public function exclusive_locks_touching_at_a_boundary_conflict(): void
    {
        // [1,5] and [5,10] share line 5 — the overlap test is inclusive
        // (aStart <= bEnd && bStart <= aEnd), so this conflicts.
        $a = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 1, 'end' => 5]);
        $b = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 5, 'end' => 10]);

        $this->assertTrue($a->conflictsWith($b));
    }

    #[Test]
    public function a_whole_file_exclusive_lock_overlaps_any_ranged_lock(): void
    {
        $wholeFile = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_EXCLUSIVE, null);
        $ranged = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 100, 'end' => 200]);

        $this->assertTrue($wholeFile->conflictsWith($ranged));
        $this->assertTrue($ranged->conflictsWith($wholeFile));
    }

    #[Test]
    public function a_malformed_range_is_treated_as_whole_file_conservatively(): void
    {
        // A range missing its end is non-numeric on one side → treated as
        // whole-file (conservative: conflict) to never silently allow a
        // conflicting edit.
        $malformed = $this->lock('src/auth.ts', 'instance-1', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 5]);
        $ranged = $this->lock('src/auth.ts', 'instance-2', FileLock::LOCK_TYPE_EXCLUSIVE, ['start' => 100, 'end' => 200]);

        $this->assertTrue($malformed->conflictsWith($ranged));
    }
}
