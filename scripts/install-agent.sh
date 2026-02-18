#!/bin/bash
#
# ClaudeNest Agent Installer
# Install the ClaudeNest agent on Linux, macOS, or Windows (WSL).
#
# Usage:
#   curl -fsSL https://claudenest.io/install-agent.sh | bash
#   curl -fsSL https://claudenest.io/install-agent.sh | bash -s -- --server https://my-server.com
#

set -euo pipefail

# ============================================
# Configuration
# ============================================
PACKAGE_NAME="@claudenest/agent"
MIN_NODE_VERSION=20
DEFAULT_SERVER_URL="https://api.claudenest.io"
SERVER_URL="$DEFAULT_SERVER_URL"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================
# Helpers
# ============================================
info()    { echo -e "${BLUE}[info]${NC} $1"; }
success() { echo -e "${GREEN}[ok]${NC} $1"; }
warn()    { echo -e "${YELLOW}[warn]${NC} $1"; }
error()   { echo -e "${RED}[error]${NC} $1"; }
step()    { echo -e "\n${PURPLE}${BOLD}→ $1${NC}"; }

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

version_gte() {
  # Returns 0 if $1 >= $2
  printf '%s\n%s' "$2" "$1" | sort -V -C
}

get_node_major() {
  node --version 2>/dev/null | sed 's/^v//' | cut -d. -f1
}

detect_os() {
  case "$(uname -s)" in
    Linux*)   OS="linux" ;;
    Darwin*)  OS="macos" ;;
    MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
    *)        OS="unknown" ;;
  esac

  case "$(uname -m)" in
    x86_64|amd64) ARCH="x64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *)             ARCH="$(uname -m)" ;;
  esac
}

