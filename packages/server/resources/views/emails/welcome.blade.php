<x-mail::message>
# Welcome to ClaudeNest, {{ $userName }}!

Your account is ready. ClaudeNest lets you control Claude Code from anywhere, run multiple agents on the same project, and keep their shared context in sync.

<x-mail::button :url="$dashboardUrl">
Open your dashboard
</x-mail::button>

New here? The documentation walks you through pairing your first machine, launching remote sessions, and multi-agent orchestration:

[Read the documentation]({{ $docsUrl }})

Happy building,<br>
The {{ config('app.name') }} team

<x-mail::subcopy>
If the button does not work, copy this link into your browser: {{ $dashboardUrl }}
</x-mail::subcopy>
</x-mail::message>
