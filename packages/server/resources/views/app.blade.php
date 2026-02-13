<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'ClaudeNest') }} - Remote Claude Code Orchestration</title>
    <meta name="description" content="ClaudeNest - Remote orchestration platform for Claude Code. Run multiple AI agents simultaneously with shared context, file locking & real-time sync.">
    <meta name="keywords" content="Claude Code, AI, orchestration, remote, multi-agent, RAG, pgvector, terminal, developer tools">
    <meta name="author" content="ClaudeNest">
    <meta name="theme-color" content="#a855f7">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="generator" content="ClaudeNest">

    <!-- Canonical URL -->
    <link rel="canonical" href="{{ config('app.url') }}{{ request()->getPathInfo() }}">

    <!-- hreflang: EN / FR -->
    <link rel="alternate" hreflang="en" href="{{ config('app.url') }}{{ request()->getPathInfo() }}">
    <link rel="alternate" hreflang="fr" href="{{ config('app.url') }}{{ request()->getPathInfo() }}?lang=fr">
    <link rel="alternate" hreflang="x-default" href="{{ config('app.url') }}{{ request()->getPathInfo() }}">

    <!-- Favicon & Manifest -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
    <link rel="manifest" href="/manifest.webmanifest">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ config('app.url') }}{{ request()->getPathInfo() }}">
    <meta property="og:title" content="{{ config('app.name', 'ClaudeNest') }} - Remote Claude Code Orchestration">
    <meta property="og:description" content="ClaudeNest - Remote orchestration platform for Claude Code. Run multiple AI agents simultaneously with shared context, file locking & real-time sync.">
    <meta property="og:image" content="{{ config('app.url') }}/og-image.svg">
    <meta property="og:site_name" content="ClaudeNest">
    <meta property="og:locale" content="en_US">
    <meta property="og:locale:alternate" content="fr_FR">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@@claudenest">
    <meta name="twitter:title" content="{{ config('app.name', 'ClaudeNest') }} - Remote Claude Code Orchestration">
    <meta name="twitter:description" content="ClaudeNest - Remote orchestration platform for Claude Code. Run multiple AI agents simultaneously with shared context, file locking & real-time sync.">
    <meta name="twitter:image" content="{{ config('app.url') }}/twitter-card.svg">

    <!-- Fonts: preconnect + preload (actual loading via CSS import in app.css) -->
    <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.bunny.net">
    <link rel="preload" href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" as="style">

    <!-- JSON-LD Structured Data -->
    @php
    $appUrl = config('app.url');
    $jsonLd = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'WebSite',
                'name' => 'ClaudeNest',
                'url' => $appUrl,
                'description' => 'Remote Claude Code orchestration platform',
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => $appUrl . '/docs?q={search_term_string}',
                    'query-input' => 'required name=search_term_string',
                ],
            ],
            [
                '@type' => 'Organization',
                'name' => 'ClaudeNest',
                'url' => $appUrl,
                'logo' => $appUrl . '/favicon.svg',
                'sameAs' => [
                    'https://github.com/claudenest/claudenest',
                    'https://x.com/claudenest',
                ],
            ],
            [
                '@type' => 'SoftwareApplication',
                'name' => 'ClaudeNest',
                'applicationCategory' => 'DeveloperApplication',
                'operatingSystem' => 'Linux, macOS, Windows',
                'offers' => [
                    '@type' => 'Offer',
                    'price' => '0',
                    'priceCurrency' => 'USD',
                ],
                'description' => 'Remote orchestration platform for Claude Code with multi-agent coordination, RAG-powered context sharing, and real-time WebSocket communication.',
                'featureList' => [
                    'Remote Claude Code access',
                    'Multi-agent coordination',
                    'RAG context with pgvector',
                    'File locking',
                    'Real-time WebSocket',
                    'MCP support',
                    'Mobile apps',
                ],
            ],
            [
                '@type' => 'FAQPage',
                'mainEntity' => [
                    [
                        '@type' => 'Question',
                        'name' => 'What is ClaudeNest?',
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text' => 'ClaudeNest is an open-source remote orchestration platform for Claude Code. It lets you control Claude Code instances from anywhere, coordinate multiple AI agents on the same project, and share context via RAG-powered embeddings.',
                        ],
                    ],
                    [
                        '@type' => 'Question',
                        'name' => 'Is ClaudeNest free?',
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text' => 'Yes, ClaudeNest Community edition is 100% free and open-source. You can self-host it on your own infrastructure with no limits.',
                        ],
                    ],
                    [
                        '@type' => 'Question',
                        'name' => 'How does multi-agent coordination work?',
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text' => 'ClaudeNest uses file locking to prevent conflicts, shared context via pgvector embeddings for knowledge sharing, and atomic task claiming for coordinated work distribution between Claude Code instances.',
                        ],
                    ],
                    [
                        '@type' => 'Question',
                        'name' => 'What tech stack does ClaudeNest use?',
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text' => 'ClaudeNest uses Laravel 12 for the backend API, Vue.js 3 for the web dashboard, React Native for mobile apps, PostgreSQL with pgvector for RAG, and Laravel Reverb for real-time WebSocket communication.',
                        ],
                    ],
                ],
            ],
            [
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Home',
                        'item' => $appUrl,
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => 'Documentation',
                        'item' => $appUrl . '/docs',
                    ],
                ],
            ],
        ],
    ];
    @endphp
    <script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}</script>

    <!-- Instant theme application (prevent FOUC) -->
    <script>
        (function(){var t=localStorage.getItem('claudenest-theme');
        if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))
        document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark')})();
    </script>

    <!-- Reverb WebSocket Config -->
    <script>
        window.ClaudeNest = {
            reverb: {
                key: @json(config('claudenest.reverb_client.key')),
                host: @json(config('claudenest.reverb_client.host')),
                port: @json(config('claudenest.reverb_client.port')),
                scheme: @json(config('claudenest.reverb_client.scheme')),
            }
        };
    </script>

    <!-- Vite -->
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
</head>
<body class="antialiased">
    <div id="app"></div>
</body>
</html>
