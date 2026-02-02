<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'ClaudeNest') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=jetbrains-mono:400,500,600,700|inter:400,500,600,700&display=swap" rel="stylesheet" />

    <!-- Brand Colors -->
    <style>
        :root {
            --color-primary: #a855f7;
            --color-indigo: #6366f1;
            --color-cyan: #22d3ee;
            --color-bg: #1a1b26;
        }
    </style>

    @vite(['resources/css/app.css', 'resources/js/app.ts'])
</head>
<body class="font-sans antialiased bg-[#1a1b26] text-white">
    <div id="app"></div>
</body>
</html>
