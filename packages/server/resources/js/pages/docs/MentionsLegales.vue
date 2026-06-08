<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsMentionslegales.pageTitle') }}</h1>
      <p class="lead">
        {{ $t('docDocsMentionslegales.leadIntro') }}
      </p>
      <p class="last-updated">{{ $t('docDocsMentionslegales.effectiveDate') }}</p>
    </header>

    <!-- Table of Contents -->
    <nav class="policy-toc">
      <h2>{{ $t('docDocsMentionslegales.tocTitle') }}</h2>
      <ol>
        <li><a href="#editeur">{{ $t('docDocsMentionslegales.tocEditeur') }}</a></li>
        <li><a href="#directeur-publication">{{ $t('docDocsMentionslegales.tocDirecteur') }}</a></li>
        <li><a href="#hebergement">{{ $t('docDocsMentionslegales.tocHebergement') }}</a></li>
        <li><a href="#propriete-intellectuelle">{{ $t('docDocsMentionslegales.tocPropriete') }}</a></li>
        <li><a href="#licence">{{ $t('docDocsMentionslegales.tocLicence') }}</a></li>
        <li><a href="#donnees-personnelles">{{ $t('docDocsMentionslegales.tocDonnees') }}</a></li>
        <li><a href="#cookies">{{ $t('docDocsMentionslegales.tocCookies') }}</a></li>
        <li><a href="#responsabilite">{{ $t('docDocsMentionslegales.tocResponsabilite') }}</a></li>
        <li><a href="#liens-hypertextes">{{ $t('docDocsMentionslegales.tocLiens') }}</a></li>
        <li><a href="#droit-applicable">{{ $t('docDocsMentionslegales.tocDroit') }}</a></li>
        <li><a href="#contact">{{ $t('docDocsMentionslegales.tocContact') }}</a></li>
      </ol>
    </nav>

    <!-- Section 1: Editeur -->
    <section id="editeur">
      <h2 id="editeur">{{ $t('docDocsMentionslegales.editeurHeading') }}</h2>
      <p v-html="$t('docDocsMentionslegales.editeurIntro')"></p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        </div>
        <div>
          <h4>QR Communication</h4>
          <div class="company-details">
            <div class="detail-row">
              <span class="detail-label">{{ $t('docDocsMentionslegales.detailFormeLabel') }}</span>
              <span class="detail-value">{{ $t('docDocsMentionslegales.detailFormeValue') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">SIREN</span>
              <span class="detail-value">940 163 496</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('docDocsMentionslegales.detailApeLabel') }}</span>
              <span class="detail-value">{{ $t('docDocsMentionslegales.detailApeValue') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('docDocsMentionslegales.detailSiegeLabel') }}</span>
              <span class="detail-value">{{ $t('docDocsMentionslegales.detailSiegeValue') }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value"><a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ $t('docDocsMentionslegales.detailTelephoneLabel') }}</span>
              <span class="detail-value"><a href="tel:+33188833451">+33 1 88 83 34 51</a></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">RCS</span>
              <span class="detail-value">Paris</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Directeur de la publication -->
    <section id="directeur-publication">
      <h2 id="directeur-publication">{{ $t('docDocsMentionslegales.directeurHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.directeurPara1') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.directeurContactLabel') }} <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
      </p>
    </section>

    <!-- Section 3: Hebergement -->
    <section id="hebergement">
      <h2 id="hebergement">{{ $t('docDocsMentionslegales.hebergementHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.hebergementIntro') }}
      </p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsMentionslegales.hebergementCardTitle') }}</h4>
          <p>
            {{ $t('docDocsMentionslegales.hebergementCardBody') }}
          </p>
        </div>
      </div>
      <p>
        {{ $t('docDocsMentionslegales.hebergementPara2') }}
      </p>
    </section>

    <!-- Section 4: Propriete intellectuelle -->
    <section id="propriete-intellectuelle">
      <h2 id="propriete-intellectuelle">{{ $t('docDocsMentionslegales.proprieteHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.proprietePara1') }}
      </p>
      <p v-html="$t('docDocsMentionslegales.proprietePara2')"></p>
      <p>
        {{ $t('docDocsMentionslegales.proprietePara3') }}
      </p>
    </section>

    <!-- Section 5: Licence -->
    <section id="licence">
      <h2 id="licence">{{ $t('docDocsMentionslegales.licenceHeading') }}</h2>
      <p v-html="$t('docDocsMentionslegales.licencePara1')"></p>
      <div class="warning-card">
        <div class="warning-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsMentionslegales.licenceWarningTitle') }}</h4>
          <p>
            {{ $t('docDocsMentionslegales.licenceWarningBody1') }} <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
            {{ $t('docDocsMentionslegales.licenceWarningBody2') }}
          </p>
        </div>
      </div>
      <p>
        {{ $t('docDocsMentionslegales.licencePara2Before') }} <code>LICENSES</code>
        {{ $t('docDocsMentionslegales.licencePara2After') }}
      </p>
    </section>

    <!-- Section 6: Donnees personnelles -->
    <section id="donnees-personnelles">
      <h2 id="donnees-personnelles">{{ $t('docDocsMentionslegales.donneesHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.donneesPara1') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.donneesPara2Before') }}
        <router-link to="/docs/privacy">{{ $t('docDocsMentionslegales.donneesPrivacyLink') }}</router-link>{{ $t('docDocsMentionslegales.donneesPara2After') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.donneesRightsIntro') }}
      </p>
      <ul>
        <li>{{ $t('docDocsMentionslegales.donneesRightAcces') }}</li>
        <li>{{ $t('docDocsMentionslegales.donneesRightRectification') }}</li>
        <li>{{ $t('docDocsMentionslegales.donneesRightEffacement') }}</li>
        <li>{{ $t('docDocsMentionslegales.donneesRightLimitation') }}</li>
        <li>{{ $t('docDocsMentionslegales.donneesRightPortabilite') }}</li>
        <li>{{ $t('docDocsMentionslegales.donneesRightOpposition') }}</li>
      </ul>
      <p>
        {{ $t('docDocsMentionslegales.donneesExerciceBefore') }}
        <a href="mailto:dpo@claudenest.io">dpo@claudenest.io</a>.
        {{ $t('docDocsMentionslegales.donneesExerciceAfter') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.donneesCnilIntro') }}
      </p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
        </div>
        <div>
          <h4>CNIL</h4>
          <p>
            {{ $t('docDocsMentionslegales.cnilName') }}<br>
            {{ $t('docDocsMentionslegales.cnilAddress') }}<br>
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
          </p>
        </div>
      </div>
    </section>

    <!-- Section 7: Cookies -->
    <section id="cookies">
      <h2 id="cookies">{{ $t('docDocsMentionslegales.cookiesHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.cookiesPara1') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.cookiesPara2Before') }}
        <router-link to="/docs/cookies">{{ $t('docDocsMentionslegales.cookiesPolicyLink') }}</router-link>{{ $t('docDocsMentionslegales.cookiesPara2After') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.cookiesPara3') }}
      </p>
    </section>

    <!-- Section 8: Responsabilite -->
    <section id="responsabilite">
      <h2 id="responsabilite">{{ $t('docDocsMentionslegales.responsabiliteHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.responsabilitePara1') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.responsabiliteListIntro') }}
      </p>
      <ul>
        <li>
          {{ $t('docDocsMentionslegales.responsabiliteItem1') }}
        </li>
        <li>
          {{ $t('docDocsMentionslegales.responsabiliteItem2') }}
        </li>
        <li>
          {{ $t('docDocsMentionslegales.responsabiliteItem3') }}
        </li>
        <li>
          {{ $t('docDocsMentionslegales.responsabiliteItem4') }}
        </li>
      </ul>
      <p v-html="$t('docDocsMentionslegales.responsabilitePara2')"></p>
    </section>

    <!-- Section 9: Liens hypertextes -->
    <section id="liens-hypertextes">
      <h2 id="liens-hypertextes">{{ $t('docDocsMentionslegales.liensHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.liensPara1') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.liensPara2') }}
      </p>
      <ul>
        <li>{{ $t('docDocsMentionslegales.liensItem1') }}</li>
        <li>{{ $t('docDocsMentionslegales.liensItem2') }}</li>
        <li>{{ $t('docDocsMentionslegales.liensItem3') }}</li>
      </ul>
    </section>

    <!-- Section 10: Droit applicable -->
    <section id="droit-applicable">
      <h2 id="droit-applicable">{{ $t('docDocsMentionslegales.droitHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.droitPara1') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.droitPara2') }}
      </p>
      <p>
        {{ $t('docDocsMentionslegales.droitPara3') }}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr</a>.
      </p>
    </section>

    <!-- Section 11: Contact -->
    <section id="contact">
      <h2 id="contact">{{ $t('docDocsMentionslegales.contactHeading') }}</h2>
      <p>
        {{ $t('docDocsMentionslegales.contactIntro') }}
      </p>
      <div class="contact-cards">
        <div class="contact-card">
          <div class="contact-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div>
            <h4>Email</h4>
            <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
          </div>
        </div>
        <div class="contact-card">
          <div class="contact-icon support-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsMentionslegales.contactTelephoneTitle') }}</h4>
            <a href="tel:+33188833451">+33 1 88 83 34 51</a>
          </div>
        </div>
        <div class="contact-card">
          <div class="contact-icon privacy-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsMentionslegales.contactAdresseTitle') }}</h4>
            <p>QR Communication<br>23 rue de Richelieu<br>75001 Paris, France</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="terms-footer">
      <div class="footer-divider"></div>
      <p class="footer-text">
        {{ $t('docDocsMentionslegales.footerText') }}
      </p>
      <p class="footer-meta">
        {{ $t('docDocsMentionslegales.footerMeta') }}
      </p>
    </footer>
  </article>
</template>

<script setup lang="ts">
// No external dependencies needed for this static legal page.
// The DocsLayout's TableOfContents component automatically picks up
// h2/h3/h4 elements with id attributes from .doc-content.
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

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
  margin: 0 0 1rem;
}

.last-updated {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}

/* Table of Contents */
.policy-toc {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  margin-bottom: 3rem;
}

.policy-toc h2 {
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.policy-toc ol {
  margin: 0;
  padding-left: 1.25rem;
}

.policy-toc li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.policy-toc a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.policy-toc a:hover {
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
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-primary);
}

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul, ol {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

li strong {
  color: var(--text-primary);
}

a {
  color: var(--accent-purple, #a855f7);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

strong {
  color: var(--text-primary);
}

/* Info Card */
.info-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-indigo, #6366f1) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-indigo, #6366f1) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.info-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: color-mix(in srgb, var(--accent-indigo, #6366f1) 15%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-indigo, #6366f1);
}

.info-icon svg {
  width: 20px;
  height: 20px;
}

.info-card h4 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.info-card p {
  margin: 0;
  font-size: 0.9rem;
}

/* Company Details */
.company-details {
  display: grid;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  gap: 1rem;
  align-items: baseline;
  font-size: 0.9rem;
}

.detail-label {
  min-width: 130px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-size: 0.8rem;
}

.detail-value {
  color: var(--text-secondary);
}

.detail-value a {
  color: var(--accent-purple, #a855f7);
}

/* Warning Card */
.warning-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(251, 191, 36, 0.06);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.warning-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: rgba(251, 191, 36, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
}

.warning-icon svg {
  width: 20px;
  height: 20px;
}

.warning-card h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  color: #fbbf24;
}

.warning-card p {
  margin: 0;
  font-size: 0.9rem;
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

.contact-card p {
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
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

/* Responsive */
@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .lead {
    font-size: 1.1rem;
  }

  .info-card,
  .warning-card {
    flex-direction: column;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.15rem;
  }

  .detail-label {
    min-width: auto;
  }
}
</style>
