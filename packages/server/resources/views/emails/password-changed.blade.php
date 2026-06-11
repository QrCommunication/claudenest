<x-mail::message>
# Your password was changed

Hello {{ $userName }},

The password for your ClaudeNest account was changed on {{ $changedAt }}.

If you made this change, no further action is needed.

**If this was not you**, your account may be compromised: reset your password immediately from the login page and contact us at {{ $supportEmail }}.

Stay safe,<br>
The {{ config('app.name') }} team
</x-mail::message>
