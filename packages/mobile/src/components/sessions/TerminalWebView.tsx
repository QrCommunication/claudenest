/**
 * TerminalWebView
 * xterm.js terminal in a WebView — DISPLAY ONLY.
 *
 * Input does NOT go through the WebView. Android's predictive IME composes
 * text into xterm's hidden textarea and re-sends the whole composition prefix
 * on every keystroke ("an", "anal", "analy", …), which the PTY echoes — the
 * "repeated text" bug. So stdin is disabled here (textarea inputmode=none),
 * taps on the terminal just ask the native side to focus its own hidden
 * TextInput (suggestion-free keyboard), and keystrokes flow natively.
 *
 * Mobile-correctness / performance notes:
 * - xterm + fit-addon are inlined (base64 data URIs), never fetched from a CDN.
 * - fit() runs after document.fonts.ready and only once the container actually
 *   has width (>=40px). It re-fits on ResizeObserver/keyboard reflow — NOT on
 *   every write. Incoming output is batched one flush per frame.
 * - The fitted cols/rows are sent back so the server PTY tracks the real size.
 * - Output deltas are diffed on the store's monotonic byte counter, NOT on
 *   buffer.length — the buffer is front-trimmed at MAX_OUTPUT_LENGTH, so a
 *   length-based diff freezes once a long session saturates the buffer.
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSessionsStore } from "@/stores/sessionsStore";
import { XTERM_JS_B64, XTERM_FIT_B64, XTERM_CSS } from "./xtermBundle";

interface Props {
  sessionId: string;
  /** Called whenever xterm refits, so the caller can resize the PTY. */
  onResize?: (cols: number, rows: number) => void;
  /** User tapped the terminal — caller should focus the native key input. */
  onFocusRequest?: () => void;
}

const buildHtml = (initialOutput: string) => {
  const escaped = initialOutput.replace(/\\/g, "\\\\").replace(/`/g, "\\`");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <style>${XTERM_CSS}</style>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #06060e; overflow: hidden; }
    #terminal { width: 100%; height: 100%; padding: 4px; }
    .xterm, .xterm-viewport, .xterm-screen { background: #06060e !important; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <!-- xterm + fit-addon inlined as data URIs (no network → instant load) -->
  <script src="data:text/javascript;base64,${XTERM_JS_B64}"></script>
  <script src="data:text/javascript;base64,${XTERM_FIT_B64}"></script>
  <script>
    function postRN(obj) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch (e) {}
    }

    var term = new Terminal({
      theme: {
        background: '#06060e', foreground: '#c0caf5', cursor: '#2ce6ff',
        selectionBackground: 'rgba(176,115,255,0.35)',
        black: '#15161e', red: '#f7768e', green: '#9ece6a',
        yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7',
        cyan: '#7dcfff', white: '#a9b1d6',
        brightBlack: '#414868', brightRed: '#ff899d', brightGreen: '#9fe044',
        brightYellow: '#faba4a', brightBlue: '#8db0ff', brightMagenta: '#c7a9ff',
        brightCyan: '#7ee1ff', brightWhite: '#c0caf5',
      },
      fontSize: 13,
      lineHeight: 1.0,
      fontFamily: 'monospace',
      cursorBlink: true,
      convertEol: false,
      scrollback: 10000,
      // Display-only: keystrokes are captured by the NATIVE hidden TextInput
      // (Android IME composition through the WebView duplicates prefixes).
      disableStdin: true,
    });

    var fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal'));

    // Never let the WebView summon the soft keyboard: stdin lives natively.
    var ta = term.textarea;
    if (ta) {
      ta.setAttribute('inputmode', 'none');
      ta.setAttribute('readonly', 'readonly');
      ta.setAttribute('aria-hidden', 'true');
    }
    // ── Touch scrolling ──
    // xterm's interactive layers (.xterm-screen + helpers) sit ON TOP of the
    // scrollable .xterm-viewport, so native touch scrolling never reaches it:
    // the history was unreachable on mobile. Relay touch drags to the
    // viewport's scrollTop (xterm syncs its buffer view from viewport scroll
    // events) with a small momentum fling, terminal-style.
    var vp = term.element.querySelector('.xterm-viewport');
    var touchY = null, touchMoved = 0, lastDy = 0, flingRaf = null;
    var root = document.getElementById('terminal');
    root.addEventListener('touchstart', function (e) {
      if (flingRaf) { cancelAnimationFrame(flingRaf); flingRaf = null; }
      touchY = e.touches[0].clientY;
      touchMoved = 0; lastDy = 0;
    }, { passive: true });
    root.addEventListener('touchmove', function (e) {
      if (touchY === null || !vp) return;
      var y = e.touches[0].clientY;
      var dy = touchY - y;
      touchY = y;
      lastDy = dy;
      touchMoved += Math.abs(dy);
      vp.scrollTop += dy;
    }, { passive: true });
    root.addEventListener('touchend', function () {
      touchY = null;
      // Momentum: keep scrolling with decay if the finger left with speed.
      var v = lastDy;
      function fling() {
        v *= 0.92;
        if (Math.abs(v) < 0.5 || !vp) { flingRaf = null; return; }
        vp.scrollTop += v;
        flingRaf = requestAnimationFrame(fling);
      }
      if (Math.abs(v) > 2) flingRaf = requestAnimationFrame(fling);
    }, { passive: true });

    root.addEventListener('click', function () {
      // A scroll drag must not summon the keyboard — only a real tap does.
      if (touchMoved > 10) return;
      // Tapping means "interact": jump back to the prompt first.
      term.scrollToBottom();
      postRN({ type: 'focus' });
    });

    var lastCols = 0, lastRows = 0;
    // Coalesce the burst of fit attempts (mount retries, ResizeObserver,
    // keyboard reflow) into ONE resize sent after things go quiet. Sending many
    // resizes makes the TUI (Claude Code) redraw its whole frame each time, and
    // because the size differs between redraws the frames stack — that is the
    // "duplicated frame" symptom.
    var resizeTimer = null;
    function postResizeDebounced() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (term.cols >= 10 && term.rows >= 3) {
          postRN({ type: 'resize', cols: term.cols, rows: term.rows });
        }
      }, 300);
    }

    function safeFit() {
      try {
        // Don't fit until the container actually has width, otherwise xterm
        // measures a tiny box and collapses to ~1 col (every char wraps).
        var el = document.getElementById('terminal');
        if (!el || el.clientWidth < 40 || el.clientHeight < 40) return;
        fitAddon.fit();
        if (term.cols < 10 || term.rows < 3) return;
        if (term.cols !== lastCols || term.rows !== lastRows) {
          lastCols = term.cols; lastRows = term.rows;
          postResizeDebounced();
        }
      } catch (e) {}
    }

    // Fit once fonts + layout are ready, then retry a couple of times as the
    // WebView settles. The debounce above collapses these into one resize.
    function initialFit() {
      safeFit();
      [80, 350].forEach(function (d) { setTimeout(safeFit, d); });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { requestAnimationFrame(initialFit); });
    } else {
      requestAnimationFrame(initialFit);
    }

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { safeFit(); });
      ro.observe(document.getElementById('terminal'));
    }
    window.addEventListener('resize', safeFit);

    var initial = \`${escaped}\`;
    if (initial) term.write(initial);

    // Batch incoming writes into one flush per animation frame to avoid a
    // reflow storm on bursty output (the other half of the lag).
    var writeBuf = '';
    var flushScheduled = false;
    function flushWrites() {
      flushScheduled = false;
      if (writeBuf) { term.write(writeBuf); writeBuf = ''; }
    }
    function queueWrite(data) {
      writeBuf += data;
      if (!flushScheduled) {
        flushScheduled = true;
        requestAnimationFrame(flushWrites);
      }
    }

    function handle(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'write') { queueWrite(msg.data); }
        else if (msg.type === 'clear') { term.clear(); }
        else if (msg.type === 'resize') { safeFit(); }
      } catch (err) {}
    }
    window.addEventListener('message', handle);
    document.addEventListener('message', handle);
  </script>
</body>
</html>`;
};

