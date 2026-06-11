@component('mail::message')
# Your verification code

Use the code below to complete sign-in to **ClaudeNest**.

@component('mail::panel')
<div style="text-align:center; font-size: 2rem; font-weight: 700; letter-spacing: 0.3rem; padding: 1rem 0;">
{{ $code }}
</div>
@endcomponent

This code expires in **{{ $validMinutes }} minutes**. Do not share it with anyone.

If you did not request this code, you can safely ignore this email.

Thanks,<br>
The ClaudeNest Team
@endcomponent
