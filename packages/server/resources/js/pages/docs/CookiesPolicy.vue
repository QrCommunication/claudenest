<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsCookiespolicy.title') }}</h1>
      <p class="lead">
        {{ $t('docDocsCookiespolicy.lead') }}
      </p>
      <div class="meta-info">
        <span class="meta-item">
          <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
          </svg>
          {{ $t('docDocsCookiespolicy.lastUpdated') }}
        </span>
      </div>
    </header>

    <section id="qu-est-ce-qu-un-cookie">
      <h2>{{ $t('docDocsCookiespolicy.section1Title') }}</h2>
      <p>
        {{ $t('docDocsCookiespolicy.section1Para') }}
      </p>
    </section>

    <section id="cookies-utilises">
      <h2>{{ $t('docDocsCookiespolicy.section2Title') }}</h2>

      <h3>{{ $t('docDocsCookiespolicy.section21Title') }}</h3>
      <p>
        {{ $t('docDocsCookiespolicy.section21Para') }}
      </p>
      <ul>
        <li><code>session_token</code> — {{ $t('docDocsCookiespolicy.cookieSessionToken') }} (durée : session)</li>
        <li><code>claudenest-theme</code> — {{ $t('docDocsCookiespolicy.cookieTheme') }} (durée : 1 an)</li>
        <li><code>sidebar-collapsed</code> — {{ $t('docDocsCookiespolicy.cookieSidebar') }} (durée : 1 an)</li>
      </ul>

      <h3>{{ $t('docDocsCookiespolicy.section23Title') }}</h3>
      <p>
        {{ $t('docDocsCookiespolicy.section23Para') }}
      </p>

      <h3>{{ $t('docDocsCookiespolicy.section22Title') }}</h3>
      <p>
        {{ $t('docDocsCookiespolicy.section22Para') }}
      </p>
    </section>

    <section id="cookies-tiers">
      <h2>{{ $t('docDocsCookiespolicy.section3Title') }}</h2>
      <p>
        {{ $t('docDocsCookiespolicy.section3Para') }}
      </p>
    </section>

    <section id="gestion-cookies">
      <h2>{{ $t('docDocsCookiespolicy.section4Title') }}</h2>
      <p>
        {{ $t('docDocsCookiespolicy.section4Para1Before') }}
        <a href="https://www.aboutcookies.org" target="_blank" rel="noreferrer">aboutcookies.org</a>.
        Vous pouvez supprimer tous les cookies qui sont déjà sur votre ordinateur et
        vous pouvez configurer la plupart des navigateurs pour les empêcher d'être
        placés.
      </p>
      <p>
        {{ $t('docDocsCookiespolicy.section4Para2') }}
      </p>

      <h3>{{ $t('docDocsCookiespolicy.disableTitle') }}</h3>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Apple Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
      </ul>
    </section>

    <section id="modifications">
      <h2>{{ $t('docDocsCookiespolicy.section5Title') }}</h2>
      <p>
        {{ $t('docDocsCookiespolicy.section5Para1') }}
        {{ $t('docDocsCookiespolicy.section5Para2') }}
      </p>
      <p>
        La date en haut de cette politique indique quand elle a été mise à jour pour
        la dernière fois.
      </p>
    </section>

    <section id="contact">
      <h2>{{ $t('docDocsCookiespolicy.section6Title') }}</h2>
      <p>
        {{ $t('docDocsCookiespolicy.section6Para') }}
        <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
      </p>
      <p>
        {{ $t('docDocsCookiespolicy.section6Also') }}
        <router-link to="/legal/mentions-legales">{{ $t('docDocsCookiespolicy.linkLegal') }}</router-link>
        {{ $t('docDocsCookiespolicy.andOur') }}
        <router-link to="/legal/privacy">{{ $t('docDocsCookiespolicy.linkPrivacy') }}</router-link>.
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
// No additional logic needed
</script>
