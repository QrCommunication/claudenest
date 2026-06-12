<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * SEO / GEO surface tests.
 *
 * Covers the config/seo.php-driven meta injection in app.blade.php,
 * the /llms.txt route, and the static robots.txt / sitemap.xml files.
 * robots.txt and sitemap.xml are asserted on disk because static public
 * files are served by the web server, not by the Laravel router.
 */
class SeoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Meta assertions must not depend on the frontend build state.
        $this->withoutVite();
    }

    public function test_landing_page_has_seo_title_and_software_application_json_ld(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('<title>ClaudeNest — Orchestrate Parallel Claude Code Workers</title>', false);
        $response->assertSee('SoftwareApplication', false);
        $response->assertSee('DeveloperApplication', false);
        $response->assertSee('"softwareVersion":"1.5.0"', false);
        $response->assertSee('og-image.png', false);

        // Forbidden structured data (veracity rules).
        $response->assertDontSee('FAQPage', false);
        $response->assertDontSee('HowTo', false);
        $response->assertDontSee('aggregateRating', false);
        $response->assertDontSee('twitter:site', false);
    }

    public function test_pricing_page_has_dedicated_title_and_software_application(): void
    {
        $response = $this->get('/pricing');

        $response->assertOk();
        $response->assertSee('<title>ClaudeNest Pricing — Free Self-Hosted, Pro $29/mo</title>', false);
        $response->assertSee('SoftwareApplication', false);
        $response->assertSee('UnitPriceSpecification', false);
    }

    public function test_docs_page_has_tech_article_json_ld_and_prefix_resolved_title(): void
    {
        $response = $this->get('/docs/installation');

        $response->assertOk();
        $response->assertSee('<title>Install ClaudeNest — Self-Host in 15 Minutes</title>', false);
        $response->assertSee('TechArticle', false);
        $response->assertSee('dateModified', false);

        // A deep docs path resolves through the longest matching prefix.
        $deep = $this->get('/docs/api/machines');
        $deep->assertOk();
        $deep->assertSee('<title>API Reference — ClaudeNest Documentation</title>', false);
    }

    public function test_llms_txt_is_served_as_plain_text(): void
    {
        $response = $this->get('/llms.txt');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $this->assertStringContainsString('ClaudeNest is a self-hosted', $response->getContent());
        $this->assertStringContainsString('PolyForm Noncommercial', $response->getContent());
    }

    public function test_robots_txt_exists_with_ai_crawler_groups_and_sitemap(): void
    {
        $robotsPath = public_path('robots.txt');

        $this->assertFileExists($robotsPath);

        $content = (string) file_get_contents($robotsPath);
        $this->assertStringContainsString('Sitemap: https://claudenest.io/sitemap.xml', $content);
        $this->assertStringContainsString('User-agent: GPTBot', $content);
        $this->assertStringContainsString('User-agent: ClaudeBot', $content);
        $this->assertStringContainsString('Disallow: /dashboard', $content);
        $this->assertStringNotContainsString('Crawl-delay', $content);
    }

    public function test_sitemap_exists_and_lists_public_routes_with_lastmod(): void
    {
        $sitemapPath = public_path('sitemap.xml');

        $this->assertFileExists($sitemapPath);

        $content = (string) file_get_contents($sitemapPath);
        $this->assertStringContainsString('<loc>https://claudenest.io/pricing</loc>', $content);
        $this->assertStringContainsString('<loc>https://claudenest.io/docs/installation</loc>', $content);
        $this->assertStringContainsString('<lastmod>', $content);

        // Stale server-side-only docs URLs must not be advertised.
        $this->assertStringNotContainsString('https://claudenest.io/docs/machines</loc>', $content);
    }

    public function test_private_app_routes_are_noindex(): void
    {
        $response = $this->get('/dashboard');

        $response->assertOk();
        $response->assertSee('noindex, nofollow', false);
        $response->assertDontSee('SoftwareApplication', false);
    }
}
