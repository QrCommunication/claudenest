<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>ClaudeNest - Remote Claude Code Orchestration</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

    <style>
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
        
        .container {
            text-align: center;
            padding: 48px;
            max-width: 600px;
        }
        
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 32px;
        }
        
        h1 {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #a855f7 0%, #22d3ee 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        p {
            color: #888888;
            font-size: 18px;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        
        .buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #a855f7, #6366f1);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(168, 85, 247, 0.3);
        }
        
        .btn-secondary {
            background: #1a1b26;
            color: #ffffff;
            border: 1px solid #3b4261;
        }
        
        .btn-secondary:hover {
            background: #24283b;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-top: 64px;
            text-align: left;
        }

        .feature {
            padding: 24px;
            background: #1a1b26;
            border-radius: 12px;
            border: 1px solid #3b4261;
        }

        .feature-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #a855f7, #6366f1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }

        .feature h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .feature p {
            font-size: 14px;
            margin: 0;
        }

        @media (max-width: 640px) {
            h1 { font-size: 36px; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Logo -->
        <svg class="logo" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1b26"/>
                    <stop offset="100%" style="stop-color:#24283b"/>
                </linearGradient>
                <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#a855f7"/>
                    <stop offset="100%" style="stop-color:#6366f1"/>
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
            </g>
        </svg>
        
        <h1>ClaudeNest</h1>
        <p>Remote Claude Code orchestration platform. Manage AI coding agents across multiple machines from a single dashboard.</p>
        
        <div class="buttons">
            <a href="/login" class="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Launch Dashboard
            </a>
            <a href="https://github.com/claudenest/claudenest" target="_blank" class="btn btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
            </a>
        </div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                </div>
                <h3>Remote Sessions</h3>
                <p>Control Claude Code on any machine from your browser</p>
            </div>
            <div class="feature">
                <div class="feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
                <h3>Multi-Agent</h3>
                <p>Coordinate multiple AI agents across projects</p>
            </div>
            <div class="feature">
                <div class="feature-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                </div>
                <h3>Real-time</h3>
                <p>Live updates and WebSocket connectivity</p>
            </div>
        </div>
    </div>
</body>
</html>
