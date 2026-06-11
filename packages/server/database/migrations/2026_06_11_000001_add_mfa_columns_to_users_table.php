<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'mfa_method')) {
                $table->string('mfa_method', 20)->nullable()->after('password')
                    ->comment('null | email | totp');
            }
            if (!Schema::hasColumn('users', 'mfa_secret')) {
                $table->text('mfa_secret')->nullable()->after('mfa_method')
                    ->comment('AES-256-CBC encrypted TOTP secret');
            }
            if (!Schema::hasColumn('users', 'mfa_recovery_codes')) {
                $table->text('mfa_recovery_codes')->nullable()->after('mfa_secret')
                    ->comment('AES-256-CBC encrypted JSON array of bcrypt-hashed recovery codes');
            }
            if (!Schema::hasColumn('users', 'mfa_confirmed_at')) {
                $table->timestamp('mfa_confirmed_at')->nullable()->after('mfa_recovery_codes')
                    ->comment('Null = MFA not yet activated');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['mfa_method', 'mfa_secret', 'mfa_recovery_codes', 'mfa_confirmed_at'];
            $existing = array_filter($columns, fn ($c) => Schema::hasColumn('users', $c));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
