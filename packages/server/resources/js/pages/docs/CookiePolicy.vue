<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsCookiepolicy.pageTitle') }}</h1>
      <p class="lead">
        {{ $t('docDocsCookiepolicy.lead') }}
      </p>
      <p class="last-updated">{{ $t('docDocsCookiepolicy.effectiveDate') }}</p>
    </header>

    <!-- Table of Contents -->
    <nav class="policy-toc">
      <h2>{{ $t('docDocsCookiepolicy.tocTitle') }}</h2>
      <ol>
        <li><a href="#responsable">{{ $t('docDocsCookiepolicy.tocResponsable') }}</a></li>
        <li><a href="#definition">{{ $t('docDocsCookiepolicy.tocDefinition') }}</a></li>
        <li><a href="#cookies-utilises">{{ $t('docDocsCookiepolicy.tocCookiesUtilises') }}</a></li>
        <li><a href="#stockage-local">{{ $t('docDocsCookiepolicy.tocStockageLocal') }}</a></li>
        <li><a href="#cookies-absents">{{ $t('docDocsCookiepolicy.tocCookiesAbsents') }}</a></li>
        <li><a href="#base-legale">{{ $t('docDocsCookiepolicy.tocBaseLegale') }}</a></li>
        <li><a href="#gestion-cookies">{{ $t('docDocsCookiepolicy.tocGestionCookies') }}</a></li>
        <li><a href="#auto-hebergement">{{ $t('docDocsCookiepolicy.tocAutoHebergement') }}</a></li>
        <li><a href="#modifications">{{ $t('docDocsCookiepolicy.tocModifications') }}</a></li>
        <li><a href="#contact">{{ $t('docDocsCookiepolicy.tocContact') }}</a></li>
      </ol>
    </nav>

    <!-- Section 1: Responsable -->
    <section id="responsable">
      <h2 id="responsable">{{ $t('docDocsCookiepolicy.s1Title') }}</h2>
      <p>
        Le responsable du traitement des donnees via les cookies deposes sur le site
        <strong>claudenest.io</strong> est :
      </p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        </div>
        <div>
          <h4>QR Communication (SAS)</h4>
          <p>
            SIREN 940 163 496 &mdash; 23 rue de Richelieu, 75001 Paris, France<br>
            {{ $t('docDocsCookiepolicy.emailLabel') }} <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
          </p>
        </div>
      </div>
    </section>

    <!-- Section 2: Definition -->
    <section id="definition">
      <h2 id="definition">{{ $t('docDocsCookiepolicy.s2Title') }}</h2>
      <p>
        Un cookie est un petit fichier texte depose sur votre terminal (ordinateur, tablette,
        smartphone) lors de la visite d'un site web. Il permet au site de reconnoitre votre
        navigateur lors de visites ulterieures et de stocker certaines informations techniques
        necessaires au fonctionnement du service.
      </p>
      <p>
        Le <strong>localStorage</strong> est un mecanisme de stockage similaire, propre au
        navigateur web, qui permet de conserver des donnees cote client de maniere persistante
        entre les sessions de navigation.
      </p>
    </section>

    <!-- Section 3: Cookies utilises -->
    <section id="cookies-utilises">
      <h2 id="cookies-utilises">{{ $t('docDocsCookiepolicy.s3Title') }}</h2>
      <p>
        ClaudeNest utilise exclusivement des <strong>cookies strictement necessaires</strong>
        au fonctionnement technique de la plateforme. Ces cookies ne necessitent pas le
        consentement de l'utilisateur conformement a l'article 82 de la loi Informatique
        et Libertes et aux lignes directrices de la CNIL.
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsCookiepolicy.thCookie') }}</th>
              <th>{{ $t('docDocsCookiepolicy.thCategorie') }}</th>
              <th>{{ $t('docDocsCookiepolicy.thFinalite') }}</th>
              <th>{{ $t('docDocsCookiepolicy.thDuree') }}</th>
              <th>{{ $t('docDocsCookiepolicy.thEmetteur') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>XSRF-TOKEN</code></td>
              <td>
                <span class="cookie-badge necessary">{{ $t('docDocsCookiepolicy.badgeNecessary') }}</span>
              </td>
              <td>
                {{ $t('docDocsCookiepolicy.xsrfPurpose') }}
              </td>
              <td>{{ $t('docDocsCookiepolicy.xsrfDuration') }}</td>
              <td>{{ $t('docDocsCookiepolicy.issuerLaravel') }}</td>
            </tr>
            <tr>
              <td><code>laravel_session</code></td>
              <td>
                <span class="cookie-badge necessary">{{ $t('docDocsCookiepolicy.badgeNecessary') }}</span>
              </td>
              <td>
                {{ $t('docDocsCookiepolicy.sessionPurpose') }}
              </td>
              <td>{{ $t('docDocsCookiepolicy.sessionDuration') }}</td>
              <td>{{ $t('docDocsCookiepolicy.issuerLaravel') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsCookiepolicy.cookieSecurityTitle') }}</h4>
          <p>
            En environnement de production, les cookies sont configures avec les attributs
            <code>Secure</code> (transmission HTTPS uniquement), <code>HttpOnly</code>
            (inaccessibles via JavaScript) et <code>SameSite=Lax</code> (protection
            contre les requetes cross-origin).
          </p>
        </div>
      </div>
    </section>

    <!-- Section 4: Stockage local -->
    <section id="stockage-local">
      <h2 id="stockage-local">{{ $t('docDocsCookiepolicy.s4Title') }}</h2>
      <p>
        {{ $t('docDocsCookiepolicy.s4Intro') }}
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsCookiepolicy.thCle') }}</th>
              <th>{{ $t('docDocsCookiepolicy.thCategorie') }}</th>
              <th>{{ $t('docDocsCookiepolicy.thFinalite') }}</th>
              <th>{{ $t('docDocsCookiepolicy.thDuree') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>auth_token</code></td>
              <td>
                <span class="cookie-badge necessary">{{ $t('docDocsCookiepolicy.badgeNecessary') }}</span>
              </td>
              <td>
                {{ $t('docDocsCookiepolicy.authTokenPurpose') }}
              </td>
              <td>{{ $t('docDocsCookiepolicy.authTokenDuration') }}</td>
            </tr>
            <tr>
              <td><code>claudenest-theme</code></td>
              <td>
                <span class="cookie-badge functional">{{ $t('docDocsCookiepolicy.badgeFunctional') }}</span>
              </td>
              <td>
                {{ $t('docDocsCookiepolicy.themePurpose') }}
              </td>
              <td>{{ $t('docDocsCookiepolicy.persistentDuration') }}</td>
            </tr>
            <tr>
              <td><code>claudenest-locale</code></td>
              <td>
                <span class="cookie-badge functional">{{ $t('docDocsCookiepolicy.badgeFunctional') }}</span>
              </td>
              <td>
                {{ $t('docDocsCookiepolicy.localePurpose') }}
              </td>
              <td>{{ $t('docDocsCookiepolicy.persistentDuration') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        {{ $t('docDocsCookiepolicy.s4Outro') }}
      </p>
    </section>

    <!-- Section 5: Technologies non utilisees -->
    <section id="cookies-absents">
      <h2 id="cookies-absents">{{ $t('docDocsCookiepolicy.s5Title') }}</h2>
      <p>
        ClaudeNest n'utilise <strong>aucune</strong> des technologies suivantes :
      </p>
      <div class="absent-grid">
        <div class="absent-card">
          <div class="absent-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsCookiepolicy.absentAnalyticsTitle') }}</h4>
            <p>{{ $t('docDocsCookiepolicy.absentAnalyticsBody') }}</p>
          </div>
        </div>
        <div class="absent-card">
          <div class="absent-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsCookiepolicy.absentAdsTitle') }}</h4>
            <p>{{ $t('docDocsCookiepolicy.absentAdsBody') }}</p>
          </div>
        </div>
        <div class="absent-card">
          <div class="absent-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsCookiepolicy.absentPixelsTitle') }}</h4>
            <p>{{ $t('docDocsCookiepolicy.absentPixelsBody') }}</p>
          </div>
        </div>
        <div class="absent-card">
          <div class="absent-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsCookiepolicy.absentFingerprintTitle') }}</h4>
            <p>{{ $t('docDocsCookiepolicy.absentFingerprintBody') }}</p>
          </div>
        </div>
        <div class="absent-card">
          <div class="absent-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsCookiepolicy.absentCrossSiteTitle') }}</h4>
            <p>{{ $t('docDocsCookiepolicy.absentCrossSiteBody') }}</p>
          </div>
        </div>
        <div class="absent-card">
          <div class="absent-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsCookiepolicy.absentSocialTitle') }}</h4>
            <p>{{ $t('docDocsCookiepolicy.absentSocialBody') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 6: Base legale -->
    <section id="base-legale">
      <h2 id="base-legale">{{ $t('docDocsCookiepolicy.s6Title') }}</h2>
      <p>
        Les cookies et mecanismes de stockage utilises par ClaudeNest relevent de
        l'exemption de consentement prevue par :
      </p>
      <ul>
        <li>
          <strong>Article 82 de la loi n&deg; 78-17 du 6 janvier 1978 modifiee</strong>
          (loi Informatique et Libertes), transposant l'article 5(3) de la directive ePrivacy
          2002/58/CE : les operations de lecture ou d'ecriture strictement necessaires a la
          fourniture du service explicitement demande par l'utilisateur sont exemptees du
          recueil de consentement.
        </li>
        <li>
          <strong>Lignes directrices de la CNIL du 17 septembre 2020</strong> (deliberation
          n&deg; 2020-091) et la recommandation du 17 septembre 2020 (deliberation n&deg; 2020-092) :
          les cookies strictement necessaires au fonctionnement du service ne requierent pas
          de banniere de consentement.
        </li>
      </ul>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsCookiepolicy.noBannerTitle') }}</h4>
          <p>
            {{ $t('docDocsCookiepolicy.noBannerBody') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Section 7: Gestion des cookies -->
    <section id="gestion-cookies">
      <h2 id="gestion-cookies">{{ $t('docDocsCookiepolicy.s7Title') }}</h2>
      <p>
        {{ $t('docDocsCookiepolicy.s7Intro') }}
      </p>

      <h3 id="suppression-navigateur">{{ $t('docDocsCookiepolicy.s71Title') }}</h3>
      <p>
        {{ $t('docDocsCookiepolicy.s71Intro') }}
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
            Google Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/fr/kb/effacer-les-cookies" target="_blank" rel="noopener noreferrer">
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
            Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
            Microsoft Edge
          </a>
        </li>
      </ul>

      <h3 id="suppression-localstorage">{{ $t('docDocsCookiepolicy.s72Title') }}</h3>
      <p>
        {{ $t('docDocsCookiepolicy.s72Body') }}
      </p>

      <div class="warning-card">
        <div class="warning-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsCookiepolicy.warningTitle') }}</h4>
          <p>
            {{ $t('docDocsCookiepolicy.warningBody') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Section 8: Auto-hebergement -->
    <section id="auto-hebergement">
      <h2 id="auto-hebergement">{{ $t('docDocsCookiepolicy.s8Title') }}</h2>
      <p>
        {{ $t('docDocsCookiepolicy.s8Intro') }}
      </p>
      <ul>
        <li>Mettre a jour la presente politique pour refleter les cookies effectivement utilises.</li>
        <li>Obtenir le consentement prealable des utilisateurs pour tout cookie non strictement necessaire.</li>
        <li>Mettre en place une banniere de consentement conforme aux exigences de la CNIL.</li>
        <li>Tenir un registre des consentements conformement a l'article 7 du RGPD.</li>
      </ul>
    </section>

    <!-- Section 9: Modifications -->
    <section id="modifications">
      <h2 id="modifications">{{ $t('docDocsCookiepolicy.s9Title') }}</h2>
      <p>
        {{ $t('docDocsCookiepolicy.s9Intro') }}
      </p>
      <ul>
        <li>{{ $t('docDocsCookiepolicy.s9Item1') }}</li>
        <li>Une notification sera affichee dans le tableau de bord ClaudeNest pendant 30 jours.</li>
        <li>
          Si de nouveaux types de cookies non strictement necessaires sont introduits,
          le consentement des utilisateurs sera recueilli prealablement.
        </li>
      </ul>
    </section>

    <!-- Section 10: Contact -->
    <section id="contact">
      <h2 id="contact">{{ $t('docDocsCookiepolicy.s10Title') }}</h2>
      <p>
        {{ $t('docDocsCookiepolicy.s10Intro') }}
      </p>
      <div class="contact-cards">
        <div class="contact-card">
          <div class="contact-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsCookiepolicy.contactEmailGeneralTitle') }}</h4>
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
            <h4>{{ $t('docDocsCookiepolicy.contactDpoTitle') }}</h4>
            <a href="mailto:dpo@claudenest.io">dpo@claudenest.io</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="terms-footer">
      <div class="footer-divider"></div>
      <p class="footer-text">
        {{ $t('docDocsCookiepolicy.footerText') }}
      </p>
      <p class="footer-meta">
        {{ $t('docDocsCookiepolicy.footerMeta') }}
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

/* Data Tables */
.data-table-wrapper {
  overflow-x: auto;
  margin: 1rem 0 1.5rem;
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table thead {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 8%, transparent);
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--accent-purple, #a855f7);
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  border-bottom: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  vertical-align: top;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

/* Cookie Badges */
.cookie-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.cookie-badge.necessary {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.cookie-badge.functional {
  color: var(--accent-cyan, #22d3ee);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 12%, transparent);
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
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.info-card p {
  margin: 0;
  font-size: 0.9rem;
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

/* Absent Grid */
.absent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.absent-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 10px;
}

.absent-icon {
  width: 28px;
  height: 28px;
  min-width: 28px;
  background: rgba(239, 68, 68, 0.12);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  margin-top: 2px;
}

.absent-icon svg {
  width: 16px;
  height: 16px;
}

.absent-card h4 {
  margin: 0 0 0.15rem;
  font-size: 0.9rem;
}

.absent-card p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
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

/* Responsive */
@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .lead {
    font-size: 1.1rem;
  }

  .absent-grid {
    grid-template-columns: 1fr;
  }

  .info-card,
  .warning-card {
    flex-direction: column;
  }

  .data-table {
    font-size: 0.8rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.75rem;
  }
}
</style>