# ============================================
# Banner
# ============================================
print_banner() {
  echo -e "${PURPLE}"
  cat << 'EOF'
   _____ _                 _       _   _           _
  / ____| |               | |     | \ | |         | |
 | |    | | __ _ _   _  __| | ___ |  \| | ___  ___| |_
 | |    | |/ _` | | | |/ _` |/ _ \| . ` |/ _ \/ __| __|
 | |____| | (_| | |_| | (_| |  __/| |\  |  __/\__ \ |_
  \_____|_|\__,_|\__,_|\__,_|\___||_| \_|\___||___/\__|
                                           Agent Installer
EOF
  echo -e "${NC}"
}

# ============================================
# Parse arguments
# ============================================
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --server|-s)
        SERVER_URL="$2"
        shift 2
        ;;
      --no-pair)
        NO_PAIR=true
        shift
        ;;
      --no-service)
        NO_SERVICE=true
        shift
        ;;
      --help|-h)
        echo "Usage: install-agent.sh [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  -s, --server <url>   ClaudeNest server URL (default: $DEFAULT_SERVER_URL)"
        echo "  --no-pair            Skip pairing step"
        echo "  --no-service         Skip service installation"
        echo "  -h, --help           Show this help"
        exit 0
        ;;
      *)
        shift
        ;;
    esac
  done
}

NO_PAIR=false
NO_SERVICE=false
parse_args "$@"

# ============================================
# Step 1: Detect OS
# ============================================
install_node_linux() {
  step "Installing Node.js $MIN_NODE_VERSION on Linux..."

  if command_exists apt-get; then
    # Debian/Ubuntu
    info "Detected Debian/Ubuntu"
    curl -fsSL https://deb.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command_exists dnf; then
    # Fedora/RHEL
    info "Detected Fedora/RHEL"
    curl -fsSL https://rpm.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo bash -
    sudo dnf install -y nodejs
  elif command_exists pacman; then
    # Arch Linux
    info "Detected Arch Linux"
    sudo pacman -Sy --noconfirm nodejs npm
  elif command_exists apk; then
    # Alpine
    info "Detected Alpine"
    sudo apk add --no-cache nodejs npm
  else
    warn "Package manager not recognized. Installing Node.js via nvm..."
    install_node_nvm
    return
  fi
}

install_node_macos() {
  step "Installing Node.js $MIN_NODE_VERSION on macOS..."

  if command_exists brew; then
    info "Using Homebrew"
    brew install node@${MIN_NODE_VERSION}
    brew link --overwrite node@${MIN_NODE_VERSION} 2>/dev/null || true
  else
    warn "Homebrew not found. Installing Node.js via nvm..."
    install_node_nvm
  fi
}

install_node_nvm() {
  info "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

  # Load nvm
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

  nvm install "$MIN_NODE_VERSION"
  nvm use "$MIN_NODE_VERSION"
  nvm alias default "$MIN_NODE_VERSION"
}

install_build_tools_linux() {
  step "Installing build tools for native modules..."

  if command_exists apt-get; then
    sudo apt-get install -y build-essential python3
  elif command_exists dnf; then
    sudo dnf groupinstall -y "Development Tools"
    sudo dnf install -y python3
  elif command_exists pacman; then
    sudo pacman -Sy --noconfirm base-devel python
  elif command_exists apk; then
    sudo apk add --no-cache build-base python3
  else
    warn "Could not install build tools automatically. node-pty may fail to compile."
    warn "Please install gcc, g++, make, and python3 manually."
  fi
}

install_build_tools_macos() {
  step "Checking Xcode Command Line Tools..."

  if ! xcode-select -p >/dev/null 2>&1; then
    info "Installing Xcode Command Line Tools (this may take a while)..."
    xcode-select --install 2>/dev/null || true

    # Wait for installation
    until xcode-select -p >/dev/null 2>&1; do
      sleep 5
    done
    success "Xcode CLI tools installed"
  else
    success "Xcode CLI tools already installed"
  fi
}

# ============================================
# Main installation flow
# ============================================
main() {
  print_banner
  detect_os

  info "Detected: ${BOLD}${OS}${NC} (${ARCH})"
  echo ""

  if [[ "$OS" == "unknown" ]]; then
    error "Unsupported operating system: $(uname -s)"
    error "Please install manually: npm install -g $PACKAGE_NAME"
    exit 1
  fi

  if [[ "$OS" == "windows" ]]; then
    error "Native Windows detected. Please use the PowerShell installer instead:"
    echo ""
    echo "  irm https://claudenest.io/install-agent.ps1 | iex"
    echo ""
    echo "Or install via npm directly:"
    echo "  npm install -g $PACKAGE_NAME"
    exit 1
  fi

  # ------------------------------------------
  # Step 1: Check / Install Node.js
  # ------------------------------------------
  step "Checking Node.js..."

  if command_exists node; then
    NODE_MAJOR=$(get_node_major)
    if [[ "$NODE_MAJOR" -ge "$MIN_NODE_VERSION" ]]; then
      success "Node.js v$(node --version | sed 's/^v//') found (>= $MIN_NODE_VERSION required)"
    else
      warn "Node.js v$(node --version | sed 's/^v//') found, but v$MIN_NODE_VERSION+ required"
      case "$OS" in
        linux)  install_node_linux ;;
        macos)  install_node_macos ;;
      esac
    fi
  else
    info "Node.js not found"
    case "$OS" in
      linux)  install_node_linux ;;
      macos)  install_node_macos ;;
    esac
  fi

  # Verify Node.js is available
  if ! command_exists node; then
    error "Node.js installation failed. Please install Node.js $MIN_NODE_VERSION+ manually."
    error "Visit: https://nodejs.org/"
    exit 1
  fi

  NODE_MAJOR=$(get_node_major)
  if [[ "$NODE_MAJOR" -lt "$MIN_NODE_VERSION" ]]; then
    error "Node.js v$MIN_NODE_VERSION+ required but got v$(node --version | sed 's/^v//')"
    exit 1
  fi

  # ------------------------------------------
  # Step 2: Install build tools (for node-pty)
  # ------------------------------------------
  case "$OS" in
    linux)  install_build_tools_linux ;;
    macos)  install_build_tools_macos ;;
  esac

  # ------------------------------------------
  # Step 3: Install @claudenest/agent
  # ------------------------------------------
  step "Installing $PACKAGE_NAME..."

  if command_exists claudenest-agent; then
    CURRENT_VERSION=$(claudenest-agent --version 2>/dev/null || echo "unknown")
    info "Upgrading from v${CURRENT_VERSION}..."
    npm install -g "$PACKAGE_NAME@latest"
  else
    npm install -g "$PACKAGE_NAME"
  fi

  # Find the installed binary
  # In curl|bash context, PATH and hash table may be stale.
  # Probe npm locations, add to PATH, then verify.
  AGENT_BIN=""
  NPM_PREFIX="$(npm config get prefix 2>/dev/null || true)"
  NPM_ROOT="$(npm root -g 2>/dev/null || true)"

  info "npm prefix: ${NPM_PREFIX:-N/A}"

  # Ensure npm bin directory is in PATH for this session
  if [[ -n "$NPM_PREFIX" && -d "${NPM_PREFIX}/bin" ]]; then
    export PATH="${NPM_PREFIX}/bin:${PATH}"
  fi
  hash -r 2>/dev/null

  # Strategy 1: Direct command lookup (works if npm bin is now in PATH)
  if command -v claudenest-agent >/dev/null 2>&1; then
    AGENT_BIN="$(command -v claudenest-agent)"
    info "Found via PATH: ${AGENT_BIN}"
  fi

  # Strategy 2: Check npm prefix bin (symlink or file)
  if [[ -z "$AGENT_BIN" && -n "$NPM_PREFIX" ]]; then
    local candidate="${NPM_PREFIX}/bin/claudenest-agent"
    if [[ -x "$candidate" ]] || [[ -L "$candidate" ]]; then
      AGENT_BIN="$candidate"
      info "Found at npm prefix: ${AGENT_BIN}"
    fi
  fi

  # Strategy 3: Derive bin from npm root (lib/node_modules → ../bin)
  if [[ -z "$AGENT_BIN" && -n "$NPM_ROOT" ]]; then
    local derived_bin
    derived_bin="$(cd "$(dirname "$NPM_ROOT")/.." 2>/dev/null && pwd)/bin"
    if [[ -x "${derived_bin}/claudenest-agent" ]]; then
      AGENT_BIN="${derived_bin}/claudenest-agent"
      info "Found via npm root: ${AGENT_BIN}"
    fi
  fi

  # Strategy 4: Common global bin locations
  if [[ -z "$AGENT_BIN" ]]; then
    for dir in /usr/local/bin /usr/bin "$HOME/.npm-global/bin" "$HOME/.local/bin"; do
      if [[ -x "${dir}/claudenest-agent" ]]; then
        AGENT_BIN="${dir}/claudenest-agent"
        info "Found in ${dir}"
        break
      fi
    done
  fi

  # Strategy 5: Locate raw .js entry point and create wrapper
  if [[ -z "$AGENT_BIN" && -n "$NPM_ROOT" ]]; then
    local pkg_entry="${NPM_ROOT}/@claudenest/agent/dist/index.js"
    if [[ -f "$pkg_entry" ]]; then
      info "Binary symlink missing. Creating wrapper script..."
      local wrapper_dir="$HOME/.local/bin"
      local wrapper_path="${wrapper_dir}/claudenest-agent"
      mkdir -p "$wrapper_dir"
      printf '#!/usr/bin/env bash\nexec node "%s" "$@"\n' "$pkg_entry" > "$wrapper_path"
      chmod +x "$wrapper_path"
      AGENT_BIN="$wrapper_path"
      info "Created wrapper: ${wrapper_path}"
    fi
  fi

  # Add binary directory to PATH if not already there
  if [[ -n "$AGENT_BIN" ]]; then
    AGENT_BIN_DIR="$(dirname "$AGENT_BIN")"
    export PATH="${AGENT_BIN_DIR}:${PATH}"
    hash -r 2>/dev/null

    # Persist to shell profile
    SHELL_NAME="$(basename "${SHELL:-bash}")"
    case "$SHELL_NAME" in
      zsh)  PROFILE="$HOME/.zshrc" ;;
      bash) PROFILE="$HOME/.bashrc" ;;
      *)    PROFILE="$HOME/.profile" ;;
    esac

    if ! grep -q "claudenest" "$PROFILE" 2>/dev/null; then
      echo '' >> "$PROFILE"
      echo '# ClaudeNest agent (added by installer)' >> "$PROFILE"
      echo "export PATH=\"${AGENT_BIN_DIR}:\$PATH\"" >> "$PROFILE"
      info "Added ${AGENT_BIN_DIR} to PATH in ${PROFILE}"
    fi
  fi

  # Final verification
  if ! command -v claudenest-agent >/dev/null 2>&1; then
    echo ""
    error "Installation failed. The 'claudenest-agent' command is not available."
    error ""
    error "Diagnostics:"
    error "  npm prefix:  ${NPM_PREFIX:-N/A}"
    error "  npm root -g: ${NPM_ROOT:-N/A}"
    error "  PATH: $PATH"
    error "  Binary found: ${AGENT_BIN:-none}"
    if [[ -n "$NPM_PREFIX" ]]; then
      error "  ls prefix/bin: $(ls "${NPM_PREFIX}/bin/" 2>/dev/null | grep claude || echo 'not found')"
    fi
    if [[ -n "$NPM_ROOT" ]]; then
      error "  pkg exists: $(ls "${NPM_ROOT}/@claudenest/agent/dist/index.js" 2>/dev/null && echo 'yes' || echo 'no')"
    fi
    error ""
    error "Try manually:"
    error "  npm install -g $PACKAGE_NAME"
    error "  export PATH=\"\$(npm config get prefix)/bin:\$PATH\""
    error "  claudenest-agent --version"
    exit 1
  fi

  INSTALLED_VERSION=$(claudenest-agent --version 2>/dev/null || echo "unknown")
  success "ClaudeNest Agent v${INSTALLED_VERSION} installed"

  # ------------------------------------------
  # Step 4: Pair with server
  # ------------------------------------------
  if [[ "$NO_PAIR" == "false" ]]; then
    step "Pairing with ClaudeNest server..."
    echo ""
    info "Server: ${BOLD}${SERVER_URL}${NC}"
    echo ""

    read -rp "$(echo -e "${CYAN}Pair this machine now? [Y/n]:${NC} ")" PAIR_ANSWER
    PAIR_ANSWER=${PAIR_ANSWER:-Y}

    if [[ "$PAIR_ANSWER" =~ ^[Yy]$ ]]; then
      claudenest-agent pair --server "$SERVER_URL"
    else
      info "Skipped. You can pair later with: claudenest-agent pair"
    fi
  fi

  # ------------------------------------------
  # Step 5: Setup auto-start service
  # ------------------------------------------
  if [[ "$NO_SERVICE" == "false" ]]; then
    step "Auto-start service setup"
    echo ""

    read -rp "$(echo -e "${CYAN}Install as system service (auto-start on boot)? [y/N]:${NC} ")" SERVICE_ANSWER
    SERVICE_ANSWER=${SERVICE_ANSWER:-N}

    if [[ "$SERVICE_ANSWER" =~ ^[Yy]$ ]]; then
      install_service
    else
      info "Skipped. Start manually with: claudenest-agent start"
    fi
  fi

  # ------------------------------------------
  # Done
  # ------------------------------------------
  echo ""
  echo -e "${GREEN}${BOLD}Installation complete!${NC}"
  echo ""
  echo "  Quick start:"
  echo "    claudenest-agent pair      # Pair with your account"
  echo "    claudenest-agent start     # Start the agent"
  echo "    claudenest-agent status    # Check status"
  echo ""
  echo "  Configuration:"
  echo "    claudenest-agent config --list"
  echo "    claudenest-agent config --set serverUrl=$SERVER_URL"
  echo ""
  echo -e "  Documentation: ${CYAN}https://docs.claudenest.io${NC}"
  echo ""
}

# ============================================
# Service installation
# ============================================
install_service() {
  AGENT_PATH=$(command -v claudenest-agent)

  if [[ "$OS" == "linux" ]]; then
    install_systemd_service "$AGENT_PATH"
  elif [[ "$OS" == "macos" ]]; then
    install_launchd_service "$AGENT_PATH"
  fi
}

install_systemd_service() {
  local agent_path="$1"
  local service_file="/etc/systemd/system/claudenest-agent.service"

  info "Creating systemd service..."

  sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=ClaudeNest Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
Environment=HOME=$HOME
Environment=PATH=$PATH
ExecStart=$agent_path start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable claudenest-agent
  sudo systemctl start claudenest-agent

  success "Systemd service installed and started"
  info "Manage with: sudo systemctl {start|stop|restart|status} claudenest-agent"
}

install_launchd_service() {
  local agent_path="$1"
  local plist_dir="$HOME/Library/LaunchAgents"
  local plist_file="$plist_dir/io.claudenest.agent.plist"

  info "Creating launchd service..."

  mkdir -p "$plist_dir"

  cat > "$plist_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.claudenest.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>$agent_path</string>
    <string>start</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>NetworkState</key>
    <true/>
  </dict>
  <key>StandardOutPath</key>
  <string>$HOME/Library/Logs/ClaudeNest/agent.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/Library/Logs/ClaudeNest/agent-error.log</string>
</dict>
</plist>
EOF

  mkdir -p "$HOME/Library/Logs/ClaudeNest"
  launchctl load "$plist_file"

  success "Launchd service installed and loaded"
  info "Manage with: launchctl {load|unload} $plist_file"
}

# Run main
main
