<template>
  <article class="doc-content">
    <header class="doc-header">
      <span class="badge">Cookbook</span>
      <h1>Mobile App Setup</h1>
      <p class="lead">Configure and build the ClaudeNest React Native mobile app for iOS and Android.</p>
    </header>

    <section id="prerequisites">
      <h2>Prerequisites</h2>
      <p>
        Before building the mobile app, ensure the following tools are installed on your development machine.
      </p>

      <div class="prereq-grid">
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Node.js 20 LTS</strong>
            <span>Required for the Metro bundler and build scripts</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>React Native CLI</strong>
            <span><code>npm install -g react-native-cli</code></span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Xcode 15+ (iOS)</strong>
            <span>macOS only — available from the Mac App Store</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Android Studio (Android)</strong>
            <span>With Android SDK, NDK, and an emulator configured</span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>CocoaPods (iOS)</strong>
            <span><code>sudo gem install cocoapods</code></span>
          </div>
        </div>
        <div class="prereq-item">
          <span class="check">&#10003;</span>
          <div>
            <strong>Java 17 (Android)</strong>
            <span>Required by the Gradle build system</span>
          </div>
        </div>
      </div>

      <CodeBlock
        :code="prereqCheckCode"
        language="bash"
        filename="Terminal — verify environment"
      />

      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>Use the React Native environment doctor</strong>
          <p>Run <code>npx react-native doctor</code> inside <code>packages/mobile</code> to get a checklist of missing or misconfigured dependencies.</p>
        </div>
      </div>
    </section>

    <section id="installation">
      <h2>Installation</h2>
      <p>
        Install all JavaScript dependencies from the monorepo root, then install the platform-specific
        native dependencies for whichever platform you are targeting.
      </p>

      <h3>Install JS dependencies</h3>
      <CodeBlock
        :code="installCode"
        language="bash"
        filename="Terminal"
      />

      <h3>iOS and Android native setup</h3>
      <CodeTabs :tabs="nativeSetupTabs" />

      <div class="callout warning">
        <span class="callout-icon">!</span>
        <div>
          <strong>Pod install must be re-run after native dependency changes</strong>
          <p>
            Whenever you add or upgrade a package that contains native iOS code, run
            <code>pod install</code> inside <code>packages/mobile/ios</code> again before
            building. Failing to do so results in linker errors.
          </p>
        </div>
      </div>
    </section>

    <section id="configuration">
      <h2>Configuration</h2>
      <p>
        The mobile app reads its server connection details from a <code>.env</code> file located
        at the root of the <code>packages/mobile</code> directory.
      </p>

      <h3>Environment file</h3>
      <CodeBlock
        :code="envConfig"
        language="bash"
        filename="packages/mobile/.env"
      />

      <h3>Runtime configuration</h3>
      <p>
        Users can also update the server URL from within the app's Settings screen after installation.
        The config is persisted in <code>AsyncStorage</code> and overrides the build-time defaults.
      </p>
      <CodeBlock
        :code="runtimeConfig"
        language="typescript"
        filename="src/services/config.ts"
      />

      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>Local development</strong>
          <p>
            When testing against a locally running server, use your machine's LAN IP address
            (e.g. <code>http://192.168.1.42:8000</code>) instead of <code>localhost</code>.
            The emulator / physical device cannot resolve <code>localhost</code> to the host machine.
          </p>
        </div>
      </div>
    </section>

    <section id="ios-setup">
      <h2>iOS Setup</h2>
      <p>
        Building for iOS requires a Mac with Xcode installed. Before running on a device or
        submitting to the App Store, you must configure code signing.
      </p>

      <h3>Install CocoaPods dependencies</h3>
      <CodeBlock
        :code="iosPodInstall"
        language="bash"
        filename="Terminal"
      />

      <h3>Code signing</h3>
      <p>
        Open the Xcode workspace to configure signing and capabilities:
      </p>
      <CodeBlock
        :code="iosXcodeOpen"
        language="bash"
        filename="Terminal"
      />
      <ol>
        <li>Select the <strong>ClaudeNest</strong> target in the project navigator.</li>
        <li>Open the <strong>Signing &amp; Capabilities</strong> tab.</li>
        <li>Set your <strong>Team</strong> and confirm the bundle identifier is <code>com.claudenest.app</code>.</li>
        <li>Enable the <strong>Push Notifications</strong> capability for APNs support.</li>
      </ol>

      <h3>Run on simulator</h3>
      <CodeBlock
        :code="iosRunCode"
        language="bash"
        filename="Terminal"
      />

      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>List available simulators</strong>
          <p>Run <code>xcrun simctl list devices available</code> to see all installed simulators and their exact names for the <code>--simulator</code> flag.</p>
        </div>
      </div>
    </section>

    <section id="android-setup">
      <h2>Android Setup</h2>
      <p>
        Android builds require the Android SDK and a properly configured <code>ANDROID_HOME</code>
        environment variable. Make sure an emulator or physical device is available before running.
      </p>

      <h3>Environment variables</h3>
      <CodeBlock
        :code="androidEnvCode"
        language="bash"
        filename="~/.zshrc or ~/.bashrc"
      />

      <h3>Gradle configuration</h3>
      <p>
        Local signing credentials and SDK paths go in the Gradle properties file which is
        intentionally excluded from version control.
      </p>
      <CodeBlock
        :code="gradlePropertiesCode"
        language="properties"
        filename="packages/mobile/android/gradle.properties"
      />

      <h3>Run on emulator or device</h3>
      <CodeBlock
        :code="androidRunCode"
        language="bash"
        filename="Terminal"
      />

      <div class="callout warning">
        <span class="callout-icon">!</span>
        <div>
          <strong>USB debugging required for physical devices</strong>
          <p>
            On Android, enable <strong>Developer Options</strong> and turn on
            <strong>USB Debugging</strong> before connecting a physical device.
            Run <code>adb devices</code> to verify the device is detected.
          </p>
        </div>
      </div>
    </section>

    <section id="running">
      <h2>Running the App</h2>
      <p>
        Start the Metro bundler first, then launch the app on your target platform.
      </p>

      <CodeTabs :tabs="runTabs" />

      <h3>Connecting to the server</h3>
      <p>
        After the app launches, navigate to <strong>Settings → Server</strong> and enter
        your ClaudeNest API URL and WebSocket endpoint. Tap <strong>Test Connection</strong>
        to verify reachability before logging in.
      </p>
      <CodeBlock
        :code="authFlow"
        language="typescript"
        filename="src/services/auth.ts"
      />
    </section>

    <section id="push-notifications">
      <h2>Push Notifications</h2>
      <p>
        ClaudeNest uses <strong>Firebase Cloud Messaging (FCM)</strong> for Android and
        <strong>Apple Push Notification Service (APNs)</strong> for iOS to deliver
        session-complete and task-update notifications even when the app is in the background.
      </p>

      <h3>Server-side credentials</h3>
      <p>Add the following variables to <code>packages/server/.env</code>:</p>
      <CodeBlock
        :code="pushServerEnv"
        language="bash"
        filename="packages/server/.env"
      />

      <h3>iOS — APNs key</h3>
      <ol>
        <li>In the <a href="https://developer.apple.com/account" target="_blank" rel="noopener">Apple Developer portal</a>, go to <strong>Certificates, Identifiers &amp; Profiles → Keys</strong>.</li>
        <li>Create a new key with the <strong>Apple Push Notifications service (APNs)</strong> capability.</li>
        <li>Download the <code>.p8</code> file and place it at <code>storage/app/apns/AuthKey.p8</code> on your server.</li>
        <li>Set <code>APNS_KEY_ID</code>, <code>APNS_TEAM_ID</code>, and <code>APNS_BUNDLE_ID</code> in the server <code>.env</code>.</li>
      </ol>

      <h3>Android — Firebase setup</h3>
      <ol>
        <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener">console.firebase.google.com</a>.</li>
        <li>Register the Android app with package name <code>com.claudenest.app</code>.</li>
        <li>Download <code>google-services.json</code> and place it in <code>packages/mobile/android/app/</code>.</li>
        <li>Copy the <strong>Server key</strong> from Firebase project settings to <code>FCM_SERVER_KEY</code> on the server.</li>
      </ol>

      <h3>Client registration</h3>
      <CodeBlock
        :code="pushClientCode"
        language="typescript"
        filename="src/services/notifications.ts"
      />

      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>Push notifications are optional</strong>
          <p>
            If you skip push notification setup, the app still works fully for interactive use.
            Background alerts will simply not be delivered.
          </p>
        </div>
      </div>
    </section>

    <section id="production">
      <h2>Building for Production</h2>
      <p>
        Production builds are optimized, minified, and signed for distribution through
        the App Store and Google Play.
      </p>

      <CodeTabs :tabs="productionBuildTabs" />

      <h3>Environment-specific configuration</h3>
      <p>
        For production builds, create a <code>.env.production</code> file alongside the
        standard <code>.env</code> and ensure <code>API_URL</code> and <code>WS_URL</code>
        point to your production ClaudeNest server.
      </p>
      <CodeBlock
        :code="productionEnvCode"
        language="bash"
        filename="packages/mobile/.env.production"
      />

      <div class="callout warning">
        <span class="callout-icon">!</span>
        <div>
          <strong>Never commit signing credentials</strong>
          <p>
            Keep <code>google-services.json</code>, <code>AuthKey.p8</code>, and any
            keystore files out of version control. Use CI/CD secret injection or an
            encrypted secrets manager to supply them during build.
          </p>
        </div>
      </div>
    </section>

    <section id="troubleshooting">
      <h2>Troubleshooting</h2>

      <h3>Metro bundler port conflict</h3>
      <p>
        If port 8081 is already in use, specify a different port:
      </p>
      <CodeBlock
        code="npx react-native start --port 8082"
        language="bash"
        filename="Terminal"
      />

      <h3>iOS build fails with CocoaPods error</h3>
      <CodeBlock
        :code="iosPodErrorCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Android — ANDROID_HOME not set</h3>
      <CodeBlock
        :code="androidHomeCode"
        language="bash"
        filename="Terminal"
      />

      <h3>WebSocket connection refused on device</h3>
      <p>
        Ensure the WebSocket port (default <code>8080</code>) is open in your firewall and
        that <code>WS_URL</code> uses the LAN IP of the server, not <code>localhost</code>.
      </p>
      <CodeBlock
        :code="wsDebugCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Push notifications not received on iOS simulator</h3>
      <div class="callout tip">
        <span class="callout-icon">i</span>
        <div>
          <strong>Simulators do not support real push notifications</strong>
          <p>
            APNs push notifications can only be tested on a <strong>physical iOS device</strong>.
            Use a physical device or mock the notification handler locally during development.
          </p>
        </div>
      </div>

      <h3>Blank screen on Android after login</h3>
      <CodeBlock
        :code="androidBlankCode"
        language="bash"
        filename="Terminal"
      />

      <h3>Full reset</h3>
      <p>
        When the Metro cache or native build artifacts are stale, a clean rebuild resolves
        most persistent issues:
      </p>
      <CodeBlock
        :code="fullResetCode"
        language="bash"
        filename="Terminal"
      />
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

const prereqCheckCode = ref(`# Node.js version (must be 20+)
node --version
# v20.x.x

# npm version
npm --version

# React Native CLI
npx react-native --version

# iOS: Xcode command-line tools
xcode-select --version

# iOS: CocoaPods
pod --version

# Android: check ANDROID_HOME
echo $ANDROID_HOME
# /Users/you/Library/Android/sdk

# Android: connected devices
adb devices`);

const installCode = ref(`# From the monorepo root
npm install

# Navigate to the mobile package
cd packages/mobile
npm install`);

const nativeSetupTabs = ref([
  {
    label: 'iOS',
    language: 'bash',
    filename: 'Terminal',
    code: `# Install CocoaPods native dependencies
cd packages/mobile/ios
pod install
cd ..

# Verify the workspace was created
ls ios/ClaudeNest.xcworkspace`,
  },
  {
    label: 'Android',
    language: 'bash',
    filename: 'Terminal',
    code: `# Ensure SDK tools are on PATH (add to ~/.zshrc or ~/.bashrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Accept Android SDK licenses (required once)
yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

# Verify Gradle wrapper
cd packages/mobile/android
./gradlew --version`,
  },
]);

const envConfig = ref(`# ClaudeNest Server
API_URL=https://api.claudenest.io
WS_URL=wss://api.claudenest.io:8080

# App metadata
APP_NAME=ClaudeNest
APP_VERSION=1.0.0

# Firebase (Android push notifications)
FCM_SENDER_ID=123456789012`);

const runtimeConfig = ref(`import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppConfig {
  apiUrl: string;
  wsUrl: string;
}

const DEFAULT_CONFIG: AppConfig = {
  apiUrl: process.env.API_URL ?? 'https://api.claudenest.io',
  wsUrl: process.env.WS_URL ?? 'wss://api.claudenest.io:8080',
};

export async function getConfig(): Promise<AppConfig> {
  const stored = await AsyncStorage.getItem('claudenest_config');
  if (stored) {
    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  }
  return DEFAULT_CONFIG;
}

export async function updateConfig(updates: Partial<AppConfig>): Promise<void> {
  const current = await getConfig();
  await AsyncStorage.setItem(
    'claudenest_config',
    JSON.stringify({ ...current, ...updates })
  );
}`);

const iosPodInstall = ref(`cd packages/mobile/ios

# Standard install
pod install

# If deintegrating a broken state first
pod deintegrate && pod install`);

const iosXcodeOpen = ref(`open packages/mobile/ios/ClaudeNest.xcworkspace`);

const iosRunCode = ref(`# Run on the default simulator (iPhone booted or last used)
npx react-native run-ios

# Run on a specific simulator
npx react-native run-ios --simulator="iPhone 15 Pro"

# Run on a connected physical device (device must be trusted)
npx react-native run-ios --device "Your iPhone Name"`);

const androidEnvCode = ref(`# Add to ~/.zshrc (macOS/Linux) or ~/.bashrc
export ANDROID_HOME=$HOME/Library/Android/sdk          # macOS
# export ANDROID_HOME=$HOME/Android/Sdk                # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Apply immediately
source ~/.zshrc`);

const gradlePropertiesCode = ref(`# packages/mobile/android/gradle.properties
# SDK location — override if not using ANDROID_HOME
# sdk.dir=/Users/you/Library/Android/sdk

# Hermes engine (recommended for RN 0.73+)
hermesEnabled=true

# Release signing — only needed for production builds
MYAPP_UPLOAD_STORE_FILE=claudenest-release.keystore
MYAPP_UPLOAD_STORE_PASSWORD=your-store-password
MYAPP_UPLOAD_KEY_ALIAS=claudenest
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password`);

const androidRunCode = ref(`# Run on the default emulator or connected device
npx react-native run-android

# Run on a specific device (get device id with: adb devices)
npx react-native run-android --deviceId emulator-5554

# Build a debug APK without installing
cd packages/mobile/android
./gradlew assembleDebug`);

const runTabs = ref([
  {
    label: 'iOS',
    language: 'bash',
    filename: 'Terminal',
    code: `# Terminal 1 — start Metro bundler
npx react-native start

# Terminal 2 — build and install on iOS
npx react-native run-ios --simulator="iPhone 15 Pro"`,
  },
  {
    label: 'Android',
    language: 'bash',
    filename: 'Terminal',
    code: `# Terminal 1 — start Metro bundler
npx react-native start

# Terminal 2 — build and install on Android
npx react-native run-android`,
  },
]);

const authFlow = ref(`import * as Keychain from 'react-native-keychain';
import { api } from './api';
import { getConfig } from './config';

export async function login(email: string, password: string): Promise<string> {
  const config = await getConfig();

  // Ensure the API client points to the configured server
  api.defaults.baseURL = config.apiUrl + '/api';

  const response = await api.post('/auth/login', { email, password });
  const { token } = response.data.data;

  // Persist the token securely in the OS keychain
  await Keychain.setGenericPassword('claudenest_token', token, {
    service: 'com.claudenest.auth',
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });

  api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
  return token;
}

export async function restoreSession(): Promise<boolean> {
  const credentials = await Keychain.getGenericPassword({
    service: 'com.claudenest.auth',
  });

  if (credentials) {
    api.defaults.headers.common['Authorization'] =
      \`Bearer \${credentials.password}\`;
    return true;
  }
  return false;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout').catch(() => {});
  await Keychain.resetGenericPassword({ service: 'com.claudenest.auth' });
  delete api.defaults.headers.common['Authorization'];
}`);

const pushServerEnv = ref(`# Firebase Cloud Messaging (Android)
FCM_SERVER_KEY=your-firebase-server-key
FCM_SENDER_ID=123456789012

# Apple Push Notification Service (iOS)
APNS_KEY_ID=ABC123DEF4
APNS_TEAM_ID=TEAM123456
APNS_BUNDLE_ID=com.claudenest.app
APNS_KEY_FILE=storage/app/apns/AuthKey.p8

# Environment (use 'production' for real devices, 'sandbox' for development)
APNS_ENVIRONMENT=sandbox`);

const pushClientCode = ref(`import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { api } from './api';

export async function registerForPushNotifications(): Promise<void> {
  // Request permission (required on iOS, no-op on Android 12 and below)
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.warn('[Push] Permission denied');
    return;
  }

  // Retrieve the FCM registration token
  const fcmToken = await messaging().getToken();

  // Register with the ClaudeNest server
  await api.post('/push-tokens', {
    token: fcmToken,
    platform: Platform.OS,   // 'ios' | 'android'
  });

  // Handle messages while the app is in the foreground
  messaging().onMessage(async (message) => {
    const { title, body } = message.notification ?? {};
    showLocalNotification(title ?? 'ClaudeNest', body ?? '');
  });

  // Re-register if the token is rotated by Firebase
  messaging().onTokenRefresh(async (newToken) => {
    await api.post('/push-tokens', {
      token: newToken,
      platform: Platform.OS,
    });
  });
}

export async function unregisterPushNotifications(): Promise<void> {
  const token = await messaging().getToken();
  await api.delete(\`/push-tokens/\${token}\`);
  await messaging().deleteToken();
}`);

const productionBuildTabs = ref([
  {
    label: 'iOS',
    language: 'bash',
    filename: 'Terminal',
    code: `# Build a release .ipa via xcodebuild (requires signing configured in Xcode)
cd packages/mobile/ios
xcodebuild \
  -workspace ClaudeNest.xcworkspace \
  -scheme ClaudeNest \
  -configuration Release \
  -archivePath build/ClaudeNest.xcarchive \
  archive

# Export the archive to an .ipa
xcodebuild -exportArchive \
  -archivePath build/ClaudeNest.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/ipa`,
  },
  {
    label: 'Android',
    language: 'bash',
    filename: 'Terminal',
    code: `# Generate a release keystore (first time only)
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore packages/mobile/android/app/claudenest-release.keystore \
  -alias claudenest \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Build a signed release AAB (recommended for Google Play)
cd packages/mobile/android
./gradlew bundleRelease

# Or build a signed APK
./gradlew assembleRelease

# Output paths:
# AAB: android/app/build/outputs/bundle/release/app-release.aab
# APK: android/app/build/outputs/apk/release/app-release.apk`,
  },
]);

const productionEnvCode = ref(`# Production server
API_URL=https://api.claudenest.io
WS_URL=wss://api.claudenest.io:8080

APP_NAME=ClaudeNest
APP_VERSION=1.0.0

FCM_SENDER_ID=123456789012`);

const iosPodErrorCode = ref(`# Clear derived data and pod cache
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf packages/mobile/ios/Pods
rm -f packages/mobile/ios/Podfile.lock

# Reinstall
cd packages/mobile/ios && pod install`);

const androidHomeCode = ref(`# Verify the variable is set
echo $ANDROID_HOME

# Locate the SDK if unset
ls ~/Library/Android/sdk          # macOS
ls ~/Android/Sdk                  # Linux

# Set it permanently (replace path as needed)
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc`);

const wsDebugCode = ref(`# From your dev machine, verify the server WebSocket port is reachable
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGVzdA==" \
  http://192.168.1.42:8080/app/claudenest-app-key

# On Android, check the emulator can reach the host machine
adb shell curl http://10.0.2.2:8080/`);

const androidBlankCode = ref(`# Clear the Metro cache
npx react-native start --reset-cache

# Clear the Android build cache
cd packages/mobile/android && ./gradlew clean

# Rebuild
npx react-native run-android`);

const fullResetCode = ref(`# Stop Metro if running (Ctrl+C), then:

# Clear Metro and React Native caches
rm -rf $TMPDIR/react-native-packager-cache-*
rm -rf $TMPDIR/metro-*

# iOS — clean native build
cd packages/mobile/ios
rm -rf Pods Podfile.lock
pod install

# Android — clean Gradle output
cd packages/mobile/android
./gradlew clean

# Restart Metro with clean cache
cd packages/mobile
npx react-native start --reset-cache`);
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

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
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

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul,
ol {
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
  background: var(--bg-code, #0f0f1a);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* Prerequisites grid */
.prereq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin: 1rem 0 1.5rem;
}

.prereq-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
}

.prereq-item .check {
  width: 28px;
  height: 28px;
  min-width: 28px;
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.prereq-item div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.prereq-item strong {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.prereq-item span {
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Callout boxes */
.callout {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  margin: 1.5rem 0;
}

.callout.tip {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-cyan, #22d3ee) 25%, transparent);
}

.callout.warning {
  background: color-mix(in srgb, #fbbf24 8%, transparent);
  border: 1px solid color-mix(in srgb, #fbbf24 25%, transparent);
}

.callout-icon {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.callout.tip .callout-icon {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 20%, transparent);
  color: var(--accent-cyan, #22d3ee);
}

.callout.warning .callout-icon {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.callout strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  font-size: 0.95rem;
}

.callout p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .prereq-grid {
    grid-template-columns: 1fr;
  }
}
</style>
