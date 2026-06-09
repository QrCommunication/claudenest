/**
 * TerminalWebView
 * xterm.js terminal in a WebView with live session output.
 *
 * Mobile-correctness notes:
 * - The PTY is resized to whatever xterm fits to (FitAddon), and that size is
 *   sent back to the server so output wraps at the real on-screen width.
 *   Without this the server keeps emitting 120-col lines that xterm re-wraps at
 *   a tiny width → the unreadable 1-2 char/line spew.
 * - fit() runs after layout actually settles (rAF + ResizeObserver + on each
 *   write), with a minimum-column guard so a pre-layout fit can't collapse to 1.
 * - Exposes an imperative `setModifier` so the on-screen key bar can make the
 *   NEXT soft-keyboard key Ctrl/Alt-modified (xterm custom key handler).
 */
import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSessionsStore } from "@/stores/sessionsStore";

export interface TerminalHandle {
  /** Arm/disarm a modifier applied to the next key typed in xterm. */
  setModifier: (mod: "ctrl" | "alt", on: boolean) => void;
}

interface Props {
  sessionId: string;
  onInput?: (data: string) => void;
  /** Called whenever xterm refits, so the caller can resize the PTY. */
  onResize?: (cols: number, rows: number) => void;
  /** Called when xterm consumes an armed modifier (to un-highlight the toggle). */
  onModifierConsumed?: () => void;
}

const buildHtml = (initialOutput: string) => {
  const escaped = initialOutput.replace(/\\/g, "\\\\").replace(/`/g, "\\`");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #06060e; overflow: hidden; }
    #terminal { width: 100%; height: 100%; padding: 4px; }
    .xterm-screen { background: #06060e !important; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://unpkg.com/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
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
      lineHeight: 1.1,
      fontFamily: 'ui-monospace, Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      convertEol: true,
      scrollback: 5000,
      disableStdin: false,
    });

    var fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal'));

    var lastCols = 0, lastRows = 0;
    function safeFit() {
      try {
        fitAddon.fit();
        // Guard against a pre-layout fit collapsing the grid.
        if (term.cols < 10 || term.rows < 3) return;
        if (term.cols !== lastCols || term.rows !== lastRows) {
          lastCols = term.cols; lastRows = term.rows;
          postRN({ type: 'resize', cols: term.cols, rows: term.rows });
        }
      } catch (e) {}
    }

    // Fit once layout has settled, and a couple more times as the WebView and
    // the soft keyboard reflow the viewport.
    requestAnimationFrame(function () {
      safeFit();
      setTimeout(safeFit, 60);
      setTimeout(safeFit, 250);
      setTimeout(safeFit, 600);
    });

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { safeFit(); });
      ro.observe(document.getElementById('terminal'));
    }
    window.addEventListener('resize', safeFit);

    // ── Ctrl/Alt modifiers from the on-screen key bar ──
    var pendingCtrl = false, pendingAlt = false;
    window.__setMod = function (mod, on) {
      if (mod === 'ctrl') pendingCtrl = on;
      if (mod === 'alt') pendingAlt = on;
    };
    term.attachCustomKeyEventHandler(function (e) {
      if (e.type !== 'keydown') return true;
      if (!pendingCtrl && !pendingAlt) return true;
      var k = e.key;
      if (k && k.length === 1) {
        var data = k;
        if (pendingCtrl) {
          var up = k.toUpperCase().charCodeAt(0);
          if (up >= 64 && up <= 95) data = String.fromCharCode(up - 64);
          else if (k.charCodeAt(0) >= 97 && k.charCodeAt(0) <= 122)
            data = String.fromCharCode(k.charCodeAt(0) - 96);
        }
        if (pendingAlt) data = '\\x1b' + data;
        postRN({ type: 'input', data: data });
        pendingCtrl = false; pendingAlt = false;
        postRN({ type: 'modclear' });
        if (e.preventDefault) e.preventDefault();
        return false;
      }
      return true;
    });

    var initial = \`${escaped}\`;
    if (initial) term.write(initial);

    term.onData(function (data) { postRN({ type: 'input', data: data }); });

    function handle(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'write') { term.write(msg.data); safeFit(); }
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

export const TerminalWebView = forwardRef<TerminalHandle, Props>(
  function TerminalWebView(
    { sessionId, onInput, onResize, onModifierConsumed },
    ref,
  ) {
    const webViewRef = useRef<WebView>(null);
    const lastOutputLengthRef = useRef(0);
    const initialOutput = useSessionsStore((s) =>
      s.getSessionOutput(sessionId),
    );

    useImperativeHandle(
      ref,
      () => ({
        setModifier: (mod, on) => {
          webViewRef.current?.injectJavaScript(
            `(function(){ try { window.__setMod('${mod}', ${on}); } catch(e){} })(); true;`,
          );
        },
      }),
      [],
    );

    const injectOutput = useCallback((data: string) => {
      if (!webViewRef.current || !data) return;
      const escaped = JSON.stringify(data);
      webViewRef.current.injectJavaScript(
        `(function(){ try { window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'write', data: ${escaped} }) })); } catch(e){} })(); true;`,
      );
    }, []);

    useEffect(() => {
      lastOutputLengthRef.current = initialOutput.length;
      const unsubscribe = useSessionsStore.subscribe((state) => {
        const currentOutput = state.sessionOutputs.get(sessionId) ?? "";
        const newData = currentOutput.slice(lastOutputLengthRef.current);
        if (newData) {
          lastOutputLengthRef.current = currentOutput.length;
          injectOutput(newData);
        }
      });
      return () => unsubscribe();
    }, [sessionId, injectOutput]);

    const handleMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === "input" && onInput) {
            onInput(msg.data);
          } else if (msg.type === "resize" && onResize) {
            onResize(msg.cols, msg.rows);
          } else if (msg.type === "modclear") {
            onModifierConsumed?.();
          }
        } catch {
          /* ignore malformed bridge payloads */
        }
      },
      [onInput, onResize, onModifierConsumed],
    );

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: buildHtml(initialOutput) }}
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
  },
);

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
