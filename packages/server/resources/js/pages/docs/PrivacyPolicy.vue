<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ $t('docDocsPrivacypolicy.title') }}</h1>
      <p class="lead">
        {{ $t('docDocsPrivacypolicy.leadPara') }}
      </p>
      <p class="last-updated">{{ $t('docDocsPrivacypolicy.effectiveDate') }}</p>
    </header>

    <!-- Table of Contents -->
    <nav class="policy-toc">
      <h2>{{ $t('docDocsPrivacypolicy.tocHeading') }}</h2>
      <ol>
        <li><a href="#data-controller">{{ $t('docDocsPrivacypolicy.tocDataController') }}</a></li>
        <li><a href="#data-we-collect">{{ $t('docDocsPrivacypolicy.tocDataWeCollect') }}</a></li>
        <li><a href="#legal-basis">{{ $t('docDocsPrivacypolicy.tocLegalBasis') }}</a></li>
        <li><a href="#how-we-use">{{ $t('docDocsPrivacypolicy.tocHowWeUse') }}</a></li>
        <li><a href="#data-retention">{{ $t('docDocsPrivacypolicy.tocDataRetention') }}</a></li>
        <li><a href="#data-sharing">{{ $t('docDocsPrivacypolicy.tocDataSharing') }}</a></li>
        <li><a href="#your-rights">{{ $t('docDocsPrivacypolicy.tocYourRights') }}</a></li>
        <li><a href="#cookies">{{ $t('docDocsPrivacypolicy.tocCookies') }}</a></li>
        <li><a href="#data-security">{{ $t('docDocsPrivacypolicy.tocDataSecurity') }}</a></li>
        <li><a href="#international-transfers">{{ $t('docDocsPrivacypolicy.tocInternationalTransfers') }}</a></li>
        <li><a href="#childrens-privacy">{{ $t('docDocsPrivacypolicy.tocChildrensPrivacy') }}</a></li>
        <li><a href="#policy-changes">{{ $t('docDocsPrivacypolicy.tocPolicyChanges') }}</a></li>
        <li><a href="#contact-dpo">{{ $t('docDocsPrivacypolicy.tocContactDpo') }}</a></li>
      </ol>
    </nav>

    <!-- Section 1: Data Controller -->
    <section id="data-controller">
      <h2 id="data-controller">{{ $t('docDocsPrivacypolicy.s1Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s1Intro') }}
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
            {{ $t('docDocsPrivacypolicy.s1SirenApe') }}<br>
            {{ $t('docDocsPrivacypolicy.s1Address') }}<br>
            {{ $t('docDocsPrivacypolicy.s1EmailLabel') }} <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a><br>
            {{ $t('docDocsPrivacypolicy.s1PhoneLabel') }} <a href="tel:+33188833451">+33 1 88 83 34 51</a>
          </p>
        </div>
      </div>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsPrivacypolicy.s1DpoTitle') }}</h4>
          <p>
            {{ $t('docDocsPrivacypolicy.s1DpoPara') }}<br>
            {{ $t('docDocsPrivacypolicy.s1EmailLabel') }} <a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a>
          </p>
        </div>
      </div>
      <p>
        {{ $t('docDocsPrivacypolicy.s1OpenSourcePara') }}
      </p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsPrivacypolicy.s1SelfHostedTitle') }}</h4>
          <p>
            {{ $t('docDocsPrivacypolicy.s1SelfHostedPara') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Section 2: Data We Collect -->
    <section id="data-we-collect">
      <h2 id="data-we-collect">{{ $t('docDocsPrivacypolicy.s2Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s2Intro') }}
      </p>

      <h3 id="account-data">{{ $t('docDocsPrivacypolicy.s21Heading') }}</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.thData') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thPurpose') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thRetention') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>email</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s21EmailPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilAccountDeletion') }}</td>
            </tr>
            <tr>
              <td><code>name</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s21NamePurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilAccountDeletion') }}</td>
            </tr>
            <tr>
              <td><code>password_hash</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s21PasswordPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilAccountDeletion') }}</td>
            </tr>
            <tr>
              <td><code>avatar_url</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s21AvatarPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilAccountDeletion') }}</td>
            </tr>
            <tr>
              <td><code>google_id</code> / <code>github_id</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s21OauthPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s21OauthRetention') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="machine-data">{{ $t('docDocsPrivacypolicy.s22Heading') }}</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.thData') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thPurpose') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thRetention') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>hostname</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22HostnamePurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
            </tr>
            <tr>
              <td><code>platform</code> / <code>arch</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22PlatformPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
            </tr>
            <tr>
              <td><code>agent_version</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22AgentVersionPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
            </tr>
            <tr>
              <td><code>node_version</code> / <code>claude_version</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22NodeVersionPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
            </tr>
            <tr>
              <td><code>claude_path</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22ClaudePathPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
            </tr>
            <tr>
              <td><code>token_hash</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22TokenHashPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s22TokenHashRetention') }}</td>
            </tr>
            <tr>
              <td><code>capabilities</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22CapabilitiesPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
            </tr>
            <tr>
              <td><code>last_seen_at</code> / <code>connected_at</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s22LastSeenPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="session-data">{{ $t('docDocsPrivacypolicy.s23Heading') }}</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.thData') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thPurpose') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thRetention') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>terminal_output</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s23TerminalPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.configurable90') }}</td>
            </tr>
            <tr>
              <td><code>commands / input</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s23CommandsPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s23CommandsRetention') }}</td>
            </tr>
            <tr>
              <td><code>project_path</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s23ProjectPathPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sessionDuration') }}</td>
            </tr>
            <tr>
              <td><code>initial_prompt</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s23InitialPromptPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sessionDurationLogs') }}</td>
            </tr>
            <tr>
              <td><code>pid</code> / <code>exit_code</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s23PidPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sessionDurationLogs') }}</td>
            </tr>
            <tr>
              <td><code>pty_size</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s23PtySizePurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sessionDuration') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="warning-card">
        <div class="warning-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsPrivacypolicy.s2WarningTitle') }}</h4>
          <p>
            {{ $t('docDocsPrivacypolicy.s2WarningPara') }}
          </p>
        </div>
      </div>

      <h3 id="context-data">{{ $t('docDocsPrivacypolicy.s24Heading') }}</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.thData') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thPurpose') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thRetention') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>content</code> {{ $t('docDocsPrivacypolicy.s24ContentSuffix') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s24ContentPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s24ContentRetention') }}</td>
            </tr>
            <tr>
              <td><code>embedding</code> {{ $t('docDocsPrivacypolicy.s24EmbeddingSuffix') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s24EmbeddingPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sameAsParentChunk') }}</td>
            </tr>
            <tr>
              <td><code>importance_score</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s24ImportancePurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sameAsParentChunk') }}</td>
            </tr>
            <tr>
              <td><code>files</code> {{ $t('docDocsPrivacypolicy.s24FilesSuffix') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s24FilesPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sameAsParentChunk') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        {{ $t('docDocsPrivacypolicy.s24EmbeddingsPara1') }} <strong>Ollama</strong> {{ $t('docDocsPrivacypolicy.s24EmbeddingsPara2') }}
        <code>bge-small-en-v1.5</code>. {{ $t('docDocsPrivacypolicy.s24EmbeddingsPara3') }}
      </p>

      <h3 id="usage-and-cost-data">{{ $t('docDocsPrivacypolicy.s25Heading') }}</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.thData') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thPurpose') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thRetention') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>total_tokens</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s25TotalTokensPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.indefiniteAggregated') }}</td>
            </tr>
            <tr>
              <td><code>total_cost</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s25TotalCostPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.indefiniteAggregated') }}</td>
            </tr>
            <tr>
              <td><code>context_tokens</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s25ContextTokensPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.instanceLifecycle') }}</td>
            </tr>
            <tr>
              <td><code>tasks_completed</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s25TasksCompletedPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.instanceLifecycle') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="activity-logs">{{ $t('docDocsPrivacypolicy.s26Heading') }}</h3>
      <p>
        {{ $t('docDocsPrivacypolicy.s26Para') }}
      </p>

      <h3 id="credentials-and-push-tokens">{{ $t('docDocsPrivacypolicy.s27Heading') }}</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.thData') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thPurpose') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thRetention') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>api_key</code> / <code>oauth_token</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s27CredentialsPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s27CredentialsRetention') }}</td>
            </tr>
            <tr>
              <td><code>push_token</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s27PushTokenPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s27PushTokenRetention') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        {{ $t('docDocsPrivacypolicy.s27Para') }}
      </p>
    </section>

    <!-- Section 3: Legal Basis -->
    <section id="legal-basis">
      <h2 id="legal-basis">{{ $t('docDocsPrivacypolicy.s3Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s3Intro') }}
      </p>

      <div class="legal-basis-grid">
        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(b)</span>
            <h4>{{ $t('docDocsPrivacypolicy.s3ContractualTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s3ContractualPara') }}
          </p>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s3ContractualItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3ContractualItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3ContractualItem3') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3ContractualItem4') }}</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(f)</span>
            <h4>{{ $t('docDocsPrivacypolicy.s3LegitimateTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s3LegitimatePara') }}
          </p>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s3LegitimateItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3LegitimateItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3LegitimateItem3') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3LegitimateItem4') }}</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(a)</span>
            <h4>{{ $t('docDocsPrivacypolicy.s3ConsentTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s3ConsentPara') }}
          </p>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s3ConsentItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3ConsentItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3ConsentItem3') }}</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(c)</span>
            <h4>{{ $t('docDocsPrivacypolicy.s3LegalObligationTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s3LegalObligationPara') }}
          </p>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s3LegalObligationItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3LegalObligationItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s3LegalObligationItem3') }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 4: How We Use Data -->
    <section id="how-we-use">
      <h2 id="how-we-use">{{ $t('docDocsPrivacypolicy.s4Heading') }}</h2>
      <p>{{ $t('docDocsPrivacypolicy.s4Intro') }}</p>

      <div class="use-cases">
        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsPrivacypolicy.s4Use1Title') }}</h4>
            <p>{{ $t('docDocsPrivacypolicy.s4Use1Para') }}</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsPrivacypolicy.s4Use2Title') }}</h4>
            <p>{{ $t('docDocsPrivacypolicy.s4Use2Para') }}</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsPrivacypolicy.s4Use3Title') }}</h4>
            <p>{{ $t('docDocsPrivacypolicy.s4Use3Para') }}</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsPrivacypolicy.s4Use4Title') }}</h4>
            <p>{{ $t('docDocsPrivacypolicy.s4Use4Para') }}</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsPrivacypolicy.s4Use5Title') }}</h4>
            <p>{{ $t('docDocsPrivacypolicy.s4Use5Para') }}</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
            </svg>
          </div>
          <div>
            <h4>{{ $t('docDocsPrivacypolicy.s4Use6Title') }}</h4>
            <p>{{ $t('docDocsPrivacypolicy.s4Use6Para') }}</p>
          </div>
        </div>
      </div>

      <p>
        {{ $t('docDocsPrivacypolicy.s4NotUsedPara1') }} <strong>{{ $t('docDocsPrivacypolicy.s4NotUsedEmphasis') }}</strong> {{ $t('docDocsPrivacypolicy.s4NotUsedPara2') }}
      </p>
    </section>

    <!-- Section 5: Data Retention -->
    <section id="data-retention">
      <h2 id="data-retention">{{ $t('docDocsPrivacypolicy.s5Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s5Intro') }}
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.s5ThCategory') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.s5ThRetention') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.s5ThTrigger') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowAccountCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilAccountDeletion') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowAccountTrigger') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowMachineCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.untilMachineDeletion') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowMachineTrigger') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowSessionCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.configurable90') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowSessionTrigger') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowSessionLogsCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.configurable90') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5AutoCleanupTask') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowContextChunksCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.configurable30') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowContextChunksTriggerPre') }} <code>expires_at</code></td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowEmbeddingsCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.sameAsParentChunk') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowEmbeddingsTrigger') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowActivityLogsCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.configurable180') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5AutoCleanupTask') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowFileLocksCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowFileLocksRetention') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowFileLocksTrigger') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsPrivacypolicy.s5RowUsageMetricsCat') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowUsageMetricsRetention') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s5RowUsageMetricsTrigger') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        {{ $t('docDocsPrivacypolicy.s5OutroPre') }} <code>claudenest.php</code> {{ $t('docDocsPrivacypolicy.s5OutroPost') }}
      </p>
    </section>

    <!-- Section 6: Data Sharing -->
    <section id="data-sharing">
      <h2 id="data-sharing">{{ $t('docDocsPrivacypolicy.s6Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s6Intro') }}
      </p>

      <h3 id="infrastructure-components">{{ $t('docDocsPrivacypolicy.s61Heading') }}</h3>
      <div class="third-party-grid">
        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">{{ $t('docDocsPrivacypolicy.badgeLocal') }}</span>
            <h4>Ollama (AI Engine)</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s61OllamaPara1') }} (<code>bge-small-en-v1.5</code>) {{ $t('docDocsPrivacypolicy.s61OllamaPara2') }} (<code>mistral:7b</code>)
            {{ $t('docDocsPrivacypolicy.s61OllamaPara3') }} <strong>{{ $t('docDocsPrivacypolicy.s61OllamaEmphasis') }}</strong>
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">{{ $t('docDocsPrivacypolicy.badgeLocal') }}</span>
            <h4>PostgreSQL + pgvector</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s61PostgresPara') }}
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">{{ $t('docDocsPrivacypolicy.badgeLocal') }}</span>
            <h4>Redis</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s61RedisPara') }}
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">{{ $t('docDocsPrivacypolicy.badgeLocal') }}</span>
            <h4>Laravel Reverb (WebSocket)</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s61ReverbPara') }}
          </p>
        </div>
      </div>

      <h3 id="optional-external-services">{{ $t('docDocsPrivacypolicy.s62Heading') }}</h3>
      <div class="third-party-grid">
        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">{{ $t('docDocsPrivacypolicy.badgeExternal') }}</span>
            <h4>Google OAuth</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s62GooglePara') }}
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">{{ $t('docDocsPrivacypolicy.badgeExternal') }}</span>
            <h4>GitHub OAuth</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s62GithubPara') }}
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">{{ $t('docDocsPrivacypolicy.badgeExternal') }}</span>
            <h4>Anthropic (Claude API)</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s62AnthropicPara') }}
          </p>
        </div>
      </div>

      <h3 id="no-data-sales">{{ $t('docDocsPrivacypolicy.s63Heading') }}</h3>
      <p>
        {{ $t('docDocsPrivacypolicy.s63Para1') }} <strong>{{ $t('docDocsPrivacypolicy.s63Emphasis') }}</strong> {{ $t('docDocsPrivacypolicy.s63Para2') }}
      </p>

      <h3 id="processors">{{ $t('docDocsPrivacypolicy.s64Heading') }}</h3>
      <div class="third-party-grid">
        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">{{ $t('docDocsPrivacypolicy.badgeProcessor') }}</span>
            <h4>Scaleway SAS</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s64ScalewayPara') }}<br>
            <a href="https://www.scaleway.com" target="_blank" rel="noopener noreferrer">www.scaleway.com</a>
          </p>
        </div>
      </div>
    </section>

    <!-- Section 7: Your Rights -->
    <section id="your-rights">
      <h2 id="your-rights">{{ $t('docDocsPrivacypolicy.s7Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s7Intro') }}
      </p>

      <div class="rights-grid">
        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 15</span>
            <h4>{{ $t('docDocsPrivacypolicy.s7AccessTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s7AccessPara') }}
          </p>
          <div class="right-how">
            <strong>{{ $t('docDocsPrivacypolicy.s7HowToExercise') }}</strong> {{ $t('docDocsPrivacypolicy.s7AccessHow') }}
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 16</span>
            <h4>{{ $t('docDocsPrivacypolicy.s7RectificationTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s7RectificationPara') }}
          </p>
          <div class="right-how">
            <strong>{{ $t('docDocsPrivacypolicy.s7HowToExercise') }}</strong> {{ $t('docDocsPrivacypolicy.s7RectificationHow') }}
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 17</span>
            <h4>{{ $t('docDocsPrivacypolicy.s7ErasureTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s7ErasurePara') }}
          </p>
          <div class="right-how">
            <strong>{{ $t('docDocsPrivacypolicy.s7HowToExercise') }}</strong> {{ $t('docDocsPrivacypolicy.s7ErasureHow') }}
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 18</span>
            <h4>{{ $t('docDocsPrivacypolicy.s7RestrictionTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s7RestrictionPara') }}
          </p>
          <div class="right-how">
            <strong>{{ $t('docDocsPrivacypolicy.s7HowToExercise') }}</strong> {{ $t('docDocsPrivacypolicy.s7RestrictionHow') }}
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 20</span>
            <h4>{{ $t('docDocsPrivacypolicy.s7PortabilityTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s7PortabilityPara') }}
          </p>
          <div class="right-how">
            <strong>{{ $t('docDocsPrivacypolicy.s7HowToExercise') }}</strong> {{ $t('docDocsPrivacypolicy.s7PortabilityHow') }}
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 21</span>
            <h4>{{ $t('docDocsPrivacypolicy.s7ObjectionTitle') }}</h4>
          </div>
          <p>
            {{ $t('docDocsPrivacypolicy.s7ObjectionPara') }}
          </p>
          <div class="right-how">
            <strong>{{ $t('docDocsPrivacypolicy.s7HowToExercise') }}</strong> {{ $t('docDocsPrivacypolicy.s7ObjectionHow') }}
          </div>
        </div>
      </div>

      <p>
        {{ $t('docDocsPrivacypolicy.s7PostMortemPara') }}
      </p>

      <div class="info-card info-card--spaced">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <h4>{{ $t('docDocsPrivacypolicy.s7ComplaintTitle') }}</h4>
          <p>
            {{ $t('docDocsPrivacypolicy.s7ComplaintPre') }}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>
            {{ $t('docDocsPrivacypolicy.s7ComplaintPost') }}
          </p>
        </div>
      </div>

      <p>
        {{ $t('docDocsPrivacypolicy.s7ResponsePre') }} <strong>{{ $t('docDocsPrivacypolicy.s7Response30Days') }}</strong>. {{ $t('docDocsPrivacypolicy.s7ResponsePost') }}
      </p>
    </section>

    <!-- Section 8: Cookies -->
    <section id="cookies">
      <h2 id="cookies">{{ $t('docDocsPrivacypolicy.s8Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s8IntroPre') }} <router-link to="/docs/cookies">{{ $t('docDocsPrivacypolicy.s8CookiePolicyLink') }}</router-link>.
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('docDocsPrivacypolicy.s8ThCookie') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.s8ThType') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.thPurpose') }}</th>
              <th>{{ $t('docDocsPrivacypolicy.s8ThDuration') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>XSRF-TOKEN</code></td>
              <td>{{ $t('docDocsPrivacypolicy.strictlyNecessary') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8XsrfPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8DurationSession') }}</td>
            </tr>
            <tr>
              <td><code>laravel_session</code></td>
              <td>{{ $t('docDocsPrivacypolicy.strictlyNecessary') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8LaravelSessionPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8Duration2h') }}</td>
            </tr>
            <tr>
              <td><code>localStorage: auth_token</code></td>
              <td>{{ $t('docDocsPrivacypolicy.strictlyNecessary') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8AuthTokenPurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8DurationUntilLogout') }}</td>
            </tr>
            <tr>
              <td><code>localStorage: theme</code></td>
              <td>{{ $t('docDocsPrivacypolicy.s8TypeFunctional') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8ThemePurpose') }}</td>
              <td>{{ $t('docDocsPrivacypolicy.s8DurationPersistent') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        {{ $t('docDocsPrivacypolicy.s8NotUsedPre') }} <strong>{{ $t('docDocsPrivacypolicy.s8NotUsedEmphasis') }}</strong> :
      </p>
      <ul>
        <li>{{ $t('docDocsPrivacypolicy.s8NotUsedItem1') }}</li>
        <li>{{ $t('docDocsPrivacypolicy.s8NotUsedItem2') }}</li>
        <li>{{ $t('docDocsPrivacypolicy.s8NotUsedItem3') }}</li>
        <li>{{ $t('docDocsPrivacypolicy.s8NotUsedItem4') }}</li>
      </ul>

      <p>
        {{ $t('docDocsPrivacypolicy.s8Outro') }}
      </p>
    </section>

    <!-- Section 9: Data Security -->
    <section id="data-security">
      <h2 id="data-security">{{ $t('docDocsPrivacypolicy.s9Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s9Intro') }}
      </p>

      <div class="security-measures">
        <div class="measure-category">
          <h4>{{ $t('docDocsPrivacypolicy.s9TransportTitle') }}</h4>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s9TransportItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9TransportItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9TransportItem3') }}</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>{{ $t('docDocsPrivacypolicy.s9AuthTitle') }}</h4>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s9AuthItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AuthItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AuthItem3Pre') }} <code>keytar</code></li>
            <li>{{ $t('docDocsPrivacypolicy.s9AuthItem4') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AuthItem5') }}</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>{{ $t('docDocsPrivacypolicy.s9AppTitle') }}</h4>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s9AppItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AppItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AppItem3') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AppItem4') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AppItem5') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AppItem6') }}</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>{{ $t('docDocsPrivacypolicy.s9InfraTitle') }}</h4>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s9InfraItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9InfraItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9InfraItem3') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9InfraItem4') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9InfraItem5') }}</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>{{ $t('docDocsPrivacypolicy.s9AgentTitle') }}</h4>
          <ul>
            <li>{{ $t('docDocsPrivacypolicy.s9AgentItem1') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AgentItem2') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AgentItem3') }}</li>
            <li>{{ $t('docDocsPrivacypolicy.s9AgentItem4') }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 10: International Transfers -->
    <section id="international-transfers">
      <h2 id="international-transfers">{{ $t('docDocsPrivacypolicy.s10Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s10Para1') }}
      </p>
      <p>
        {{ $t('docDocsPrivacypolicy.s10Para2') }}
      </p>
      <ul>
        <li>
          <strong>{{ $t('docDocsPrivacypolicy.s10Item1Label') }}</strong> {{ $t('docDocsPrivacypolicy.s10Item1Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsPrivacypolicy.s10Item2Label') }}</strong> {{ $t('docDocsPrivacypolicy.s10Item2Text') }}
        </li>
        <li>
          <strong>{{ $t('docDocsPrivacypolicy.s10Item3Label') }}</strong> {{ $t('docDocsPrivacypolicy.s10Item3Text') }}
        </li>
      </ul>
      <p>
        {{ $t('docDocsPrivacypolicy.s10Para3') }}
      </p>
    </section>

    <!-- Section 11: Children's Privacy -->
    <section id="childrens-privacy">
      <h2 id="childrens-privacy">{{ $t('docDocsPrivacypolicy.s11Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s11Para1') }}
      </p>
      <p>
        {{ $t('docDocsPrivacypolicy.s11Para2') }}
      </p>
    </section>

    <!-- Section 12: Policy Changes -->
    <section id="policy-changes">
      <h2 id="policy-changes">{{ $t('docDocsPrivacypolicy.s12Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s12Intro') }}
      </p>
      <ul>
        <li>{{ $t('docDocsPrivacypolicy.s12Item1') }}</li>
        <li>{{ $t('docDocsPrivacypolicy.s12Item2') }}</li>
        <li>{{ $t('docDocsPrivacypolicy.s12Item3') }}</li>
        <li>
          {{ $t('docDocsPrivacypolicy.s12Item4') }}
        </li>
      </ul>
      <p>
        {{ $t('docDocsPrivacypolicy.s12Outro') }}
      </p>
    </section>

    <!-- Section 13: Contact DPO -->
    <section id="contact-dpo">
      <h2 id="contact-dpo">{{ $t('docDocsPrivacypolicy.s13Heading') }}</h2>
      <p>
        {{ $t('docDocsPrivacypolicy.s13Intro') }}
      </p>

      <div class="contact-card">
        <div class="contact-methods">
          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <div>
              <strong>{{ $t('docDocsPrivacypolicy.s13EmailLabel') }}</strong>
              <p><a href="mailto:contact@qrcommunication.com">contact@qrcommunication.com</a></p>
            </div>
          </div>

          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <div>
              <strong>{{ $t('docDocsPrivacypolicy.s13WebsiteLabel') }}</strong>
              <p><a href="https://claudenest.io/privacy" target="_blank" rel="noopener">claudenest.io/privacy</a></p>
            </div>
          </div>

          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
            </svg>
            <div>
              <strong>{{ $t('docDocsPrivacypolicy.s13GithubLabel') }}</strong>
              <p><a href="https://github.com/QrCommunication/claudenest/issues" target="_blank" rel="noopener">{{ $t('docDocsPrivacypolicy.s13GithubLinkText') }}</a></p>
            </div>
          </div>
        </div>
      </div>

      <p>
        {{ $t('docDocsPrivacypolicy.s13ClosingPre') }} <strong>{{ $t('docDocsPrivacypolicy.s13Closing48h') }}</strong>
        {{ $t('docDocsPrivacypolicy.s13ClosingMid') }} <strong>{{ $t('docDocsPrivacypolicy.s13Closing30Days') }}</strong>{{ $t('docDocsPrivacypolicy.s13ClosingPost') }}
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
// No external dependencies needed for this static legal page
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

.info-card--spaced {
  margin-top: 1.5rem;
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

/* Legal Basis Grid */
.legal-basis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.legal-basis-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem;
}

.basis-header {
  margin-bottom: 0.75rem;
}

.basis-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 12%, transparent);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.legal-basis-card p {
  font-size: 0.9rem;
}

.legal-basis-card ul {
  font-size: 0.9rem;
  margin: 0;
}

/* Use Cases */
.use-cases {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.use-case {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  transition: all 0.2s;
}

.use-case:hover {
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border-color: var(--border-color, var(--border));
}

.use-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-purple, #a855f7);
}

.use-icon svg {
  width: 20px;
  height: 20px;
}

.use-case h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.use-case p {
  margin: 0;
  font-size: 0.9rem;
}

/* Third Party Grid */
.third-party-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1rem 0 1.5rem;
}

.third-party-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.25rem;
}

.tp-header {
  margin-bottom: 0.75rem;
}

.tp-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tp-badge.local {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}

.tp-badge.external {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
}

.third-party-card h4 {
  margin: 0.25rem 0 0;
  font-size: 1rem;
}

.third-party-card p {
  margin: 0;
  font-size: 0.9rem;
}

/* Rights Grid */
.rights-grid {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.right-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem;
}

.right-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.right-article {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-cyan, #22d3ee);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 12%, transparent);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.right-header h4 {
  margin: 0;
}

.right-card p {
  font-size: 0.9rem;
}

.right-how {
  font-size: 0.85rem;
  color: var(--text-muted);
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  margin-top: 0.75rem;
}

.right-how strong {
  color: var(--text-secondary);
}

/* Security Measures */
.security-measures {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.measure-category {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.25rem;
}

.measure-category h4 {
  color: var(--accent-purple, #a855f7);
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.measure-category ul {
  margin: 0;
  font-size: 0.9rem;
}

.measure-category li {
  margin-bottom: 0.4rem;
}

/* Contact Card */
.contact-card {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.contact-methods {
  display: grid;
  gap: 1.25rem;
}

.contact-method {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.contact-method svg {
  width: 24px;
  height: 24px;
  color: var(--accent-purple, #a855f7);
  flex-shrink: 0;
  margin-top: 2px;
}

.contact-method strong {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.15rem;
}

.contact-method p {
  margin: 0;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .lead {
    font-size: 1.1rem;
  }

  .legal-basis-grid {
    grid-template-columns: 1fr;
  }

  .third-party-grid {
    grid-template-columns: 1fr;
  }

  .right-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-card,
  .warning-card,
  .use-case {
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
