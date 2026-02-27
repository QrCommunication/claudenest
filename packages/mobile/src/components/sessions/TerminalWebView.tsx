/**
 * TerminalWebView
 * xterm.js terminal rendered in a WebView with live session output
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSessionsStore } from '@/stores/sessionsStore';

interface Props {
  sessionId: string;
  onInput?: (data: string) => void;
}

// xterm.js HTML page (loaded from CDN — requires internet, or use bundled version)
const buildHtml = (initialOutput: string) => {
  const escaped = initialOutput
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #0f0f1a; overflow: hidden; }
    #terminal { width: 100%; height: 100%; }
    .xterm-screen { background: #0f0f1a !important; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://unpkg.com/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <script>
    const term = new Terminal({
      theme: {
        background: '#0f0f1a',
        foreground: '#c0caf5',
        cursor: '#a855f7',
        selectionBackground: 'rgba(168,85,247,0.3)',
        black: '#15161e', red: '#f7768e', green: '#9ece6a',
        yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7',
        cyan: '#7dcfff', white: '#a9b1d6',
        brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a',
        brightYellow: '#e0af68', brightBlue: '#7aa2f7', brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff', brightWhite: '#c0caf5',
      },
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      convertEol: true,
      scrollback: 5000,
      disableStdin: false,
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal'));
    fitAddon.fit();

    // Write initial output
    const initial = \`${escaped}\`;
    if (initial) term.write(initial);

    // Listen for input from user
    term.onData(function(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'input', data: data }));
    });

    // Listen for messages from React Native
    window.addEventListener('message', function(e) {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'write') {
          term.write(msg.data);
        } else if (msg.type === 'clear') {
          term.clear();
        } else if (msg.type === 'resize') {
          fitAddon.fit();
        }
      } catch(err) {}
    });

    // document.addEventListener for Android
    document.addEventListener('message', function(e) {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'write') {
          term.write(msg.data);
        } else if (msg.type === 'clear') {
          term.clear();
        }
      } catch(err) {}
    });

    window.addEventListener('resize', function() { fitAddon.fit(); });
  </script>
</body>
</html>`;
};

export const TerminalWebView: React.FC<Props> = ({ sessionId, onInput }) => {
  const webViewRef = useRef<WebView>(null);
  const lastOutputLengthRef = useRef(0);
  const initialOutput = useSessionsStore(s => s.getSessionOutput(sessionId));

  // Inject new output delta into xterm.js
  const injectOutput = useCallback((data: string) => {
    if (!webViewRef.current || !data) return;
    const escaped = JSON.stringify(data);
    webViewRef.current.injectJavaScript(
      `(function(){ try { window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'write', data: ${escaped} }) })); } catch(e){} })(); true;`
    );
  }, []);

  // Subscribe to new output from store
  useEffect(() => {
    lastOutputLengthRef.current = initialOutput.length;

    const unsubscribe = useSessionsStore.subscribe((state) => {
      const currentOutput = state.sessionOutputs.get(sessionId) ?? '';
      const newData = currentOutput.slice(lastOutputLengthRef.current);
      if (newData) {
        lastOutputLengthRef.current = currentOutput.length;
        injectOutput(newData);
      }
    });

    return () => unsubscribe();
  }, [sessionId, injectOutput]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'input' && onInput) {
        onInput(msg.data);
      }
    } catch {}
  }, [onInput]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: buildHtml(initialOutput) }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
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
    backgroundColor: '#0f0f1a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
});