export const TerminalWebView: React.FC<Props> = ({
  sessionId,
  onResize,
  onFocusRequest,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Snapshot the buffered output ONCE at mount and build the HTML once. The
  // WebView source MUST be stable — if it changes (e.g. on every new output
  // chunk) the whole WebView reloads, which dismisses the keyboard, flashes,
  // re-replays the buffer (duplicated frames) and adds huge input latency.
  // All later output is streamed in via injectJavaScript, never via source.
  const initialTotalRef = useRef(0);
  const [source] = useState(() => {
    const state = useSessionsStore.getState();
    const snapshot = state.getSessionOutput(sessionId);
    initialTotalRef.current =
      state.sessionOutputTotals.get(sessionId) ?? snapshot.length;
    return { html: buildHtml(snapshot) } as const;
  });
  const lastTotalRef = useRef(initialTotalRef.current);

  const injectOutput = useCallback((data: string) => {
    if (!webViewRef.current || !data) return;
    const escaped = JSON.stringify(data);
    webViewRef.current.injectJavaScript(
      `(function(){ try { window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'write', data: ${escaped} }) })); } catch(e){} })(); true;`,
    );
  }, []);

  useEffect(() => {
    const unsubscribe = useSessionsStore.subscribe((state) => {
      const total = state.sessionOutputTotals.get(sessionId) ?? 0;
      if (total < lastTotalRef.current) {
        // Buffer was cleared/reset — resync without replaying.
        lastTotalRef.current = total;
        return;
      }
      const appended = total - lastTotalRef.current;
      if (appended <= 0) return;
      lastTotalRef.current = total;
      const buffer = state.sessionOutputs.get(sessionId) ?? "";
      // Appends land at the END of the (front-trimmed) buffer.
      injectOutput(buffer.slice(-Math.min(appended, buffer.length)));
    });
    return () => unsubscribe();
  }, [sessionId, injectOutput]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "resize" && onResize) {
          onResize(msg.cols, msg.rows);
        } else if (msg.type === "focus") {
          onFocusRequest?.();
        }
      } catch {
        /* ignore malformed bridge payloads */
      }
    },
    [onResize, onFocusRequest],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={source}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyboardDisplayRequiresUserAction={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06060e",
  },
  webview: {
    flex: 1,
    backgroundColor: "#06060e",
  },
});
