<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'ClaudeNest') }} - Remote Claude Code Orchestration</title>
    <meta name="description" content="ClaudeNest - Remote Claude Code orchestration platform. Control Claude Code from anywhere, coordinate multiple agents, and leverage RAG-powered context sharing.">
    <meta name="keywords" content="Claude Code, AI, orchestration, remote, multi-agent, RAG, pgvector, terminal">
    <meta name="author" content="ClaudeNest">
    <meta name="theme-color" content="#a855f7">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/apple-touch-icon.svg">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ config('app.url') }}">
    <meta property="og:title" content="{{ config('app.name', 'ClaudeNest') }} - Remote Claude Code Orchestration">
    <meta property="og:description" content="Control Claude Code from anywhere. Multi-agent coordination with RAG-powered context sharing.">
    <meta property="og:image" content="{{ config('app.url') }}/og-image.svg">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ config('app.url') }}">
    <meta property="twitter:title" content="{{ config('app.name', 'ClaudeNest') }} - Remote Claude Code Orchestration">
    <meta property="twitter:description" content="Control Claude Code from anywhere. Multi-agent coordination with RAG-powered context sharing.">
    <meta property="twitter:image" content="{{ config('app.url') }}/twitter-card.svg">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=jetbrains-mono:400,500,600,700|inter:400,500,600,700&display=swap" rel="stylesheet" />

    <!-- Vite -->
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
</head>
<body class="bg-dark-1 text-white antialiased">
    <div id="app"></div>
</body>
</html>
