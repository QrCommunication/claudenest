<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'ClaudeNest') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=jetbrains-mono:400,500,600,700|inter:400,500,600,700&display=swap" rel="stylesheet" />

    <style>
        :root {
            --color-primary: #a855f7;
            --color-indigo: #6366f1;
            --color-cyan: #22d3ee;
            --color-bg: #1a1b26;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #0f0f1a;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .app-container {
            text-align: center;
            padding: 48px;
        }
        
        .logo-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 32px;
        }
        
        h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #a855f7 0%, #22d3ee 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        p {
            color: #888888;
            font-size: 16px;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #a855f7, #6366f1);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="app-container">
        <svg class="logo-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1b26"/>
                    <stop offset="100%" style="stop-color:#24283b"/>
                </linearGradient>
                <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#a855f7"/>
                    <stop offset="100%" style="stop-color:#6366f1"/>
                </linearGradient>
                <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#22d3ee"/>
                    <stop offset="100%" style="stop-color:#a855f7"/>
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="512" height="512" rx="96" fill="url(#bgGrad)"/>
            <g transform="translate(256, 256)">
                <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
                <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
                <path d="M-60 -70 Q-130 -70 -130 0 Q-130 70 -60 70" stroke="url(#nestGrad)" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
                <path d="M60 -70 Q130 -70 130 0 Q130 70 60 70" stroke="url(#nestGrad)" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
                <circle cx="-35" cy="0" r="18" fill="#22d3ee"/>
                <circle cx="0" cy="0" r="18" fill="url(#nestGrad)"/>
                <circle cx="35" cy="0" r="18" fill="#22d3ee"/>
                <line x1="-17" y1="0" x2="17" y2="0" stroke="url(#accentGrad)" stroke-width="6" opacity="0.8"/>
            </g>
        </svg>
        
        <h1>ClaudeNest Dashboard</h1>
        <p>Full dashboard experience coming soon.<br>Manage your Claude instances remotely.</p>
        <a href="/" class="btn">Back to Home</a>
    </div>
</body>
</html>
