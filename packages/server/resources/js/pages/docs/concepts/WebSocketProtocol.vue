<template>
  <article class="doc-content">
    <header class="doc-header">
      <span class="badge">{{ t('docDocsConceptsWebsocketprotocol.badge') }}</span>
      <h1>{{ t('docDocsConceptsWebsocketprotocol.title') }}</h1>
      <p class="lead">
        {{ t('docDocsConceptsWebsocketprotocol.lead') }}
      </p>
    </header>

    <!-- 1. Overview -->
    <section id="overview">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.overviewHeading') }}</h2>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.overviewPara1') }}
      </p>
      <p>
        <i18n-t keypath="docDocsConceptsWebsocketprotocol.overviewPara2" tag="span">
          <template #reverb><strong>Laravel Reverb</strong></template>
        </i18n-t>
      </p>

      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <h4>{{ t('docDocsConceptsWebsocketprotocol.featureDeliveryTitle') }}</h4>
          <p>{{ t('docDocsConceptsWebsocketprotocol.featureDeliveryDesc') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h4>{{ t('docDocsConceptsWebsocketprotocol.featurePrivateTitle') }}</h4>
          <p>{{ t('docDocsConceptsWebsocketprotocol.featurePrivateDesc') }}</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h4>{{ t('docDocsConceptsWebsocketprotocol.featureFanoutTitle') }}</h4>
          <p>{{ t('docDocsConceptsWebsocketprotocol.featureFanoutDesc') }}</p>
        </div>
      </div>
    </section>

    <!-- 2. Architecture -->
    <section id="architecture">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.architectureHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsConceptsWebsocketprotocol.architecturePara1" tag="span">
          <template #reverb><strong>Laravel Reverb</strong></template>
          <template #redis><strong>Redis</strong></template>
        </i18n-t>
      </p>

      <div class="arch-diagram">
        <div class="arch-row">
          <div class="arch-node client">
            <span class="node-label">{{ t('docDocsConceptsWebsocketprotocol.archWebDashboard') }}</span>
            <span class="node-sub">Vue.js + Laravel Echo</span>
          </div>
          <div class="arch-node client">
            <span class="node-label">{{ t('docDocsConceptsWebsocketprotocol.archMobileApp') }}</span>
            <span class="node-sub">React Native + Socket.io</span>
          </div>
          <div class="arch-node client">
            <span class="node-label">{{ t('docDocsConceptsWebsocketprotocol.archAgent') }}</span>
            <span class="node-sub">Node.js + ws</span>
          </div>
        </div>

        <div class="arch-connector">
          <span class="connector-label">{{ t('docDocsConceptsWebsocketprotocol.archConnectorWebsocket') }}</span>
          <div class="connector-line"></div>
        </div>

        <div class="arch-row">
          <div class="arch-node server">
            <span class="node-label">Laravel Reverb</span>
            <span class="node-sub">{{ t('docDocsConceptsWebsocketprotocol.archWebsocketServer') }}</span>
          </div>
        </div>

        <div class="arch-connector">
          <span class="connector-label">Pub/Sub</span>
          <div class="connector-line"></div>
        </div>

        <div class="arch-row">
          <div class="arch-node broker">
            <span class="node-label">Redis</span>
            <span class="node-sub">{{ t('docDocsConceptsWebsocketprotocol.archMessageBroker') }}</span>
          </div>
          <div class="arch-node broker">
            <span class="node-label">Laravel Workers</span>
            <span class="node-sub">{{ t('docDocsConceptsWebsocketprotocol.archQueueBroadcast') }}</span>
          </div>
          <div class="arch-node broker">
            <span class="node-label">PostgreSQL</span>
            <span class="node-sub">{{ t('docDocsConceptsWebsocketprotocol.archPersistentState') }}</span>
          </div>
        </div>
      </div>

      <p>
        {{ t('docDocsConceptsWebsocketprotocol.architecturePara2') }}
      </p>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ t('docDocsConceptsWebsocketprotocol.tipPusherTitle') }}</h4>
          <p>
            <i18n-t keypath="docDocsConceptsWebsocketprotocol.tipPusherDesc" tag="span">
              <template #ws><code>ws</code></template>
            </i18n-t>
          </p>
        </div>
      </div>
    </section>

    <!-- 3. Connection Flow -->
    <section id="connection-flow">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.connectionHeading') }}</h2>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.connectionPara1') }}
      </p>

      <CodeBlock :code="connectionFlow" language="typescript" :filename="t('docDocsConceptsWebsocketprotocol.connectionFilename')" />

      <h3>{{ t('docDocsConceptsWebsocketprotocol.connectionStepByStep') }}</h3>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <h4>{{ t('docDocsConceptsWebsocketprotocol.step1Title') }}</h4>
            <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.step1Desc" tag="span">
              <template #get><code>GET</code></template>
              <template #upgrade><code>Upgrade: websocket</code></template>
              <template #auth><code>Authorization: Bearer &lt;token&gt;</code></template>
            </i18n-t></p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <h4>{{ t('docDocsConceptsWebsocketprotocol.step2Title') }}</h4>
            <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.step2Desc" tag="span">
              <template #switching><code>101 Switching Protocols</code></template>
              <template #forbidden><code>403</code></template>
            </i18n-t></p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <h4>{{ t('docDocsConceptsWebsocketprotocol.step3Title') }}</h4>
            <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.step3Desc" tag="span">
              <template #endpoint><code>POST /broadcasting/auth</code></template>
            </i18n-t></p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <div>
            <h4>{{ t('docDocsConceptsWebsocketprotocol.step4Title') }}</h4>
            <p>{{ t('docDocsConceptsWebsocketprotocol.step4Desc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Channel Types -->
    <section id="channels">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.channelsHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsConceptsWebsocketprotocol.channelsPara1" tag="span">
          <template #private><strong>{{ t('docDocsConceptsWebsocketprotocol.channelsPrivateChannels') }}</strong></template>
          <template #channelsFile><code>routes/channels.php</code></template>
        </i18n-t>
      </p>

      <div class="channels-table">
        <table>
          <thead>
            <tr>
              <th>{{ t('docDocsConceptsWebsocketprotocol.channelsColChannel') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.channelsColScope') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.channelsColSubscribers') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.channelsColPurpose') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>private-sessions.{id}</code></td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsSessionScope') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsSessionSubscribers') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsSessionPurpose') }}</td>
            </tr>
            <tr>
              <td><code>private-machines.{id}</code></td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsMachineScope') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsMachineSubscribers') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsMachinePurpose') }}</td>
            </tr>
            <tr>
              <td><code>private-projects.{id}</code></td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsProjectScope') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsProjectSubscribers') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsProjectPurpose') }}</td>
            </tr>
            <tr>
              <td><code>private-users.{id}</code></td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsUserScope') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsUserSubscribers') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.channelsUserPurpose') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.channelAuthHeading') }}</h3>
      <CodeBlock :code="channelAuth" language="php" filename="routes/channels.php" />
    </section>

    <!-- 5. Event Types -->
    <section id="events">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.eventsHeading') }}</h2>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.eventsPara1') }}
      </p>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.eventsSessionHeading') }}</h3>
      <div class="events-list">
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">session.output</code>
            <span class="event-channel">private-sessions.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventOutputDesc') }}</p>
          <CodeBlock :code="eventOutput" language="json" />
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">session.input</code>
            <span class="event-channel">private-sessions.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventInputDesc') }}</p>
          <CodeBlock :code="eventInput" language="json" />
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">session.status</code>
            <span class="event-channel">private-sessions.{id}</span>
          </div>
          <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.eventStatusDesc" tag="span">
            <template #values><code>starting</code>, <code>active</code>, <code>idle</code>, <code>completed</code>, <code>error</code></template>
          </i18n-t></p>
          <CodeBlock :code="eventStatus" language="json" />
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">session.resize</code>
            <span class="event-channel">private-sessions.{id}</span>
          </div>
          <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.eventResizeDesc" tag="span">
            <template #resize><code>pty.resize(cols, rows)</code></template>
            <template #sigwinch><code>SIGWINCH</code></template>
          </i18n-t></p>
          <CodeBlock :code="eventResize" language="json" />
        </div>
      </div>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.eventsMachineHeading') }}</h3>
      <div class="events-list">
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">machine.status</code>
            <span class="event-channel">private-machines.{id}</span>
          </div>
          <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.eventMachineStatusDesc" tag="span">
            <template #values><code>online</code>, <code>offline</code>, <code>connecting</code></template>
          </i18n-t></p>
          <CodeBlock :code="eventMachineStatus" language="json" />
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">machine.command</code>
            <span class="event-channel">private-machines.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventMachineCommandDesc') }}</p>
          <CodeBlock :code="eventMachineCommand" language="json" />
        </div>
      </div>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.eventsTaskHeading') }}</h3>
      <div class="events-list">
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.created</code>
            <span class="event-channel">private-projects.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventTaskCreatedDesc') }}</p>
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.claimed</code>
            <span class="event-channel">private-projects.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventTaskClaimedDesc') }}</p>
          <CodeBlock :code="eventTaskClaimed" language="json" />
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.completed</code>
            <span class="event-channel">private-projects.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventTaskCompletedDesc') }}</p>
          <CodeBlock :code="eventTaskCompleted" language="json" />
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">task.released</code>
            <span class="event-channel">private-projects.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventTaskReleasedDesc') }}</p>
        </div>
      </div>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.eventsFileLockHeading') }}</h3>
      <div class="events-list">
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">file.locked</code>
            <span class="event-channel">private-projects.{id}</span>
          </div>
          <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.eventFileLockedDesc" tag="span">
            <template #unlocked><code>file.unlocked</code></template>
          </i18n-t></p>
          <CodeBlock :code="eventFileLocked" language="json" />
        </div>

        <div class="event-card">
          <div class="event-header">
            <code class="event-name">file.unlocked</code>
            <span class="event-channel">private-projects.{id}</span>
          </div>
          <p><i18n-t keypath="docDocsConceptsWebsocketprotocol.eventFileUnlockedDesc" tag="span">
            <template #expires><code>expires_at</code></template>
          </i18n-t></p>
        </div>
      </div>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.eventsProjectHeading') }}</h3>
      <div class="events-list">
        <div class="event-card">
          <div class="event-header">
            <code class="event-name">project.broadcast</code>
            <span class="event-channel">private-projects.{id}</span>
          </div>
          <p>{{ t('docDocsConceptsWebsocketprotocol.eventProjectBroadcastDesc') }}</p>
          <CodeBlock :code="eventProjectBroadcast" language="json" />
        </div>
      </div>
    </section>

    <!-- 6. Message Format -->
    <section id="message-format">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.messageFormatHeading') }}</h2>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.messageFormatPara1') }}
      </p>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.messageFormatServerHeading') }}</h3>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.messageFormatServerDesc') }}
      </p>
      <CodeBlock :code="messageFormatBroadcast" language="json" :filename="t('docDocsConceptsWebsocketprotocol.messageFormatBroadcastFilename')" />

      <h3>{{ t('docDocsConceptsWebsocketprotocol.messageFormatClientHeading') }}</h3>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.messageFormatClientDesc') }}
      </p>
      <CodeBlock :code="messageFormatClient" language="json" :filename="t('docDocsConceptsWebsocketprotocol.messageFormatClientFilename')" />

      <h3>{{ t('docDocsConceptsWebsocketprotocol.messageFormatAgentHeading') }}</h3>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.messageFormatAgentDesc') }}
      </p>
      <CodeBlock :code="messageFormatAgent" language="json" :filename="t('docDocsConceptsWebsocketprotocol.messageFormatAgentFilename')" />
    </section>

    <!-- 7. Authentication -->
    <section id="authentication">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.authHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsConceptsWebsocketprotocol.authPara1" tag="span">
          <template #sanctum><strong>Laravel Sanctum</strong></template>
        </i18n-t>
      </p>

      <CodeTabs :tabs="authTabs" />

      <h3>{{ t('docDocsConceptsWebsocketprotocol.authChannelAuthHeading') }}</h3>
      <p>
        <i18n-t keypath="docDocsConceptsWebsocketprotocol.authChannelAuthDesc" tag="span">
          <template #post><code>POST</code></template>
          <template #endpoint><code>/broadcasting/auth</code></template>
          <template #channelsFile><code>routes/channels.php</code></template>
        </i18n-t>
      </p>

      <div class="tip warning">
        <span class="tip-icon">!</span>
        <div>
          <h4>{{ t('docDocsConceptsWebsocketprotocol.authWarningTitle') }}</h4>
          <p>
            <i18n-t keypath="docDocsConceptsWebsocketprotocol.authWarningDesc" tag="span">
              <template #authHeader><code>Authorization</code></template>
              <template #echoOption><code>auth.headers</code></template>
            </i18n-t>
          </p>
        </div>
      </div>
    </section>

    <!-- 8. Reconnection Strategy -->
    <section id="reconnection">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.reconnectionHeading') }}</h2>
      <p>
        <i18n-t keypath="docDocsConceptsWebsocketprotocol.reconnectionPara1" tag="span">
          <template #maxDelay><strong>{{ t('docDocsConceptsWebsocketprotocol.reconnectionMaxDelay') }}</strong></template>
          <template #maxAttempts><strong>{{ t('docDocsConceptsWebsocketprotocol.reconnectionMaxAttempts') }}</strong></template>
          <template #event><code>reconnect_failed</code></template>
        </i18n-t>
      </p>

      <CodeBlock :code="reconnectionStrategy" language="typescript" filename="packages/agent/src/websocket/client.ts" />

      <h3>{{ t('docDocsConceptsWebsocketprotocol.backoffScheduleHeading') }}</h3>
      <div class="channels-table">
        <table>
          <thead>
            <tr>
              <th>{{ t('docDocsConceptsWebsocketprotocol.backoffColAttempt') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.backoffColBaseDelay') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.backoffColJitter') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>1 s</td>
              <td>0.8 – 1.2 s</td>
            </tr>
            <tr>
              <td>2</td>
              <td>2 s</td>
              <td>1.6 – 2.4 s</td>
            </tr>
            <tr>
              <td>3</td>
              <td>4 s</td>
              <td>3.2 – 4.8 s</td>
            </tr>
            <tr>
              <td>4</td>
              <td>8 s</td>
              <td>6.4 – 9.6 s</td>
            </tr>
            <tr>
              <td>5</td>
              <td>16 s</td>
              <td>12.8 – 19.2 s</td>
            </tr>
            <tr>
              <td>6+</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.backoffCapDelay') }}</td>
              <td>24 – 36 s</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ t('docDocsConceptsWebsocketprotocol.tipQueuingTitle') }}</h4>
          <p>
            {{ t('docDocsConceptsWebsocketprotocol.tipQueuingDesc') }}
          </p>
        </div>
      </div>
    </section>

    <!-- 9. Heartbeat -->
    <section id="heartbeat">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.heartbeatHeading') }}</h2>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.heartbeatPara1') }}
      </p>

      <h3>{{ t('docDocsConceptsWebsocketprotocol.heartbeatAgentHeading') }}</h3>
      <CodeBlock :code="heartbeatCode" language="typescript" :filename="t('docDocsConceptsWebsocketprotocol.heartbeatAgentFilename')" />

      <h3>{{ t('docDocsConceptsWebsocketprotocol.heartbeatReverbHeading') }}</h3>
      <p>
        <i18n-t keypath="docDocsConceptsWebsocketprotocol.heartbeatReverbDesc" tag="span">
          <template #ping><code>pusher:ping</code></template>
          <template #pong><code>pusher:pong</code></template>
        </i18n-t>
      </p>

      <div class="heartbeat-flow">
        <div class="hb-step">
          <div class="hb-node agent">{{ t('docDocsConceptsWebsocketprotocol.heartbeatNodeAgent') }}</div>
          <div class="hb-arrow">
            <span>{{ t('docDocsConceptsWebsocketprotocol.heartbeatArrowPing') }}</span>
            <svg width="80" height="12" viewBox="0 0 80 12">
              <line x1="0" y1="6" x2="68" y2="6" stroke="currentColor" stroke-width="1.5"/>
              <polyline points="60,2 68,6 60,10" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <div class="hb-node server">{{ t('docDocsConceptsWebsocketprotocol.heartbeatNodeServer') }}</div>
        </div>
        <div class="hb-step">
          <div class="hb-node agent">{{ t('docDocsConceptsWebsocketprotocol.heartbeatNodeAgent') }}</div>
          <div class="hb-arrow reverse">
            <svg width="80" height="12" viewBox="0 0 80 12">
              <line x1="80" y1="6" x2="12" y2="6" stroke="currentColor" stroke-width="1.5"/>
              <polyline points="20,2 12,6 20,10" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            <span>{{ t('docDocsConceptsWebsocketprotocol.heartbeatArrowPong') }}</span>
          </div>
          <div class="hb-node server">{{ t('docDocsConceptsWebsocketprotocol.heartbeatNodeServer') }}</div>
        </div>
      </div>
    </section>

    <!-- 10. Client Libraries -->
    <section id="client-libraries">
      <h2>{{ t('docDocsConceptsWebsocketprotocol.clientLibsHeading') }}</h2>
      <p>
        {{ t('docDocsConceptsWebsocketprotocol.clientLibsPara1') }}
      </p>

      <CodeTabs :tabs="clientLibsTabs" />

      <h3>{{ t('docDocsConceptsWebsocketprotocol.libraryReferenceHeading') }}</h3>
      <div class="channels-table">
        <table>
          <thead>
            <tr>
              <th>{{ t('docDocsConceptsWebsocketprotocol.libColClient') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.libColLibrary') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.libColProtocol') }}</th>
              <th>{{ t('docDocsConceptsWebsocketprotocol.libColNotes') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ t('docDocsConceptsWebsocketprotocol.libWebDashboard') }}</td>
              <td><code>laravel-echo</code> + <code>pusher-js</code></td>
              <td>Pusher / Reverb</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.libWebNotes') }}</td>
            </tr>
            <tr>
              <td>{{ t('docDocsConceptsWebsocketprotocol.libAgent') }}</td>
              <td><code>ws</code></td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.libAgentProtocol') }}</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.libAgentNotes') }}</td>
            </tr>
            <tr>
              <td>{{ t('docDocsConceptsWebsocketprotocol.libMobileApp') }}</td>
              <td><code>socket.io-client</code></td>
              <td>Socket.io / Pusher adapter</td>
              <td>{{ t('docDocsConceptsWebsocketprotocol.libMobileNotes') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const { t } = useI18n();

// ==================== Connection Flow ====================
const connectionFlow = ref(`// Sequence: client → Reverb → Laravel → channel authorization

// 1. HTTP Upgrade request (headers set by Echo / ws library)
// GET /app/local-key HTTP/1.1
// Host: ws.claudenest.io
// Upgrade: websocket
// Connection: Upgrade
// Authorization: Bearer <sanctum-token>

// 2. Reverb validates token → 101 Switching Protocols

// 3. Client subscribes to private channel
echo.private(\`sessions.\${sessionId}\`)
  // Reverb POSTs to /broadcasting/auth
  // Laravel checks: session.user_id === auth()->id()
  // Returns signed socket auth token

  // 4. Event stream begins
  .listen('.session.output', (event) => {
    terminal.write(event.data);
  });`);

// ==================== Channel Auth ====================
const channelAuth = ref(`use Illuminate\\Support\\Facades\\Broadcast;

// Sessions: only the session owner can subscribe
Broadcast::channel('sessions.{sessionId}', function ($user, $sessionId) {
    $session = \\App\\Models\\Session::find($sessionId);
    return $session && $session->user_id === $user->id;
});

// Machines: only the machine owner can subscribe
Broadcast::channel('machines.{machineId}', function ($user, $machineId) {
    $machine = \\App\\Models\\Machine::find($machineId);
    return $machine && $machine->user_id === $user->id;
});

// Projects: only the project owner can subscribe
Broadcast::channel('projects.{projectId}', function ($user, $projectId) {
    $project = \\App\\Models\\SharedProject::find($projectId);
    return $project && $project->user_id === $user->id;
});

// Users: strict identity match — users subscribe to their own channel only
Broadcast::channel('users.{userId}', function ($user, $userId) {
    return $user->id === $userId;
});`);

// ==================== Session Events ====================
const eventOutput = ref(`{
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "data": "\\u001b[32mRefactoring complete!\\u001b[0m\\r\\n",
  "chunk_id": "ch_abc123",
  "timestamp": "2026-02-17T14:30:00.000Z"
}`);

const eventInput = ref(`{
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "data": "Please refactor the auth module\\n",
  "timestamp": "2026-02-17T14:29:55.000Z"
}`);

const eventStatus = ref(`{
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "active",
  "previous_status": "starting",
  "pid": 14827,
  "timestamp": "2026-02-17T14:29:58.000Z"
}`);

const eventResize = ref(`{
  "session_id": "550e8400-e29b-41d4-a716-446655440001",
  "cols": 150,
  "rows": 50,
  "timestamp": "2026-02-17T14:30:10.000Z"
}`);

// ==================== Machine Events ====================
const eventMachineStatus = ref(`{
  "machine_id": "7a3f8c00-e29b-41d4-a716-446655440010",
  "status": "online",
  "previous_status": "connecting",
  "agent_version": "1.4.2",
  "active_sessions": 2,
  "timestamp": "2026-02-17T14:28:00.000Z"
}`);

const eventMachineCommand = ref(`{
  "machine_id": "7a3f8c00-e29b-41d4-a716-446655440010",
  "command": "session:create",
  "payload": {
    "session_id": "550e8400-e29b-41d4-a716-446655440001",
    "project_path": "/home/dev/my-project",
    "initial_prompt": "Implement the feature described in TASK-42",
    "pty_size": { "cols": 120, "rows": 40 }
  },
  "timestamp": "2026-02-17T14:30:00.000Z"
}`);

// ==================== Task Events ====================
const eventTaskClaimed = ref(`{
  "task_id": "550e8400-e29b-41d4-a716-446655440099",
  "instance_id": "claude-instance-1",
  "title": "Refactor authentication module",
  "priority": "high",
  "claimed_at": "2026-02-17T14:30:00.000Z"
}`);

const eventTaskCompleted = ref(`{
  "task_id": "550e8400-e29b-41d4-a716-446655440099",
  "instance_id": "claude-instance-1",
  "completion_summary": "Extracted auth logic into AuthMiddleware, updated all 8 route groups.",
  "files_modified": [
    "app/Http/Middleware/AuthMiddleware.php",
    "routes/api.php"
  ],
  "completed_at": "2026-02-17T15:12:33.000Z"
}`);

// ==================== File Lock Events ====================
const eventFileLocked = ref(`{
  "project_id": "bb4e8a00-e29b-41d4-a716-446655440055",
  "path": "app/Http/Middleware/AuthMiddleware.php",
  "locked_by": "claude-instance-1",
  "reason": "refactoring",
  "expires_at": "2026-02-17T15:00:00.000Z",
  "locked_at": "2026-02-17T14:30:00.000Z"
}`);

// ==================== Project Broadcast ====================
const eventProjectBroadcast = ref(`{
  "project_id": "bb4e8a00-e29b-41d4-a716-446655440055",
  "from_instance": "claude-instance-1",
  "type": "context_update",
  "message": "Auth module refactor complete. Updated context chunks for auth patterns.",
  "metadata": {
    "files_modified": ["app/Http/Middleware/AuthMiddleware.php"],
    "context_chunk_id": "cc_def789"
  },
  "timestamp": "2026-02-17T15:12:40.000Z"
}`);

// ==================== Message Formats ====================
const messageFormatBroadcast = ref(`{
  "event": "session.output",
  "channel": "private-sessions.550e8400-e29b-41d4-a716-446655440001",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440001",
    "data": "Processing your request...\\r\\n",
    "chunk_id": "ch_xyz789",
    "timestamp": "2026-02-17T14:30:00.000Z"
  }
}`);

const messageFormatClient = ref(`{
  "event": "client-input",
  "channel": "private-sessions.550e8400-e29b-41d4-a716-446655440001",
  "data": {
    "data": "Please continue\\n"
  }
}`);

const messageFormatAgent = ref(`{
  "type": "session:output",
  "payload": {
    "session_id": "550e8400-e29b-41d4-a716-446655440001",
    "data": "Refactoring auth module...\\r\\n",
    "chunk_id": "ch_def456"
  },
  "timestamp": 1739800200000
}`);

// ==================== Authentication Tabs ====================
const authTabs = ref([
  {
    label: 'Web (Laravel Echo)',
    language: 'typescript',
    code: `import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  // Sanctum token injected into channel auth requests
  auth: {
    headers: {
      Authorization: \`Bearer \${localStorage.getItem('claudenest_token')}\`,
    },
  },
});`,
  },
  {
    label: 'Agent (raw ws)',
    language: 'typescript',
    code: `import WebSocket from 'ws';

const ws = new WebSocket(config.serverUrl, {
  headers: {
    // Sanctum machine token in the HTTP upgrade request
    'Authorization': \`Bearer \${config.machineToken}\`,
    'X-Machine-ID': config.machineId,
  },
});

ws.on('open', () => {
  // Connection authenticated — start heartbeat
  startHeartbeat(ws);
});`,
  },
  {
    label: 'Mobile (Socket.io)',
    language: 'typescript',
    code: `import { io } from 'socket.io-client';

const socket = io(config.wsUrl, {
  // Token sent in the auth handshake (not query string)
  auth: { token: authStore.token },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  reconnectionAttempts: 10,
});

socket.on('connect', () => {
  socket.emit('subscribe', {
    channel: \`private-sessions.\${sessionId}\`,
  });
});`,
  },
]);

// ==================== Reconnection ====================
const reconnectionStrategy = ref(`export class WebSocketClient extends EventEmitter {
  private reconnectAttempts = 0;
  private readonly maxAttempts = 10;
  private readonly baseDelay = 1000;    // 1 second
  private readonly maxDelay = 30000;   // 30 seconds

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxAttempts) {
      this.emit('reconnect_failed');
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay,
    );
    // Add ±20% jitter to spread reconnection load
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    const finalDelay = Math.round(delay + jitter);

    this.reconnectAttempts++;

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      delay: finalDelay,
    });

    setTimeout(() => this.connect(), finalDelay);
  }

  // Reset counter on successful connection
  private onConnected(): void {
    this.reconnectAttempts = 0;
    this.emit('connected');
  }
}`);

// ==================== Heartbeat ====================
const heartbeatCode = ref(`function startHeartbeat(ws: WebSocket): NodeJS.Timeout {
  return setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
      }));
    }
  }, 30_000); // 30-second interval
}

// Server responds with pong
ws.on('message', (raw) => {
  const message = JSON.parse(raw.toString());
  if (message.type === 'pong') {
    // Connection confirmed alive — update last_seen_at
    lastPongAt = Date.now();
    return;
  }
  // ... handle other message types
});`);

// ==================== Client Libraries Tabs ====================
const clientLibsTabs = ref([
  {
    label: 'Web — Laravel Echo',
    language: 'typescript',
    code: `// Install: npm install laravel-echo pusher-js

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT),
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
  auth: {
    headers: { Authorization: \`Bearer \${token}\` },
  },
});

// Subscribe and listen
echo
  .private(\`sessions.\${sessionId}\`)
  .listen('.session.output', (e: SessionOutputEvent) => {
    terminal.write(e.data);
  })
  .listen('.session.status', (e: SessionStatusEvent) => {
    updateStatus(e.status);
  });`,
  },
  {
    label: 'Agent — ws',
    language: 'typescript',
    code: `// Install: npm install ws

import WebSocket from 'ws';

const ws = new WebSocket('wss://ws.claudenest.io/app/key', {
  headers: {
    Authorization: \`Bearer \${machineToken}\`,
    'X-Machine-ID': machineId,
  },
});

ws.on('open', () => {
  startHeartbeat(ws);
  ws.send(JSON.stringify({
    type: 'machine:register',
    payload: { platform: process.platform, capabilities },
    timestamp: Date.now(),
  }));
});

ws.on('message', (raw: Buffer) => {
  const { type, payload } = JSON.parse(raw.toString());
  switch (type) {
    case 'session:create': handleSessionCreate(payload); break;
    case 'session:input':  handleSessionInput(payload);  break;
    case 'session:resize': handleSessionResize(payload); break;
  }
});`,
  },
  {
    label: 'Mobile — Socket.io',
    language: 'typescript',
    code: `// Install: npm install socket.io-client

import { io, Socket } from 'socket.io-client';
import { AppState } from 'react-native';

let socket: Socket;

export function connectSocket(token: string): Socket {
  socket = io('wss://ws.claudenest.io', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: 10,
  });

  // Disconnect when app goes to background, reconnect on foreground
  AppState.addEventListener('change', (state) => {
    if (state === 'background') socket.disconnect();
    if (state === 'active') socket.connect();
  });

  return socket;
}

// Subscribe to a session channel
socket.emit('subscribe', { channel: \`private-sessions.\${sessionId}\` });
socket.on('session.output', ({ data }) => appendToTerminal(data));`,
  },
]);
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

/* ==================== Header ==================== */
.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  margin-bottom: 1rem;
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
  margin: 0;
}

/* ==================== Sections ==================== */
section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-primary);
}

