# KnitDema V3 Bluetooth App

A modern React-based Bluetooth Low Energy (BLE) application for managing KnitDema devices with real-time data visualization and control features.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Guide](#installation-guide)
  - [Windows Setup](#windows-setup)
  - [macOS Setup](#macos-setup)
- [Project Setup](#project-setup)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## 🔧 Prerequisites

This project requires:

- **Node.js** (v18 or higher) - _includes npm automatically_
- **npm** (Node Package Manager) - _comes bundled with Node.js_
- **pnpm** (Package manager - required for this project)
- **Git** (for cloning the repository)
- **Modern web browser** with Bluetooth support (Chrome 56+, Edge 79+, or Opera 43+ recommended)

### System Requirements

- **Windows**: Windows 10 or higher
- **macOS**: macOS 10.15 (Catalina) or higher
- **RAM**: Minimum 4GB, 8GB recommended
- **Storage**: At least 1GB free space for Node.js, dependencies, and project files

> **Important**: We use pnpm as our package manager instead of npm or yarn for better dependency management and faster installations.

> **Note**: npm (Node Package Manager) is automatically installed when you install Node.js. You don't need to install npm separately.

## 📦 Installation Guide

### Windows Setup

#### Step 1: Install Git

Git is required to clone the repository. If you plan to download the project as a ZIP file, you can skip this step.

1. **Download Git**: Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. **Run the installer**: Follow the installation wizard with default settings
3. **Verify installation**: Open Command Prompt or PowerShell and run:
   ```bash
   git --version
   ```

**Alternative using Chocolatey**:

```bash
choco install git
```

**Alternative using Winget**:

```bash
winget install Git.Git
```

#### Step 2: Install Node.js

1. **Visit the Node.js website**: Go to [https://nodejs.org/](https://nodejs.org/)
2. **Download the LTS version**: Click on the "LTS" (Long Term Support) version - it should be v18 or higher
3. **Run the installer**:
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - Make sure to check "Add to PATH" option
4. **Verify installation**: Open Command Prompt (cmd) or PowerShell and run:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers for both commands.

**Alternative using Chocolatey** (if you have Chocolatey installed):

```bash
choco install nodejs
```

**Alternative using Winget** (Windows 10+):

```bash
winget install OpenJS.NodeJS
```

#### Step 3: Install pnpm

Open Command Prompt or PowerShell as Administrator and run:

```bash
npm install -g pnpm
```

**Alternative using PowerShell**:

```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**Alternative using Chocolatey**:

```bash
choco install pnpm
```

Verify pnpm installation:

```bash
pnpm --version
```

### macOS Setup

#### Step 1: Install Git

Git is required to clone the repository. If you plan to download the project as a ZIP file, you can skip this step.

**Check if Git is already installed**:

```bash
git --version
```

If Git is not installed:

**Option A: Install via Xcode Command Line Tools** (Recommended):

```bash
xcode-select --install
```

**Option B: Using Homebrew**:

```bash
brew install git
```

**Option C: Download from Git website**:

1. Go to [https://git-scm.com/download/mac](https://git-scm.com/download/mac)
2. Download and run the installer

#### Step 2: Install Node.js

**Option A: Using the Official Installer**

1. **Visit the Node.js website**: Go to [https://nodejs.org/](https://nodejs.org/)
2. **Download the LTS version**: Click on the "LTS" version for macOS
3. **Run the installer**: Double-click the downloaded `.pkg` file and follow the installation steps
4. **Verify installation**: Open Terminal and run:
   ```bash
   node --version
   npm --version
   ```

**Option B: Using Homebrew** (Recommended)

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **Install Node.js**:
   ```bash
   brew install node
   ```
3. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

**Option C: Using Node Version Manager (nvm)**

1. **Install nvm**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```
2. **Restart your terminal or run**:
   ```bash
   source ~/.bashrc
   ```
3. **Install the latest LTS Node.js**:
   ```bash
   nvm install --lts
   nvm use --lts
   ```

#### Step 3: Install pnpm

**Using npm**:

```bash
npm install -g pnpm
```

**Using Homebrew**:

```bash
brew install pnpm
```

**Using the standalone script**:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

Verify pnpm installation:

```bash
pnpm --version
```

## 🚀 Project Setup

### Step 1: Clone or Download the Project

If you have Git installed:

```bash
git clone <repository-url>
cd knitdema-ble-app
```

Or download the project as a ZIP file and extract it to your desired location.

### Step 2: Install Dependencies

Navigate to the project directory and install dependencies using pnpm:

```bash
cd knitdema-ble-app
pnpm install
```

This will:

- Install all required dependencies listed in `package.json`
- Create a `node_modules` folder with all packages
- Generate a `pnpm-lock.yaml` file (do not delete this file)

### Step 3: Verify Installation

**Verify all tools are installed correctly**:

1. **Check Node.js and npm**:

   ```bash
   node --version
   npm --version
   ```

   You should see version numbers like `v18.x.x` or higher for Node.js and `9.x.x` or higher for npm.

2. **Check pnpm**:

   ```bash
   pnpm --version
   ```

   You should see a version number like `8.x.x` or higher.

3. **Check Git** (if you plan to clone the repository):

   ```bash
   git --version
   ```

4. **Verify project dependencies are installed**:

   ```bash
   pnpm list
   ```

   This should show all the project dependencies without errors.

5. **Test the development server**:
   ```bash
   pnpm dev
   ```
   This should start the development server and open your browser to `http://localhost:5173`.

### Step 4: Browser and Bluetooth Setup

**Supported Browsers** (with Web Bluetooth API support):

- **Google Chrome** 56+ (Recommended)
- **Microsoft Edge** 79+ (Recommended)
- **Opera** 43+

**Browser Setup**:

1. **Enable Bluetooth on your computer**:

   - **Windows**: Settings > Devices > Bluetooth & other devices > Turn on Bluetooth
   - **macOS**: System Preferences > Bluetooth > Turn Bluetooth On

2. **Browser permissions**: When you first try to connect to a Bluetooth device, the browser will ask for permission. Make sure to allow it.

3. **HTTPS requirement**: The Web Bluetooth API only works on HTTPS or localhost. This project runs on localhost during development, so this is handled automatically.

**Note**: Firefox and Safari do not currently support the Web Bluetooth API.

## 🏃‍♂️ Running the Application

### Development Mode

Start the development server:

```bash
pnpm dev
```

This will:

- Start a local development server (usually on `http://localhost:5173`)
- Enable hot-reload for real-time code changes
- Open your default browser automatically

### Build for Production

Create a production build:

```bash
pnpm build
```

### Preview Production Build

Preview the production build locally:

```bash
pnpm preview
```

### Linting

Run ESLint to check code quality:

```bash
pnpm lint
```

## ✨ Features

- **Bluetooth Low Energy (BLE) Connection**: Connect to KnitDema devices wirelessly
- **Real-time Data Visualization**: Monitor device data with interactive charts
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between themes
- **Data Export**: Export data to Excel format
- **Connection History**: Track and manage device connections
- **Clinician Settings**: Advanced configuration options

## 🔍 Troubleshooting

### Common Issues

#### "pnpm: command not found"

- **Windows**: Restart Command Prompt/PowerShell after installation
- **macOS**: Restart Terminal or run `source ~/.bashrc` or `source ~/.zshrc`
- Verify PATH is set correctly
- Try reinstalling pnpm: `npm install -g pnpm`

#### "npm: command not found"

- This usually means Node.js wasn't installed correctly
- Reinstall Node.js from [https://nodejs.org/](https://nodejs.org/)
- Restart your terminal/command prompt
- Verify with `node --version` and `npm --version`

#### "git: command not found"

- **Windows**: Install Git from [https://git-scm.com/download/win](https://git-scm.com/download/win)
- **macOS**: Run `xcode-select --install` or install via Homebrew
- Restart your terminal after installation

#### "Node.js version too old"

- Update Node.js to version 18 or higher
- Use `node --version` to check your current version

#### "Port already in use"

- The default port (5173) might be occupied
- The dev server will automatically try the next available port
- Or specify a different port: `pnpm dev --port 3000`

#### Bluetooth not working

- Ensure you're using a supported browser (Chrome, Edge, Opera)
- Enable Bluetooth on your device
- Grant necessary permissions when prompted
- Use HTTPS or localhost (required for Web Bluetooth API)

#### Installation fails on Windows

- Run Command Prompt or PowerShell as Administrator
- Clear npm cache: `npm cache clean --force`
- Try installing with: `pnpm install --no-frozen-lockfile`

#### Installation fails on macOS

- Update Xcode Command Line Tools: `xcode-select --install`
- Clear pnpm cache: `pnpm store prune`
- Try with sudo if permission issues: `sudo pnpm install -g pnpm`

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify all prerequisites are installed correctly
3. Ensure your device supports Bluetooth Low Energy
4. Try clearing browser cache and cookies
5. Check if your antivirus is blocking the application

## 📚 Additional Resources

### Official Documentation

- **Node.js**: [https://nodejs.org/en/docs/](https://nodejs.org/en/docs/)
- **pnpm**: [https://pnpm.io/](https://pnpm.io/)
- **Vite**: [https://vitejs.dev/](https://vitejs.dev/)
- **React**: [https://react.dev/](https://react.dev/)
- **TypeScript**: [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **Tailwind CSS**: [https://tailwindcss.com/](https://tailwindcss.com/)

### Web Bluetooth API

- **MDN Web Docs**: [https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- **Browser Support**: [https://caniuse.com/web-bluetooth](https://caniuse.com/web-bluetooth)

### Package Manager Comparison

- **Why pnpm?**: [https://pnpm.io/motivation](https://pnpm.io/motivation)
- **pnpm vs npm vs yarn**: [https://pnpm.io/benchmarks](https://pnpm.io/benchmarks)

### Troubleshooting Resources

- **Node.js Troubleshooting**: [https://nodejs.org/en/docs/guides/debugging-getting-started/](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- **pnpm Troubleshooting**: [https://pnpm.io/troubleshooting](https://pnpm.io/troubleshooting)
- **Web Bluetooth Troubleshooting**: [https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md](https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md)

---

## 🔧 Development Information

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Package Manager**: pnpm (required)
- **Browser Requirements**: Modern browser with Bluetooth support

For development questions or contributions, please refer to the project's issue tracker or contact the development team.
