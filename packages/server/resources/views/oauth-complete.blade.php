<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth Complete — ClaudeNest</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0f0f1a;
            color: #c0caf5;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .card {
            text-align: center;
            padding: 2.5rem;
            background: #1a1b26;
            border: 1px solid #2d3154;
            border-radius: 1rem;
            max-width: 360px;
            width: 90%;
        }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        .title { font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem; }
        .sub { font-size: 0.875rem; color: #6b7280; line-height: 1.5; }
        .error-text { color: #ef4444; }
    </style>
</head>
<body>
<div class="card">
    <div class="icon" id="icon">⏳</div>
    <div class="title" id="title">Processing…</div>
    <div class="sub" id="sub">Please wait.</div>
</div>
<script>
(function () {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    const icon = document.getElementById('icon');
    const title = document.getElementById('title');
    const sub = document.getElementById('sub');

    if (success) {
        icon.textContent = '✅';
        title.textContent = 'Connected!';
        sub.textContent = 'This window will close automatically.';
    } else {
        icon.textContent = '❌';
        title.textContent = 'Connection failed';
        sub.className = 'sub error-text';
        sub.textContent = error ? decodeURIComponent(error) : 'An unknown error occurred.';
    }

    if (window.opener) {
        try {
            window.opener.postMessage(
                { type: 'oauth_complete', success: success || null, error: error ? decodeURIComponent(error) : null },
                window.location.origin
            );
        } catch (e) {
            // Cross-origin protection — ignore
        }
        setTimeout(function () { window.close(); }, 1500);
    } else {
        // Fallback: not in popup, redirect to credentials page
        setTimeout(function () {
            window.location.href = success
                ? '/credentials?oauth_success=' + encodeURIComponent(success)
                : '/credentials?oauth_error=' + encodeURIComponent(error || '');
        }, 2500);
    }
})();
</script>
</body>
</html>
