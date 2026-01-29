#!/bin/bash

# Claude Report System - One-Click Installer
# Run this script to install the entire system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/.claude-report"
# Ask user if they want to use a remote receiver
echo -e "${YELLOW}Do you want to use a remote receiver server? (y/N)${NC}"
read -r USE_REMOTE

if [[ "$USE_REMOTE" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Enter the receiver URL (e.g., http://192.168.1.100:3000):${NC}"
    read -r RECEIVER_URL
    echo "export CLAUDE_RECEIVER_URL=\"$RECEIVER_URL\"" >> ~/.zshrc
    echo -e "${GREEN}✓ Receiver URL saved to ~/.zshrc${NC}"
else
    RECEIVER_URL="http://localhost:3000"
fi

echo -e "${BLUE}"
echo "=========================================="
echo "  Claude Report System Installer"
echo "=========================================="
echo -e "${NC}"

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        echo ""
        echo "Please install Node.js first:"
        echo "  macOS: brew install node"
        echo "  Or visit: https://nodejs.org/"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
}

# Create installation directory
create_dirs() {
    echo -e "\n${YELLOW}Creating installation directory...${NC}"
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/receiver/public"
    mkdir -p "$HOME/bin"
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Copy files
copy_files() {
    echo -e "\n${YELLOW}Copying files...${NC}"
    
    # Copy receiver files
    cp receiver/package.json "$INSTALL_DIR/receiver/"
    cp receiver/server.js "$INSTALL_DIR/receiver/"
    cp receiver/database.js "$INSTALL_DIR/receiver/"
    
    # Copy public files
    cp receiver/public/index.html "$INSTALL_DIR/receiver/public/"
    cp receiver/public/styles.css "$INSTALL_DIR/receiver/public/"
    cp receiver/public/app.js "$INSTALL_DIR/receiver/public/"
    
    # Copy report script
    cp claude-report "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/claude-report"
    
    # Copy to bin
    cp claude-report "$HOME/bin/claude-report"
    chmod +x "$HOME/bin/claude-report"
    
    echo -e "${GREEN}✓ Files copied${NC}"
}

# Install dependencies
install_deps() {
    echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
    cd "$INSTALL_DIR/receiver"
    npm install --silent
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Setup PATH
setup_path() {
    echo -e "\n${YELLOW}Setting up PATH...${NC}"
    
    # Check if PATH already contains ~/bin
    if ! echo "$PATH" | grep -q "$HOME/bin"; then
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
        echo -e "${GREEN}✓ Added ~/bin to PATH in ~/.zshrc${NC}"
        echo -e "${YELLOW}Please run: source ~/.zshrc${NC}"
    else
        echo -e "${GREEN}✓ PATH already configured${NC}"
    fi
}

# Create systemd service (Linux) or launch agent (macOS)
setup_autostart() {
    echo -e "\n${YELLOW}Setting up auto-start...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        PLIST="$HOME/Library/LaunchAgents/com.claude.report.plist"
        cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude.report</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/bin/node</string>
        <string>$INSTALL_DIR/receiver/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR/receiver</string>
</dict>
</plist>
EOF
        echo -e "${GREEN}✓ Launch agent created${NC}"
        echo -e "${YELLOW}To enable auto-start, run:${NC}"
        echo "  launchctl load $PLIST"
    else
        # Linux
        echo -e "${YELLOW}Auto-start not configured for Linux${NC}"
        echo "You can manually start the server with:"
        echo "  cd $INSTALL_DIR/receiver && npm start"
    fi
}

# Start server (only if using localhost)
start_server() {
    if [[ "$RECEIVER_URL" != *"localhost"* ]]; then
        echo -e "${YELLOW}Using remote receiver at: $RECEIVER_URL${NC}"
        echo -e "${YELLOW}Not starting local server${NC}"
        return
    fi
    
    echo -e "\n${YELLOW}Starting receiver server...${NC}"
    cd "$INSTALL_DIR/receiver"
    
    # Check if server is already running
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Server is already running on port 3000${NC}"
    else
        npm start &
        sleep 2
        echo -e "${GREEN}✓ Server started${NC}"
    fi
}

# Print summary
print_summary() {
    echo -e "\n${BLUE}"
    echo "=========================================="
    echo "  Installation Complete!"
    echo "=========================================="
    echo -e "${NC}"
    echo -e "${GREEN}Installation directory:${NC} $INSTALL_DIR"
    echo -e "${GREEN}Receiver URL:${NC} $RECEIVER_URL"
    echo -e "${GREEN}Report command:${NC} claude-report"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Reload your shell: source ~/.zshrc"
    echo "  2. Test the command: claude-report"
    echo "  3. View dashboard: open http://localhost:3000"
    echo ""
    echo -e "${YELLOW}To start the server manually:${NC}"
    echo "  cd $INSTALL_DIR/receiver && npm start"
    echo ""
    echo -e "${YELLOW}To stop the server:${NC}"
    echo "  pkill -f 'node.*server.js'"
    echo ""
}

# Main installation
main() {
    check_node
    create_dirs
    copy_files
    install_deps
    setup_path
    setup_autostart
    start_server
    print_summary
}

# Run main function
main