h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

strong {
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
  font-size: 0.875em;
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* ==================== Feature Grid ==================== */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.feature-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.feature-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 12%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.feature-card h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.85rem;
  margin: 0;
}

/* ==================== Architecture Diagram ==================== */
.arch-diagram {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.arch-row {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  width: 100%;
}

.arch-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, var(--border));
  min-width: 130px;
  text-align: center;
}

.arch-node.client {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent);
}

.arch-node.server {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-cyan, #22d3ee) 25%, transparent);
}

.arch-node.broker {
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
}

.node-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.node-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.arch-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0;
}

.connector-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.connector-line {
  width: 2px;
  height: 20px;
  background: var(--border-color, var(--border));
}

/* ==================== Steps ==================== */
.steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-num {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.85rem;
  margin-top: 0.1rem;
}

.step h4 {
  margin-bottom: 0.35rem;
}

.step p {
  font-size: 0.9rem;
  margin: 0;
}

/* ==================== Channels / Error Table ==================== */
.channels-table {
  margin: 1.5rem 0;
  overflow-x: auto;
}

.channels-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.channels-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  border-bottom: 2px solid var(--border-color, var(--border));
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
}

.channels-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, var(--border));
  color: var(--text-secondary);
  vertical-align: top;
}

/* ==================== Events List ==================== */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.event-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.event-name {
  font-size: 0.9rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
}

