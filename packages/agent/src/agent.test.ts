/**
 * Regression tests for agent resilience to transient network errors (v2.6.7).
 *
 * Incident 2026-06-10: a transient DNS failure (EAI_AGAIN) crashed the agent
 * because the WebSocket 'error' event was re-emitted on the Agent with no
 * listener attached — Node's EventEmitter throws synchronously on unhandled
 * 'error' events — and the uncaughtException handler then exited with code 0,
 * which systemd's Restart=on-failure treats as a clean stop (no restart).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import os from 'os';
import path from 'path';
import { ClaudeNestAgent } from './agent.js';
import type { AgentConfig } from './types/index.js';

// JSON logs (no pino-pretty worker thread) — see createLogger()
process.env.NODE_ENV = 'production';

const PROCESS_EVENTS = ['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'] as const;
type ProcessEvent = (typeof PROCESS_EVENTS)[number];

function makeConfig(): AgentConfig {
  return {
    serverUrl: 'wss://127.0.0.1:1',
    machineToken: 'test-token',
    claudePath: '/usr/bin/false',
    projectPaths: [],
    cachePath: path.join(os.tmpdir(), 'claudenest-agent-test', 'context-cache.json'),
    logLevel: 'fatal',
  };
}

describe('ClaudeNestAgent — resilience to transient network errors', () => {
  let agent: ClaudeNestAgent;
  let priorListeners: Map<ProcessEvent, Array<(...args: unknown[]) => void>>;

  /** Listeners registered by the agent during initialize(). */
  function addedListeners(event: ProcessEvent): Array<(...args: unknown[]) => void> {
    const prior = priorListeners.get(event) ?? [];
    return (process.listeners(event) as Array<(...args: unknown[]) => void>).filter(
      (listener) => !prior.includes(listener)
    );
  }

  beforeEach(async () => {
    priorListeners = new Map(
      PROCESS_EVENTS.map((event) => [
        event,
        [...(process.listeners(event) as Array<(...args: unknown[]) => void>)],
      ])
    );

    agent = new ClaudeNestAgent({ config: makeConfig(), machineId: 'test-machine' });
    await agent.initialize();
  });

  afterEach(() => {
    // Remove the global process handlers the agent registered, so tests
    // stay isolated and vitest's own handlers are untouched.
    for (const event of PROCESS_EVENTS) {
      for (const listener of addedListeners(event)) {
        process.removeListener(event, listener);
      }
    }
    vi.restoreAllMocks();
  });

  it("does not crash when the WebSocket emits 'error' with no listener on the agent", () => {
    const wsClient = (agent as unknown as { wsClient: EventEmitter }).wsClient;
    const networkError = new Error('getaddrinfo EAI_AGAIN api.claudenest.io');

    // Before the fix, Agent.emit('error') with zero listeners threw
    // synchronously, escalating to an uncaught exception that killed
    // the process before the reconnect-on-close logic could run.
    expect(() => wsClient.emit('error', networkError)).not.toThrow();
  });

  it("forwards WebSocket errors to the agent's 'error' listeners when attached", () => {
    const wsClient = (agent as unknown as { wsClient: EventEmitter }).wsClient;
    const networkError = new Error('getaddrinfo EAI_AGAIN api.claudenest.io');
    const received: Error[] = [];

    agent.on('error', (error: Error) => received.push(error));
    wsClient.emit('error', networkError);

    expect(received).toEqual([networkError]);
  });

  it('exits with code 1 on uncaughtException so the supervisor restarts the agent', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    const [handler] = addedListeners('uncaughtException');
    expect(handler).toBeDefined();

    handler(new Error('boom'));

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1));
    expect(exitSpy).not.toHaveBeenCalledWith(0);
  });

  it('exits with code 0 on SIGINT (clean shutdown stays clean)', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    const [handler] = addedListeners('SIGINT');
    expect(handler).toBeDefined();

    handler();

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0));
  });
});
