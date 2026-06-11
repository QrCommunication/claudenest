<x-mail::message>
# New feedback received

**Category:** {{ ucfirst($category) }}

**From:** {{ $userName }} ({{ $userEmail }})

**Subject:** {{ $feedbackSubject }}

---

{!! nl2br(e($userMessage)) !!}

<x-mail::subcopy>
Reply directly to this email to answer {{ $userName }}.
</x-mail::subcopy>
</x-mail::message>
