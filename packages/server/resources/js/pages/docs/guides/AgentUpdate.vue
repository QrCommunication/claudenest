<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>{{ t('docDocsGuidesAgentupdate.title') }}</h1>
      <p class="lead">
        {{ t('docDocsGuidesAgentupdate.lead') }}
      </p>
    </header>

    <section id="check-version">
      <h2>{{ t('docDocsGuidesAgentupdate.checkVersionHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesAgentupdate.checkVersionIntro') }}
      </p>
      <CodeBlock
        code="claudenest-agent --version"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />

      <p>{{ t('docDocsGuidesAgentupdate.checkVersionGlobal') }}</p>
      <CodeBlock
        code="npm ls -g @claudenest/agent"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />
    </section>

    <section id="update">
      <h2>{{ t('docDocsGuidesAgentupdate.updateHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesAgentupdate.updateIntro') }}
      </p>
      <CodeBlock
        code="npm i -g @claudenest/agent@latest"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />

      <p>{{ t('docDocsGuidesAgentupdate.updateVerify') }}</p>
      <CodeBlock
        code="claudenest-agent --version"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        <span v-html="t('docDocsGuidesAgentupdate.updateRestartNote')"></span>
      </p>
    </section>

    <section id="precautions">
      <h2>{{ t('docDocsGuidesAgentupdate.precautionsHeading') }}</h2>
      <p class="warn">
        <span class="warn-icon">&#9888;</span>
        <span v-html="t('docDocsGuidesAgentupdate.precautionsWarning')"></span>
      </p>
      <p>
        {{ t('docDocsGuidesAgentupdate.precautionsCheck') }}
      </p>
      <CodeBlock
        code="tmux -L claudenest ls"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />
      <p>
        <span v-html="t('docDocsGuidesAgentupdate.precautionsSafe')"></span>
      </p>
    </section>

    <section id="restart">
      <h2>{{ t('docDocsGuidesAgentupdate.restartHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesAgentupdate.restartIntro') }}
      </p>
      <CodeBlock
        code="sudo systemctl restart claudenest-agent"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />

      <p>{{ t('docDocsGuidesAgentupdate.restartVariants') }}</p>
      <CodeBlock
        :code="restartVariantsCode"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />
    </section>

    <section id="verify">
      <h2>{{ t('docDocsGuidesAgentupdate.verifyHeading') }}</h2>
      <p>
        {{ t('docDocsGuidesAgentupdate.verifyIntro') }}
      </p>
      <CodeBlock
        :code="verifyCode"
        language="bash"
        :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
      />

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        <span v-html="t('docDocsGuidesAgentupdate.verifyTip')"></span>
      </p>
    </section>

    <section id="troubleshoot">
      <h2>{{ t('docDocsGuidesAgentupdate.troubleshootHeading') }}</h2>

      <div class="trouble-grid">
        <div class="trouble-item">
          <h4>{{ t('docDocsGuidesAgentupdate.crashLoopHeading') }}</h4>
          <p>
            <span v-html="t('docDocsGuidesAgentupdate.crashLoopBody')"></span>
          </p>
          <CodeBlock
            code="journalctl -u claudenest-agent -n 50 --no-pager"
            language="bash"
            :filename="t('docDocsGuidesAgentupdate.debugFilename')"
          />
        </div>

        <div class="trouble-item">
          <h4>{{ t('docDocsGuidesAgentupdate.pairingLostHeading') }}</h4>
          <p>
            <span v-html="t('docDocsGuidesAgentupdate.pairingLostBody')"></span>
          </p>
          <CodeBlock
            code="claudenest-agent pair"
            language="bash"
            :filename="t('docDocsGuidesAgentupdate.terminalFilename')"
          />
        </div>
      </div>
    </section>

    <section id="next-steps">
      <h2>{{ t('docDocsGuidesAgentupdate.nextStepsHeading') }}</h2>
      <div class="next-steps">
        <router-link to="/docs/guides/agent-setup" class="next-step">
          <strong>{{ t('docDocsGuidesAgentupdate.nextAgentSetupTitle') }}</strong>
          <span>{{ t('docDocsGuidesAgentupdate.nextAgentSetupDesc') }} &#8594;</span>
        </router-link>
        <router-link to="/docs/cookbook/bare-metal" class="next-step">
          <strong>{{ t('docDocsGuidesAgentupdate.nextBareMetalTitle') }}</strong>
          <span>{{ t('docDocsGuidesAgentupdate.nextBareMetalDesc') }} &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const { t } = useI18n();

const restartVariantsCode = ref(`# User-level service
systemctl --user restart claudenest-agent

# Started manually (no service) — stop the old process, then:
claudenest-agent start`);

const verifyCode = ref(`# Service should report "active"
systemctl is-active claudenest-agent

# 0 means no crash-loop
systemctl show claudenest-agent -p NRestarts --value

# Look for "Connected to ClaudeNest server"
journalctl -u claudenest-agent -n 20 --no-pager`);
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
  margin: 0;
}

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

ul {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Troubleshooting Grid */
.trouble-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trouble-item {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.trouble-item h4 {
  margin: 0 0 0.5rem;
}

.trouble-item p {
  font-size: 0.95rem;
  margin: 0 0 0.75rem;
}

/* Tip */
.tip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 10px;
  margin: 1rem 0;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip p {
  margin: 0;
  font-size: 0.95rem;
}

/* Warning */
.warn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.25);
  border-radius: 10px;
  margin: 1rem 0;
}

.warn-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warn p {
  margin: 0;
  font-size: 0.95rem;
}

/* Next Steps */
.next-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.next-step {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.next-step:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
}

.next-step strong {
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.next-step span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.next-step:hover span {
  color: var(--text-secondary);
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
}
</style>