.event-channel {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.event-card > p {
  font-size: 0.9rem;
  margin: 0 0 0.5rem;
}

.event-card > p:last-child {
  margin-bottom: 0;
}

.event-card :deep(.code-block) {
  margin: 0.75rem 0 0;
}

/* ==================== Heartbeat Flow ==================== */
.heartbeat-flow {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.25rem 0;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.hb-step {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hb-node {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  white-space: nowrap;
}

.hb-node.agent {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 12%, transparent);
  color: var(--accent-purple, #a855f7);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 25%, transparent);
}

.hb-node.server {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 12%, transparent);
  color: var(--accent-cyan, #22d3ee);
  border: 1px solid color-mix(in srgb, var(--accent-cyan, #22d3ee) 25%, transparent);
}

.hb-arrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.hb-arrow.reverse {
  flex-direction: row-reverse;
}

.hb-arrow svg {
  color: var(--text-muted);
  flex-shrink: 0;
}

/* ==================== Tip Box ==================== */
.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.tip.warning {
  background: color-mix(in srgb, #fbbf24 5%, transparent);
  border-color: color-mix(in srgb, #fbbf24 25%, transparent);
}

.tip.warning .tip-icon {
  background: color-mix(in srgb, #fbbf24 20%, transparent);
  color: #fbbf24;
}

.tip-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.tip h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.tip p {
  margin: 0;
  font-size: 0.9rem;
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .arch-row {
    flex-direction: column;
    align-items: center;
  }

  .arch-node {
    width: 100%;
    max-width: 280px;
  }
}
</style>
