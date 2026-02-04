# ClaudeNest Mobile

React Native mobile application for ClaudeNest - Remote control for Claude Code instances.

## Features

- **Machine Management**: Pair and manage remote machines running Claude Code
- **Interactive Sessions**: Start, monitor, and control Claude sessions from mobile
- **Multi-Agent Projects**: Collaborate across multiple Claude instances
- **Real-time Sync**: WebSocket-powered live updates
- **Context Management**: View and edit shared project context
- **Task Board**: Manage and assign tasks across instances
- **File Locks**: Monitor and manage file locks to prevent conflicts

## Tech Stack

- React Native 0.73+
- TypeScript 5.x
- React Navigation 6
- Zustand (State Management)
- TanStack Query (Server State)
- Socket.io Client (WebSocket)
- React Native Reanimated (Animations)

## Project Structure

```
src/
├── App.tsx                 # Main entry point
├── components/
│   ├── common/            # Reusable UI components
│   ├── machines/          # Machine-related components
│   ├── sessions/          # Session-related components
│   └── multiagent/        # Multi-agent components
├── screens/
│   ├── auth/              # Auth screens
│   ├── machines/          # Machine screens
│   ├── sessions/          # Session screens
│   ├── multiagent/        # Project/screens
│   ├── config/            # Configuration screens
│   └── settings/          # Settings screens
├── navigation/            # React Navigation setup
├── stores/                # Zustand stores
├── services/              # API and WebSocket services
├── theme/                 # Colors, typography, spacing
├── types/                 # TypeScript types
└── utils/                 # Utility functions
```

## Brand Colors

- Primary: `#a855f7`
- Background: `#1a1b26`
- Surface: `#24283b`
- Success: `#22c55e`
- Error: `#ef4444`

## Getting Started

### Prerequisites

- Node.js 18+
- React Native development environment
- iOS: Xcode 15+
- Android: Android Studio with SDK

### Installation

```bash
# Install dependencies
npm install

# iOS
npm run pod-install
npm run ios

# Android
npm run android
```

### Environment Variables

Create a `.env` file:

```
CLAUDENEST_API_URL=https://api.claudenest.app
CLAUDENEST_WS_URL=wss://api.claudenest.app
```

## License

MIT
