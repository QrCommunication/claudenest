<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsTermsofservice.pageTitle') }}</h1>
      <p class="lead">
        {{ $t('docDocsTermsofservice.leadIntro') }}
      </p>
      <div class="meta-info">
        <span class="meta-item">
          <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
          </svg>
          {{ $t('docDocsTermsofservice.effectiveDate') }}
        </span>
        <span class="meta-item">
          <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
            <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
          {{ $t('docDocsTermsofservice.versionLabel') }}
        </span>
      </div>
    </header>

    <!-- Section 1: Acceptance of Terms -->
    <section id="acceptance-of-terms">
      <h2 id="acceptance">{{ $t('docDocsTermsofservice.s1Title') }}</h2>
      <p>
        {{ $t('docDocsTermsofservice.s1Para1') }}
      </p>
      <p>
        {{ $t('docDocsTermsofservice.s1Para2') }}
      </p>
      <div class="notice notice-info">
        <div class="notice-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div class="notice-content">
          <strong>{{ $t('docDocsTermsofservice.s1NoticeStrong') }}</strong> {{ $t('docDocsTermsofservice.s1NoticeText') }}
        </div>
      </div>
    </section>

    <!-- Section 2: Service Description -->
    <section id="service-description">
      <h2 id="description">{{ $t('docDocsTermsofservice.s2Title') }}</h2>
      <p>
        {{ $t('docDocsTermsofservice.s2Para1') }}
      </p>
      <ul>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s2Item1Strong') }}</strong> {{ $t('docDocsTermsofservice.s2Item1Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s2Item2Strong') }}</strong> {{ $t('docDocsTermsofservice.s2Item2Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s2Item3Strong') }}</strong> {{ $t('docDocsTermsofservice.s2Item3Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s2Item4Strong') }}</strong> {{ $t('docDocsTermsofservice.s2Item4Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s2Item5Strong') }}</strong> {{ $t('docDocsTermsofservice.s2Item5Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s2Item6Strong') }}</strong> {{ $t('docDocsTermsofservice.s2Item6Text') }}
        </li>
      </ul>
      <p>
        {{ $t('docDocsTermsofservice.s2Para2') }}
      </p>
    </section>

    <!-- Section 3: User Accounts -->
    <section id="user-accounts">
      <h2 id="accounts">{{ $t('docDocsTermsofservice.s3Title') }}</h2>

      <h3 id="account-creation">{{ $t('docDocsTermsofservice.s3_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s3_1Para') }}
      </p>

      <h3 id="account-security">{{ $t('docDocsTermsofservice.s3_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s3_2Para') }}
      </p>
      <ul>
        <li>{{ $t('docDocsTermsofservice.s3_2Item1') }}</li>
        <li>{{ $t('docDocsTermsofservice.s3_2Item2') }}</li>
        <li>{{ $t('docDocsTermsofservice.s3_2Item3') }}</li>
        <li>{{ $t('docDocsTermsofservice.s3_2Item4') }}</li>
      </ul>
      <p>
        {{ $t('docDocsTermsofservice.s3_2Para2') }}
      </p>

      <h3 id="account-eligibility">{{ $t('docDocsTermsofservice.s3_3Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s3_3Para') }}
      </p>
    </section>

    <!-- Section 4: Acceptable Use -->
    <section id="acceptable-use">
      <h2 id="use-policy">{{ $t('docDocsTermsofservice.s4Title') }}</h2>
      <p>
        {{ $t('docDocsTermsofservice.s4Para1') }}
      </p>

      <h3 id="prohibited-activities">{{ $t('docDocsTermsofservice.s4_1Title') }}</h3>
      <ol>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item1') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item2') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item3') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item4') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item5') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item6') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item7') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s4_1Item8') }}
        </li>
      </ol>

      <h3 id="resource-limits">{{ $t('docDocsTermsofservice.s4_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s4_2Para') }}
      </p>
    </section>

    <!-- Section 5: Intellectual Property -->
    <section id="intellectual-property">
      <h2 id="ip-rights">{{ $t('docDocsTermsofservice.s5Title') }}</h2>

      <h3 id="our-ip">{{ $t('docDocsTermsofservice.s5_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s5_1Para') }}
      </p>

      <h3 id="your-content">{{ $t('docDocsTermsofservice.s5_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s5_2Para1') }}
      </p>
      <p>
        {{ $t('docDocsTermsofservice.s5_2Para2') }}
      </p>

      <h3 id="open-source">{{ $t('docDocsTermsofservice.s5_3Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s5_3Para') }}
      </p>
      <p>
        {{ $t('docDocsTermsofservice.s5_3Para2Before') }}
        <a href="https://polyformproject.org/licenses/noncommercial/1.0.0/" target="_blank" rel="noopener noreferrer">polyformproject.org/licenses/noncommercial/1.0.0</a>
        {{ $t('docDocsTermsofservice.s5_3Para2Mid') }}
        <a href="https://github.com/QrCommunication/claudenest" target="_blank" rel="noopener noreferrer">github.com/QrCommunication/claudenest</a>{{ $t('docDocsTermsofservice.s5_3Para2After') }}
      </p>
    </section>

    <!-- Section 6: Data Protection -->
    <section id="data-protection">
      <h2 id="data-privacy">{{ $t('docDocsTermsofservice.s6Title') }}</h2>

      <h3 id="gdpr-compliance">{{ $t('docDocsTermsofservice.s6_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s6_1Para1') }}
        <router-link to="/docs/privacy">{{ $t('docDocsTermsofservice.privacyPolicyLink') }}</router-link>{{ $t('docDocsTermsofservice.s6_1Para2') }}
      </p>

      <h3 id="data-collection">{{ $t('docDocsTermsofservice.s6_2Title') }}</h3>
      <p>{{ $t('docDocsTermsofservice.s6_2Para') }}</p>
      <ul>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s6_2Item1Strong') }}</strong> {{ $t('docDocsTermsofservice.s6_2Item1Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s6_2Item2Strong') }}</strong> {{ $t('docDocsTermsofservice.s6_2Item2Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s6_2Item3Strong') }}</strong> {{ $t('docDocsTermsofservice.s6_2Item3Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsTermsofservice.s6_2Item4Strong') }}</strong> {{ $t('docDocsTermsofservice.s6_2Item4Text') }}
        </li>
      </ul>

      <h3 id="your-rights">{{ $t('docDocsTermsofservice.s6_3Title') }}</h3>
      <p>{{ $t('docDocsTermsofservice.s6_3Para') }}</p>
      <div class="rights-grid">
        <div class="right-item">
          <strong>{{ $t('docDocsTermsofservice.rightAccessTitle') }}</strong>
          <p>{{ $t('docDocsTermsofservice.rightAccessText') }}</p>
        </div>
        <div class="right-item">
          <strong>{{ $t('docDocsTermsofservice.rightRectificationTitle') }}</strong>
          <p>{{ $t('docDocsTermsofservice.rightRectificationText') }}</p>
        </div>
        <div class="right-item">
          <strong>{{ $t('docDocsTermsofservice.rightErasureTitle') }}</strong>
          <p>{{ $t('docDocsTermsofservice.rightErasureText') }}</p>
        </div>
        <div class="right-item">
          <strong>{{ $t('docDocsTermsofservice.rightPortabilityTitle') }}</strong>
          <p>{{ $t('docDocsTermsofservice.rightPortabilityText') }}</p>
        </div>
        <div class="right-item">
          <strong>{{ $t('docDocsTermsofservice.rightRestrictionTitle') }}</strong>
          <p>{{ $t('docDocsTermsofservice.rightRestrictionText') }}</p>
        </div>
        <div class="right-item">
          <strong>{{ $t('docDocsTermsofservice.rightObjectionTitle') }}</strong>
          <p>{{ $t('docDocsTermsofservice.rightObjectionText') }}</p>
        </div>
      </div>
      <p>
        {{ $t('docDocsTermsofservice.s6_3Para2Before') }}
        <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>{{ $t('docDocsTermsofservice.s6_3Para2After') }}
      </p>

      <h3 id="data-retention">{{ $t('docDocsTermsofservice.s6_4Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s6_4Para') }}
      </p>

      <h3 id="data-transfers">{{ $t('docDocsTermsofservice.s6_5Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s6_5Para') }}
      </p>
    </section>

    <!-- Section 7: Service Availability -->
    <section id="service-availability">
      <h2 id="sla">{{ $t('docDocsTermsofservice.s7Title') }}</h2>

      <h3 id="uptime-commitment">{{ $t('docDocsTermsofservice.s7_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s7_1Para') }}
      </p>

      <h3 id="maintenance">{{ $t('docDocsTermsofservice.s7_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s7_2Para') }}
      </p>

      <h3 id="force-majeure">{{ $t('docDocsTermsofservice.s7_3Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s7_3Para') }}
      </p>
    </section>

    <!-- Section 8: Limitation of Liability -->
    <section id="limitation-of-liability">
      <h2 id="liability">{{ $t('docDocsTermsofservice.s8Title') }}</h2>

      <h3 id="disclaimer">{{ $t('docDocsTermsofservice.s8_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s8_1Para1') }}
      </p>
      <p>
        {{ $t('docDocsTermsofservice.s8_1Para2') }}
      </p>

      <h3 id="liability-cap">{{ $t('docDocsTermsofservice.s8_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s8_2Para') }}
      </p>
      <ul>
        <li>{{ $t('docDocsTermsofservice.s8_2Item1') }}</li>
        <li>{{ $t('docDocsTermsofservice.s8_2Item2') }}</li>
        <li>
          {{ $t('docDocsTermsofservice.s8_2Item3') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s8_2Item4') }}
        </li>
      </ul>
      <div class="notice notice-warning">
        <div class="notice-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <div class="notice-content">
          {{ $t('docDocsTermsofservice.s8_2Notice') }}
        </div>
      </div>

      <h3 id="consumer-rights">{{ $t('docDocsTermsofservice.s8_3Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s8_3Para') }}
      </p>
    </section>

    <!-- Section 9: Termination -->
    <section id="termination">
      <h2 id="termination-heading">{{ $t('docDocsTermsofservice.s9Title') }}</h2>

      <h3 id="termination-by-you">{{ $t('docDocsTermsofservice.s9_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s9_1Para1Before') }}
        <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a> {{ $t('docDocsTermsofservice.s9_1Para1After') }}
      </p>
      <ul>
        <li>{{ $t('docDocsTermsofservice.s9_1Item1') }}</li>
        <li>
          {{ $t('docDocsTermsofservice.s9_1Item2') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s9_1Item3') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s9_1Item4') }}
        </li>
      </ul>

      <h3 id="termination-by-us">{{ $t('docDocsTermsofservice.s9_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s9_2Para1') }}
      </p>
      <ol>
        <li>{{ $t('docDocsTermsofservice.s9_2Item1') }}</li>
        <li>{{ $t('docDocsTermsofservice.s9_2Item2') }}</li>
        <li>
          {{ $t('docDocsTermsofservice.s9_2Item3') }}
        </li>
        <li>{{ $t('docDocsTermsofservice.s9_2Item4') }}</li>
        <li>{{ $t('docDocsTermsofservice.s9_2Item5') }}</li>
      </ol>
      <p>
        {{ $t('docDocsTermsofservice.s9_2Para2') }}
      </p>

      <h3 id="survival">{{ $t('docDocsTermsofservice.s9_3Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s9_3Para') }}
      </p>
    </section>

    <!-- Section 10: Changes to Terms -->
    <section id="changes-to-terms">
      <h2 id="changes">{{ $t('docDocsTermsofservice.s10Title') }}</h2>
      <p>
        {{ $t('docDocsTermsofservice.s10Para1') }}
      </p>
      <ol>
        <li>
          {{ $t('docDocsTermsofservice.s10Item1') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s10Item2') }}
        </li>
        <li>
          {{ $t('docDocsTermsofservice.s10Item3') }}
        </li>
      </ol>
      <p>
        {{ $t('docDocsTermsofservice.s10Para2') }}
      </p>
      <p>
        {{ $t('docDocsTermsofservice.s10Para3') }}
      </p>
    </section>

    <!-- Section 11: Governing Law -->
    <section id="governing-law">
      <h2 id="law">{{ $t('docDocsTermsofservice.s11Title') }}</h2>

      <h3 id="applicable-law">{{ $t('docDocsTermsofservice.s11_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s11_1Para') }}
      </p>

      <h3 id="jurisdiction">{{ $t('docDocsTermsofservice.s11_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s11_2Para') }}
      </p>

      <h3 id="mediation">{{ $t('docDocsTermsofservice.s11_3Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s11_3Para') }}
      </p>

      <h3 id="eu-odr">{{ $t('docDocsTermsofservice.s11_4Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s11_4Para1') }}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr</a>.
        {{ $t('docDocsTermsofservice.s11_4Para2') }}
      </p>
    </section>

    <!-- Section 12: Contact Information -->
    <section id="contact-information">
      <h2 id="contact">{{ $t('docDocsTermsofservice.s12Title') }}</h2>
      <p>
        {{ $t('docDocsTermsofservice.s12Para') }}
      </p>
      <div class="contact-cards">
        <div class="contact-card">
          <div class="contact-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsTermsofservice.contactGeneralTitle') }}</h4>
            <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
          </div>
        </div>
        <div class="contact-card">
          <div class="contact-icon privacy-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsTermsofservice.contactDpoTitle') }}</h4>
            <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
          </div>
        </div>
        <div class="contact-card">
          <div class="contact-icon support-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-3.5h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsTermsofservice.contactSupportTitle') }}</h4>
            <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 13: Miscellaneous -->
    <section id="miscellaneous">
      <h2 id="misc">{{ $t('docDocsTermsofservice.s13Title') }}</h2>

      <h3 id="entire-agreement">{{ $t('docDocsTermsofservice.s13_1Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s13_1Para1') }}
        <router-link to="/docs/privacy">{{ $t('docDocsTermsofservice.privacyPolicyLink') }}</router-link> {{ $t('docDocsTermsofservice.s13_1Para2') }}
      </p>

      <h3 id="severability">{{ $t('docDocsTermsofservice.s13_2Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s13_2Para') }}
      </p>

      <h3 id="waiver">{{ $t('docDocsTermsofservice.s13_3Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s13_3Para') }}
      </p>

      <h3 id="assignment">{{ $t('docDocsTermsofservice.s13_4Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s13_4Para') }}
      </p>

      <h3 id="language">{{ $t('docDocsTermsofservice.s13_5Title') }}</h3>
      <p>
        {{ $t('docDocsTermsofservice.s13_5Para') }}
      </p>
    </section>

    <!-- Footer -->
    <footer class="terms-footer">
      <div class="footer-divider"></div>
      <p class="footer-text">
        {{ $t('docDocsTermsofservice.footerText') }}
      </p>
      <p class="footer-meta">
        {{ $t('docDocsTermsofservice.footerMeta') }}
      </p>
    </footer>
  </article>
</template>

<script setup lang="ts">
// No additional imports or logic needed for this static legal page.
// The DocsLayout's TableOfContents component automatically picks up
// h2/h3/h4 elements with id attributes from .doc-content.
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

/* Header */
.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.meta-icon {
  width: 18px;
  height: 18px;
  color: var(--accent-purple, #a855f7);
}

/* Sections */
section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  transition: color 0.2s ease;
}

h2:hover {
  color: var(--accent-purple, #a855f7);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 0.75rem;
  color: var(--text-primary);
  transition: color 0.2s ease;
}

h3:hover {
  color: var(--accent-cyan, #22d3ee);
}

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0 0 1rem;
}

/* Lists */
ul,
ol {
  color: var(--text-secondary);
  margin: 0 0 1.5rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.625rem;
  line-height: 1.7;
}

li strong {
  color: var(--text-primary);
}

/* Links */
a {
  color: var(--accent-purple, #a855f7);
  text-decoration: none;
  transition: color 0.15s ease;
}

a:hover {
  color: var(--accent-purple-light, #c084fc);
  text-decoration: underline;
}

/* Notice Boxes */
.notice {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  margin: 1.5rem 0;
}

.notice-info {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.notice-warning {
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.notice-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 2px;
}

.notice-info .notice-icon {
  color: var(--accent-indigo, #6366f1);
}

.notice-warning .notice-icon {
  color: #fbbf24;
}

.notice-icon svg {
  width: 24px;
  height: 24px;
}

.notice-content {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.7;
}

.notice-content strong {
  color: var(--text-primary);
}

/* GDPR Rights Grid */
.rights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.right-item {
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.right-item:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 6%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.right-item strong {
  display: block;
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 0.375rem;
}

.right-item p {
  font-size: 0.875rem;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Contact Cards */
.contact-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  transition: all 0.2s ease;
}

.contact-card:hover {
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent);
}

.contact-icon {
  width: 44px;
  height: 44px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-purple, #a855f7);
  flex-shrink: 0;
}

.contact-icon svg {
  width: 22px;
  height: 22px;
}

.contact-icon.privacy-icon {
  background: rgba(34, 211, 238, 0.15);
  color: var(--accent-cyan, #22d3ee);
}

.contact-icon.support-icon {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.contact-card h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--text-primary);
}

.contact-card a {
  font-size: 0.9rem;
  color: var(--accent-purple, #a855f7);
}

/* Footer */
.terms-footer {
  margin-top: 4rem;
  padding-top: 2rem;
}

.footer-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent),
    color-mix(in srgb, var(--accent-cyan, #22d3ee) 30%, transparent),
    transparent
  );
  margin-bottom: 2rem;
}

.footer-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-style: italic;
  text-align: center;
  line-height: 1.7;
}

.footer-meta {
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.5rem;
}

/* Inline code */
code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* Responsive */
@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .lead {
    font-size: 1.1rem;
  }

  .meta-info {
    flex-direction: column;
    gap: 0.75rem;
  }

  .rights-grid {
    grid-template-columns: 1fr;
  }

  h2 {
    font-size: 1.5rem;
  }

  h3 {
    font-size: 1.1rem;
  }
}
</style>
