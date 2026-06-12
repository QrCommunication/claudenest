@php
    /*
     * SEO meta resolution — longest-prefix match against config('seo.routes').
     *
     * The '/' entry only matches the landing page exactly; every other entry
     * matches itself and any sub-path (e.g. '/docs/api' covers
     * '/docs/api/machines'). Unmatched paths are private app routes: they
     * receive the defaults plus a noindex robots meta.
     */
    $seoConfig = config('seo', []);
    $appUrl = rtrim(config('app.url'), '/');

    $path = request()->getPathInfo();
    if ($path !== '/' && str_ends_with($path, '/')) {
        $path = rtrim($path, '/');
    }

    $seoMatch = null;
    $seoMatchLength = -1;
    foreach (($seoConfig['routes'] ?? []) as $seoPrefix => $seoMeta) {
        $prefixMatches = $seoPrefix === '/'
            ? $path === '/'
            : ($path === $seoPrefix || str_starts_with($path, $seoPrefix . '/'));
        if ($prefixMatches && strlen($seoPrefix) > $seoMatchLength) {
            $seoMatch = $seoMeta;
            $seoMatchLength = strlen($seoPrefix);
        }
    }

    $isPublicPage = $seoMatch !== null;
    $seo = array_merge($seoConfig['defaults'] ?? [], $seoMatch ?? []);
    $canonicalUrl = $appUrl . $path;
    $ogImageUrl = $appUrl . ($seoConfig['og_image'] ?? '/og-image.png');

    // JSON-LD graph: Organization on every public page, SoftwareApplication
    // on / and /pricing, TechArticle on /docs/*. FAQPage and HowTo are
    // deliberately excluded.
    $organization = [
        '@type' => 'Organization',
        '@id' => $appUrl . '/#organization',
        'name' => 'ClaudeNest',
        'url' => $appUrl,
        'logo' => $appUrl . '/favicon.svg',
        'sameAs' => [$seoConfig['github_url'] ?? 'https://github.com/QrCommunication/claudenest'],
    ];
    $jsonLdGraph = [$organization];

    if (in_array($path, ['/', '/pricing'], true)) {
        $jsonLdGraph[] = [
            '@type' => 'SoftwareApplication',
            'name' => 'ClaudeNest',
            'applicationCategory' => 'DeveloperApplication',
            'operatingSystem' => 'Linux, macOS, Windows',
            'softwareVersion' => $seoConfig['version'] ?? '1.5.0',
            'license' => $seoConfig['license_url'] ?? 'https://polyformproject.org/licenses/noncommercial/1.0.0/',
            'url' => $appUrl,
            'description' => $seoConfig['routes']['/']['description'] ?? ($seoConfig['defaults']['description'] ?? ''),
            'offers' => [
                [
                    '@type' => 'Offer',
                    'name' => 'Community',
                    'price' => '0',
                    'priceCurrency' => 'USD',
                ],
                [
                    '@type' => 'Offer',
                    'name' => 'Pro',
                    'price' => '29',
                    'priceCurrency' => 'USD',
                    'priceSpecification' => [
                        '@type' => 'UnitPriceSpecification',
                        'price' => '29',
                        'priceCurrency' => 'USD',
                        'billingDuration' => 'P1M',
                    ],
                ],
            ],
        ];
    }

    if ($path === '/docs' || str_starts_with($path, '/docs/')) {
        $jsonLdGraph[] = [
            '@type' => 'TechArticle',
            'headline' => $seo['title'],
            'description' => $seo['description'],
            'url' => $canonicalUrl,
            'dateModified' => $seo['updated'],
            'publisher' => ['@id' => $appUrl . '/#organization'],
        ];
    }

    $jsonLd = [
        '@context' => 'https://schema.org',
        '@graph' => $jsonLdGraph,
    ];
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $seo['title'] }}</title>
    <meta name="description" content="{{ $seo['description'] }}">
    <meta name="author" content="ClaudeNest">
    <meta name="theme-color" content="#a855f7">
    @if ($isPublicPage)
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    @else
    <meta name="robots" content="noindex, nofollow">
    @endif

    <!-- Canonical URL -->
    <link rel="canonical" href="{{ $canonicalUrl }}">

    <!-- hreflang: EN / FR -->
    <link rel="alternate" hreflang="en" href="{{ $canonicalUrl }}">
    <link rel="alternate" hreflang="fr" href="{{ $canonicalUrl }}?lang=fr">
    <link rel="alternate" hreflang="x-default" href="{{ $canonicalUrl }}">

    <!-- Favicon & Manifest -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
    <link rel="manifest" href="/manifest.webmanifest">

    <!-- Open Graph -->
    <meta property="og:type" content="{{ $seo['og_type'] }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
    <meta property="og:title" content="{{ $seo['title'] }}">
    <meta property="og:description" content="{{ $seo['description'] }}">
    <meta property="og:image" content="{{ $ogImageUrl }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="ClaudeNest">
    <meta property="og:locale" content="en_US">
    <meta property="og:locale:alternate" content="fr_FR">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $seo['title'] }}">
    <meta name="twitter:description" content="{{ $seo['description'] }}">
    <meta name="twitter:image" content="{{ $ogImageUrl }}">

    <!-- Fonts: preconnect + preload (actual loading via CSS import in app.css) -->
    <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.bunny.net">
    <link rel="preload" href="https://fonts.bunny.net/css?family=ibm-plex-sans:400,500,600,700|jetbrains-mono:400,500,600,700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>

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
