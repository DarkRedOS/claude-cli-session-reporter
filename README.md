# Claude Report System

Capture and view Claude Code sessions. Works even when Claude is down.

## Quick Start

### Install

```bash
./install.sh
```

### Use

```bash
# Report an issue
claude-report

# View reports
open http://localhost:3000
```

## Sharing with Peers

### For You (Host)

1. Start your receiver server:
   ```bash
   cd receiver && npm start
   ```

2. Find your IP address:
   ```bash
   ipconfig getifaddr en0  # macOS
   ```

3. Share the zip with peers:
   ```bash
   zip -r claude-report-system.zip install.sh claude-report receiver/
   ```

### For Peers

1. Unzip and run installer:
   ```bash
   unzip claude-report-system.zip
   ./install.sh
   ```

2. When asked "Use remote receiver?", type `y`

3. Enter your IP: `http://YOUR_IP:3000`

4. Reports will now appear on your dashboard!

## Requirements

- Node.js (v14+)

## Files

- `install.sh` - One-click installer
- `claude-report` - Report script
- `receiver/` - Server and dashboard