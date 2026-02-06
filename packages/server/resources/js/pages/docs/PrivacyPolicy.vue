<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>Privacy Policy</h1>
      <p class="lead">
        This Privacy Policy explains how ClaudeNest collects, uses, stores, and protects your personal data
        in compliance with the General Data Protection Regulation (GDPR / RGPD) and applicable privacy laws.
      </p>
      <p class="last-updated">Last updated: February 5, 2026</p>
    </header>

    <!-- Table of Contents -->
    <nav class="policy-toc">
      <h2>Table of Contents</h2>
      <ol>
        <li><a href="#data-controller">Data Controller Identity</a></li>
        <li><a href="#data-we-collect">Data We Collect</a></li>
        <li><a href="#legal-basis">Legal Basis for Processing</a></li>
        <li><a href="#how-we-use">How We Use Your Data</a></li>
        <li><a href="#data-retention">Data Retention</a></li>
        <li><a href="#data-sharing">Data Sharing and Third Parties</a></li>
        <li><a href="#your-rights">Your Rights Under GDPR</a></li>
        <li><a href="#cookies">Cookies and Tracking</a></li>
        <li><a href="#data-security">Data Security Measures</a></li>
        <li><a href="#international-transfers">International Data Transfers</a></li>
        <li><a href="#childrens-privacy">Children's Privacy</a></li>
        <li><a href="#policy-changes">Changes to This Policy</a></li>
        <li><a href="#contact-dpo">Contact the DPO</a></li>
      </ol>
    </nav>

    <!-- Section 1: Data Controller -->
    <section id="data-controller">
      <h2 id="data-controller">1. Data Controller Identity</h2>
      <p>
        ClaudeNest is an open-source remote Claude Code orchestration platform. When you self-host ClaudeNest,
        you (or your organization) act as the Data Controller for all personal data processed through your instance.
      </p>
      <p>
        If you use a ClaudeNest instance operated by a third party, that third party is the Data Controller.
        Please refer to their specific privacy policy for details.
      </p>
      <div class="info-card">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <h4>Self-Hosted Instances</h4>
          <p>
            As ClaudeNest is designed to be self-hosted, the Data Controller is the entity
            operating the server. This policy serves as a template and reference for operators
            to adapt to their specific legal obligations.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 2: Data We Collect -->
    <section id="data-we-collect">
      <h2 id="data-we-collect">2. Data We Collect</h2>
      <p>
        ClaudeNest collects and processes the following categories of personal data, each for a specific
        and documented purpose.
      </p>

      <h3 id="account-data">2.1 Account Data</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Purpose</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>email</code></td>
              <td>Authentication, account identification, password recovery</td>
              <td>Until account deletion</td>
            </tr>
            <tr>
              <td><code>name</code></td>
              <td>Display name in the interface and collaboration features</td>
              <td>Until account deletion</td>
            </tr>
            <tr>
              <td><code>password_hash</code></td>
              <td>Secure authentication (bcrypt hashed, never stored in plaintext)</td>
              <td>Until account deletion</td>
            </tr>
            <tr>
              <td><code>avatar_url</code></td>
              <td>Profile display (sourced from OAuth providers if applicable)</td>
              <td>Until account deletion</td>
            </tr>
            <tr>
              <td><code>google_id</code> / <code>github_id</code></td>
              <td>OAuth authentication linking</td>
              <td>Until account deletion or OAuth unlinking</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="machine-data">2.2 Machine Data</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Purpose</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>hostname</code></td>
              <td>Machine identification in the dashboard</td>
              <td>Until machine removal</td>
            </tr>
            <tr>
              <td><code>platform</code> / <code>arch</code></td>
              <td>Compatibility detection (darwin, win32, linux)</td>
              <td>Until machine removal</td>
            </tr>
            <tr>
              <td><code>agent_version</code></td>
              <td>Version tracking for update notifications</td>
              <td>Until machine removal</td>
            </tr>
            <tr>
              <td><code>node_version</code> / <code>claude_version</code></td>
              <td>Runtime compatibility verification</td>
              <td>Until machine removal</td>
            </tr>
            <tr>
              <td><code>claude_path</code></td>
              <td>Locating the Claude Code binary on the machine</td>
              <td>Until machine removal</td>
            </tr>
            <tr>
              <td><code>token_hash</code></td>
              <td>Machine authentication (hashed, never stored in plaintext)</td>
              <td>Until machine removal or token regeneration</td>
            </tr>
            <tr>
              <td><code>capabilities</code></td>
              <td>Feature flag detection (JSON)</td>
              <td>Until machine removal</td>
            </tr>
            <tr>
              <td><code>last_seen_at</code> / <code>connected_at</code></td>
              <td>Connection status and uptime monitoring</td>
              <td>Until machine removal</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="session-data">2.3 Session Data</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Purpose</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>terminal_output</code></td>
              <td>Real-time display and session logs for review</td>
              <td>Configurable (default: 90 days)</td>
            </tr>
            <tr>
              <td><code>commands / input</code></td>
              <td>Input relay between client and agent</td>
              <td>Transient (WebSocket only) or logged</td>
            </tr>
            <tr>
              <td><code>project_path</code></td>
              <td>Working directory identification</td>
              <td>Duration of session</td>
            </tr>
            <tr>
              <td><code>initial_prompt</code></td>
              <td>Session startup instruction</td>
              <td>Duration of session + logs</td>
            </tr>
            <tr>
              <td><code>pid</code> / <code>exit_code</code></td>
              <td>Process lifecycle management</td>
              <td>Duration of session + logs</td>
            </tr>
            <tr>
              <td><code>pty_size</code></td>
              <td>Terminal dimensions for proper rendering</td>
              <td>Duration of session</td>
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
          <h4>Terminal Output May Contain Sensitive Data</h4>
          <p>
            Terminal sessions may inadvertently capture sensitive information such as API keys,
            credentials, or personal data present in your codebase. ClaudeNest does not filter
            or redact session output. Operators should implement appropriate data handling
            policies and inform their users.
          </p>
        </div>
      </div>

      <h3 id="context-data">2.4 Context Data (RAG)</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Purpose</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>content</code> (text chunks)</td>
              <td>Shared project context for multi-agent collaboration</td>
              <td>Configurable expiration (default: 30 days)</td>
            </tr>
            <tr>
              <td><code>embedding</code> (vector 384d)</td>
              <td>Semantic similarity search via pgvector (cosine distance)</td>
              <td>Same as parent content chunk</td>
            </tr>
            <tr>
              <td><code>importance_score</code></td>
              <td>Prioritization of context retrieval</td>
              <td>Same as parent content chunk</td>
            </tr>
            <tr>
              <td><code>files</code> (references)</td>
              <td>Linking context to source files</td>
              <td>Same as parent content chunk</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Embeddings are generated locally using <strong>Ollama</strong> with the <code>bge-small-en-v1.5</code>
        model. No data is sent to external AI services for embedding generation.
      </p>

      <h3 id="usage-and-cost-data">2.5 Usage and Cost Data</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Purpose</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>total_tokens</code></td>
              <td>Token consumption tracking per session and project</td>
              <td>Indefinite (aggregated metrics)</td>
            </tr>
            <tr>
              <td><code>total_cost</code></td>
              <td>Cost estimation and budget monitoring</td>
              <td>Indefinite (aggregated metrics)</td>
            </tr>
            <tr>
              <td><code>context_tokens</code></td>
              <td>Context window usage per Claude instance</td>
              <td>Duration of instance lifecycle</td>
            </tr>
            <tr>
              <td><code>tasks_completed</code></td>
              <td>Productivity metrics and instance performance</td>
              <td>Duration of instance lifecycle</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="activity-logs">2.6 Activity Logs</h3>
      <p>
        ClaudeNest records an activity log for each shared project, including the instance ID,
        event type, and event details (stored as JSONB). These logs are used for audit trails,
        debugging, and collaboration visibility.
      </p>
    </section>

    <!-- Section 3: Legal Basis -->
    <section id="legal-basis">
      <h2 id="legal-basis">3. Legal Basis for Processing (GDPR Article 6)</h2>
      <p>
        ClaudeNest processes personal data under the following legal bases as defined in
        Article 6(1) of the General Data Protection Regulation:
      </p>

      <div class="legal-basis-grid">
        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(b)</span>
            <h4>Contractual Necessity</h4>
          </div>
          <p>
            Processing of account data, machine data, and session data is necessary for the
            performance of the contract between you and the service operator (providing the
            ClaudeNest platform).
          </p>
          <ul>
            <li>Account creation and authentication</li>
            <li>Machine registration and management</li>
            <li>Session creation and terminal relay</li>
            <li>Multi-agent coordination (tasks, file locks)</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(f)</span>
            <h4>Legitimate Interest</h4>
          </div>
          <p>
            Processing of usage data, activity logs, and performance metrics is based on our
            legitimate interest in maintaining and improving the platform.
          </p>
          <ul>
            <li>Token and cost tracking for billing transparency</li>
            <li>Activity logs for security and audit purposes</li>
            <li>Performance monitoring and optimization</li>
            <li>Fraud prevention and abuse detection</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(a)</span>
            <h4>Consent</h4>
          </div>
          <p>
            Where applicable, certain processing activities require your explicit consent:
          </p>
          <ul>
            <li>OAuth linking with third-party providers (Google, GitHub)</li>
            <li>Optional analytics and usage telemetry (if enabled)</li>
            <li>Push notifications on mobile devices</li>
          </ul>
        </div>

        <div class="legal-basis-card">
          <div class="basis-header">
            <span class="basis-label">Article 6(1)(c)</span>
            <h4>Legal Obligation</h4>
          </div>
          <p>
            Certain data may be retained to comply with legal obligations:
          </p>
          <ul>
            <li>Compliance with lawful data retention requirements</li>
            <li>Response to legal process or government requests</li>
            <li>Tax and accounting records (if applicable)</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 4: How We Use Data -->
    <section id="how-we-use">
      <h2 id="how-we-use">4. How We Use Your Data</h2>
      <p>Your personal data is used exclusively for the following purposes:</p>

      <div class="use-cases">
        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <div>
            <h4>Authentication and Access Control</h4>
            <p>Verifying your identity, managing sessions, and enforcing authorization policies.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/>
            </svg>
          </div>
          <div>
            <h4>Remote Machine Management</h4>
            <p>Connecting to your registered machines, managing PTY sessions, and relaying terminal I/O.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div>
            <h4>Multi-Agent Collaboration</h4>
            <p>Coordinating tasks, managing file locks, and sharing context between Claude instances.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          <div>
            <h4>Context RAG (Retrieval-Augmented Generation)</h4>
            <p>Generating local embeddings and performing semantic search to provide relevant context to Claude instances.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <div>
            <h4>Usage Monitoring and Cost Tracking</h4>
            <p>Tracking token consumption and cost estimates for transparency and budget management.</p>
          </div>
        </div>

        <div class="use-case">
          <div class="use-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
            </svg>
          </div>
          <div>
            <h4>Platform Improvement</h4>
            <p>Analyzing aggregated, anonymized usage patterns to improve features and performance.</p>
          </div>
        </div>
      </div>

      <p>
        ClaudeNest does <strong>not</strong> use your personal data for advertising, profiling,
        automated decision-making, or any purpose unrelated to the platform's core functionality.
      </p>
    </section>

    <!-- Section 5: Data Retention -->
    <section id="data-retention">
      <h2 id="data-retention">5. Data Retention</h2>
      <p>
        We retain personal data only as long as necessary for the purposes described in this policy.
        The following retention periods apply:
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data Category</th>
              <th>Retention Period</th>
              <th>Deletion Trigger</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account data</td>
              <td>Until account deletion</td>
              <td>User requests deletion or account is terminated</td>
            </tr>
            <tr>
              <td>Machine data</td>
              <td>Until machine removal</td>
              <td>User removes machine from the platform</td>
            </tr>
            <tr>
              <td>Session data</td>
              <td>Configurable (default: 90 days)</td>
              <td>Automatic expiration or manual deletion</td>
            </tr>
            <tr>
              <td>Session logs</td>
              <td>Configurable (default: 90 days)</td>
              <td>Automatic cleanup job</td>
            </tr>
            <tr>
              <td>Context chunks</td>
              <td>Configurable (default: 30 days)</td>
              <td>Automatic expiration via <code>expires_at</code></td>
            </tr>
            <tr>
              <td>Embeddings (pgvector)</td>
              <td>Same as parent chunk</td>
              <td>Cascade deletion with context chunk</td>
            </tr>
            <tr>
              <td>Activity logs</td>
              <td>Configurable (default: 180 days)</td>
              <td>Automatic cleanup job</td>
            </tr>
            <tr>
              <td>File locks</td>
              <td>Until released or expired</td>
              <td>Automatic expiration (default: 30 minutes)</td>
            </tr>
            <tr>
              <td>Usage metrics</td>
              <td>Indefinite (aggregated)</td>
              <td>Account deletion (user-specific data)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Instance operators can configure retention periods through the <code>claudenest.php</code>
        configuration file and scheduled cleanup commands.
      </p>
    </section>

    <!-- Section 6: Data Sharing -->
    <section id="data-sharing">
      <h2 id="data-sharing">6. Data Sharing and Third Parties</h2>
      <p>
        ClaudeNest is architected with a strong emphasis on data locality. By design,
        the platform minimizes external data transfer.
      </p>

      <h3 id="infrastructure-components">6.1 Infrastructure Components</h3>
      <div class="third-party-grid">
        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>Ollama (AI Engine)</h4>
          </div>
          <p>
            Embedding generation (<code>bge-small-en-v1.5</code>) and summarization (<code>mistral:7b</code>)
            are performed entirely on-premise via Ollama. <strong>No data is transmitted to
            external AI services.</strong>
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>PostgreSQL + pgvector</h4>
          </div>
          <p>
            All persistent data, including vector embeddings, is stored in your local or
            self-managed PostgreSQL instance. No cloud database services are required.
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>Redis</h4>
          </div>
          <p>
            Used for caching, session management, queue processing, and WebSocket state.
            All data remains in-memory on your local or self-managed Redis instance.
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge local">Local</span>
            <h4>Laravel Reverb (WebSocket)</h4>
          </div>
          <p>
            Real-time communication is handled by Laravel Reverb, a self-hosted WebSocket
            server. No third-party WebSocket services (e.g., Pusher, Ably) are used.
          </p>
        </div>
      </div>

      <h3 id="optional-external-services">6.2 Optional External Services</h3>
      <div class="third-party-grid">
        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">External</span>
            <h4>Google OAuth</h4>
          </div>
          <p>
            If configured, Google OAuth is used for authentication. Google receives the
            standard OAuth flow data (authorization code, redirect URI). Only the user's
            email, name, and avatar URL are retrieved.
          </p>
        </div>

        <div class="third-party-card">
          <div class="tp-header">
            <span class="tp-badge external">External</span>
            <h4>GitHub OAuth</h4>
          </div>
          <p>
            If configured, GitHub OAuth is used for authentication. GitHub receives the
            standard OAuth flow data. Only the user's email, name, and avatar URL are retrieved.
          </p>
        </div>
      </div>

      <h3 id="no-data-sales">6.3 No Data Sales</h3>
      <p>
        ClaudeNest does <strong>not</strong> sell, rent, lease, or trade personal data to any
        third party for any purpose whatsoever. We do not engage in data brokering.
      </p>
    </section>

    <!-- Section 7: Your Rights -->
    <section id="your-rights">
      <h2 id="your-rights">7. Your Rights Under GDPR</h2>
      <p>
        Under the General Data Protection Regulation, you have the following rights regarding
        your personal data. These rights can be exercised by contacting the Data Protection
        Officer (DPO) of your ClaudeNest instance operator.
      </p>

      <div class="rights-grid">
        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 15</span>
            <h4>Right of Access</h4>
          </div>
          <p>
            You have the right to obtain confirmation of whether your personal data is being
            processed, and to receive a copy of that data in a structured, commonly used format.
          </p>
          <div class="right-how">
            <strong>How to exercise:</strong> Request a data export through your account settings
            or contact the DPO.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 16</span>
            <h4>Right to Rectification</h4>
          </div>
          <p>
            You have the right to request correction of inaccurate personal data, and to have
            incomplete data completed.
          </p>
          <div class="right-how">
            <strong>How to exercise:</strong> Update your profile in account settings,
            or contact the DPO for data you cannot modify directly.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 17</span>
            <h4>Right to Erasure ("Right to be Forgotten")</h4>
          </div>
          <p>
            You have the right to request deletion of your personal data when it is no longer
            necessary for the purposes for which it was collected, or when you withdraw consent.
          </p>
          <div class="right-how">
            <strong>How to exercise:</strong> Delete your account through settings (cascading
            deletion of all associated data), or contact the DPO.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 18</span>
            <h4>Right to Restriction of Processing</h4>
          </div>
          <p>
            You have the right to request restriction of processing of your data in certain
            circumstances, such as when you contest the accuracy of the data.
          </p>
          <div class="right-how">
            <strong>How to exercise:</strong> Contact the DPO with your specific restriction request.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 20</span>
            <h4>Right to Data Portability</h4>
          </div>
          <p>
            You have the right to receive your personal data in a structured, commonly used,
            and machine-readable format (JSON), and to transmit it to another controller.
          </p>
          <div class="right-how">
            <strong>How to exercise:</strong> Use the data export feature in your account settings,
            which provides a JSON archive of all your data.
          </div>
        </div>

        <div class="right-card">
          <div class="right-header">
            <span class="right-article">Art. 21</span>
            <h4>Right to Object</h4>
          </div>
          <p>
            You have the right to object to processing of your personal data based on
            legitimate interests, including profiling. You may also object to processing
            for direct marketing purposes at any time.
          </p>
          <div class="right-how">
            <strong>How to exercise:</strong> Contact the DPO. Processing will cease unless
            compelling legitimate grounds override your interests.
          </div>
        </div>
      </div>

      <div class="info-card info-card--spaced">
        <div class="info-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <h4>Right to Lodge a Complaint</h4>
          <p>
            If you believe your data protection rights have been violated, you have the right
            to lodge a complaint with your national supervisory authority. In France, this is
            the <a href="https://www.cnil.fr" target="_blank" rel="noopener">CNIL</a>
            (Commission Nationale de l'Informatique et des Libertes).
          </p>
        </div>
      </div>

      <p>
        We will respond to all legitimate requests within <strong>30 days</strong>.
        In complex cases, this period may be extended by an additional 60 days,
        with prior notification.
      </p>
    </section>

    <!-- Section 8: Cookies -->
    <section id="cookies">
      <h2 id="cookies">8. Cookies and Tracking</h2>
      <p>
        ClaudeNest uses minimal cookies and does not employ third-party tracking technologies.
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cookie / Storage</th>
              <th>Type</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>XSRF-TOKEN</code></td>
              <td>Strictly Necessary</td>
              <td>CSRF protection for form submissions</td>
              <td>Session</td>
            </tr>
            <tr>
              <td><code>laravel_session</code></td>
              <td>Strictly Necessary</td>
              <td>Server-side session identification</td>
              <td>2 hours</td>
            </tr>
            <tr>
              <td><code>localStorage: auth_token</code></td>
              <td>Strictly Necessary</td>
              <td>API authentication token (Sanctum)</td>
              <td>Until logout</td>
            </tr>
            <tr>
              <td><code>localStorage: theme</code></td>
              <td>Functional</td>
              <td>User theme preference</td>
              <td>Persistent</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        ClaudeNest does <strong>not</strong> use:
      </p>
      <ul>
        <li>Google Analytics or any third-party analytics service</li>
        <li>Advertising cookies or tracking pixels</li>
        <li>Cross-site tracking mechanisms</li>
        <li>Browser fingerprinting techniques</li>
      </ul>

      <p>
        Since all cookies used are strictly necessary for the platform to function,
        no cookie consent banner is required under GDPR. However, instance operators
        may choose to add one for additional transparency.
      </p>
    </section>

    <!-- Section 9: Data Security -->
    <section id="data-security">
      <h2 id="data-security">9. Data Security Measures</h2>
      <p>
        ClaudeNest implements comprehensive technical and organizational measures to protect
        your personal data against unauthorized access, alteration, disclosure, or destruction.
      </p>

      <div class="security-measures">
        <div class="measure-category">
          <h4>Transport Security</h4>
          <ul>
            <li><strong>TLS 1.3</strong> enforced for all HTTP and WebSocket connections in production</li>
            <li><strong>HTTPS-only</strong> configuration recommended for all deployments</li>
            <li><strong>WebSocket encryption</strong> via WSS (WebSocket Secure) protocol</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Authentication Security</h4>
          <ul>
            <li><strong>Bcrypt hashing</strong> for all passwords (never stored in plaintext)</li>
            <li><strong>SHA-256 hashing</strong> for machine tokens and API tokens</li>
            <li><strong>OS Keychain storage</strong> for agent tokens via <code>keytar</code></li>
            <li><strong>Laravel Sanctum</strong> token-based authentication with scoped abilities</li>
            <li><strong>Token expiration</strong> and rotation mechanisms</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Application Security</h4>
          <ul>
            <li><strong>CSRF protection</strong> on all web routes</li>
            <li><strong>Rate limiting</strong> on all API endpoints</li>
            <li><strong>Input validation</strong> via Laravel Form Requests</li>
            <li><strong>Parameterized queries</strong> via Eloquent ORM (SQL injection prevention)</li>
            <li><strong>Content Security Policy</strong> headers</li>
            <li><strong>No sensitive data in logs</strong> policy enforced across all components</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Infrastructure Security</h4>
          <ul>
            <li><strong>Self-hosted architecture</strong> keeping data on your own infrastructure</li>
            <li><strong>Database encryption at rest</strong> (recommended for production)</li>
            <li><strong>Redis AUTH</strong> for cache and queue authentication</li>
            <li><strong>Network isolation</strong> recommended for database and cache services</li>
            <li><strong>Regular security updates</strong> via dependency management</li>
          </ul>
        </div>

        <div class="measure-category">
          <h4>Agent Security</h4>
          <ul>
            <li><strong>Certificate validation</strong> for TLS connections</li>
            <li><strong>No credential exposure</strong> in logs or terminal output</li>
            <li><strong>Structured logging</strong> via Pino with sensitive data filtering</li>
            <li><strong>Heartbeat monitoring</strong> for connection integrity</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section 10: International Transfers -->
    <section id="international-transfers">
      <h2 id="international-transfers">10. International Data Transfers</h2>
      <p>
        ClaudeNest is designed to be self-hosted, meaning your data remains on infrastructure
        you control. In this default configuration, no international data transfers occur.
      </p>
      <p>
        If your ClaudeNest instance is hosted in one jurisdiction and accessed from another,
        the following safeguards should be considered by the instance operator:
      </p>
      <ul>
        <li>
          <strong>EU to EU:</strong> No additional safeguards required under GDPR.
        </li>
        <li>
          <strong>EU to Adequate Countries:</strong> Transfers to countries with an adequacy
          decision from the European Commission are permitted without additional safeguards.
        </li>
        <li>
          <strong>EU to Other Countries:</strong> Appropriate safeguards must be implemented,
          such as Standard Contractual Clauses (SCCs) or Binding Corporate Rules (BCRs).
        </li>
      </ul>
      <p>
        When OAuth providers are used (Google, GitHub), authentication data may be processed
        in the United States. Both Google and GitHub have committed to compliance with
        the EU-U.S. Data Privacy Framework.
      </p>
    </section>

    <!-- Section 11: Children's Privacy -->
    <section id="childrens-privacy">
      <h2 id="childrens-privacy">11. Children's Privacy</h2>
      <p>
        ClaudeNest is a professional software development tool and is not directed at individuals
        under the age of 16 (or the applicable minimum age in your jurisdiction).
      </p>
      <p>
        We do not knowingly collect personal data from children. If you become aware that a child
        has provided personal data to a ClaudeNest instance, please contact the instance operator's
        DPO immediately. The data will be deleted promptly.
      </p>
    </section>

    <!-- Section 12: Policy Changes -->
    <section id="policy-changes">
      <h2 id="policy-changes">12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices,
        technology, legal requirements, or other factors. When we make material changes:
      </p>
      <ul>
        <li>The "Last updated" date at the top of this page will be revised.</li>
        <li>A prominent notice will be displayed in the ClaudeNest dashboard for 30 days.</li>
        <li>Registered users will be notified via email (if email notifications are enabled).</li>
        <li>
          For changes that affect the legal basis of processing or introduce new data categories,
          we will seek renewed consent where required by GDPR.
        </li>
      </ul>
      <p>
        We encourage you to review this Privacy Policy periodically. Your continued use of
        ClaudeNest after changes are posted constitutes acceptance of the updated policy.
      </p>
    </section>

    <!-- Section 13: Contact DPO -->
    <section id="contact-dpo">
      <h2 id="contact-dpo">13. Contact the Data Protection Officer</h2>
      <p>
        If you have questions, concerns, or requests regarding this Privacy Policy or the
        processing of your personal data, please contact the Data Protection Officer (DPO):
      </p>

      <div class="contact-card">
        <div class="contact-methods">
          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <div>
              <strong>Email</strong>
              <p><a href="mailto:dpo@claudenest.dev">dpo@claudenest.dev</a></p>
            </div>
          </div>

          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <div>
              <strong>Website</strong>
              <p><a href="https://claudenest.dev/privacy" target="_blank" rel="noopener">claudenest.dev/privacy</a></p>
            </div>
          </div>

          <div class="contact-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
            </svg>
            <div>
              <strong>GitHub</strong>
              <p><a href="https://github.com/claudenest/claudenest/issues" target="_blank" rel="noopener">Open an issue</a></p>
            </div>
          </div>
        </div>
      </div>

      <p>
        We will acknowledge receipt of your request within <strong>48 hours</strong> and provide
        a substantive response within <strong>30 days</strong>, as required by GDPR Article 12(3).
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, #a855f7, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: #a9b1d6;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.last-updated {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

/* Table of Contents */
.policy-toc {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  margin-bottom: 3rem;
}

.policy-toc h2 {
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: #a9b1d6;
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
  color: #a9b1d6;
  text-decoration: none;
  transition: color 0.2s;
}

.policy-toc a:hover {
  color: #a855f7;
}

/* Sections */
section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: #ffffff;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: #ffffff;
}

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #ffffff;
}

p {
  color: #a9b1d6;
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul, ol {
  color: #a9b1d6;
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

a {
  color: #a855f7;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #22d3ee;
}

strong {
  color: #e2e8f0;
}

/* Data Tables */
.data-table-wrapper {
  overflow-x: auto;
  margin: 1rem 0 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table thead {
  background: rgba(168, 85, 247, 0.08);
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #a855f7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  color: #a9b1d6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: top;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Info Card */
.info-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.info-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #a855f7;
  background: rgba(168, 85, 247, 0.12);
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
}

.use-case:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.12);
}

.use-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: rgba(168, 85, 247, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a855f7;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.12);
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
  color: #64748b;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 0.75rem;
}

.right-how strong {
  color: #a9b1d6;
}

/* Security Measures */
.security-measures {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.measure-category {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
}

.measure-category h4 {
  color: #a855f7;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #a855f7;
  flex-shrink: 0;
  margin-top: 2px;
}

.contact-method strong {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
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
