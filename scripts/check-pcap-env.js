#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const os = require("os")
const { execSync } = require("child_process")

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
}

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

function getCommandVersion(command) {
  try {
    const output = execSync(`${command} --version`, { encoding: "utf-8" })
    return output.split("\n")[0]
  } catch {
    return "unknown"
  }
}

async function checkEnvironment() {
  log("\n═══════════════════════════════════════════════════════════════", "blue")
  log("       Network Traffic Analyzer - Environment Check", "bold")
  log("═══════════════════════════════════════════════════════════════\n", "blue")

  let allGood = true

  // Check Node.js
  log("1️⃣  Node.js Environment", "bold")
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.split(".")[0].substring(1))
  if (nodeMajor >= 16) {
    log(`   ✓ Node.js ${nodeVersion}`, "green")
  } else {
    log(`   ✗ Node.js ${nodeVersion} (need v16+)`, "red")
    allGood = false
  }

  // Check npm
  const npmVersion = execSync("npm --version", { encoding: "utf-8" }).trim()
  log(`   ✓ npm ${npmVersion}`, "green")

  // Check OS
  const platform = os.platform()
  log(`   ✓ OS: ${platform.toUpperCase()}`, "green")

  // Check pcap library
  log("\n2️⃣  Libpcap System Library", "bold")
  if (checkCommand("pcap-config")) {
    const version = getCommandVersion("pcap-config")
    log(`   ✓ libpcap installed: ${version}`, "green")
  } else {
    log(`   ✗ libpcap NOT installed`, "red")
    log(`     Install with:`, "yellow")
    if (platform === "darwin") {
      log(`       brew install libpcap`, "yellow")
    } else if (platform === "linux") {
      log(`       sudo apt-get install libpcap-dev`, "yellow")
    } else if (platform === "win32") {
      log(`       Download from: https://npcap.com/`, "yellow")
    }
    allGood = false
  }

  // Check npm packages
  log("\n3️⃣  npm Dependencies", "bold")
  const packageJson = require(path.join(process.cwd(), "package.json"))

  const requiredPackages = ["next", "react", "react-dom"]
  for (const pkg of requiredPackages) {
    if (packageJson.dependencies[pkg]) {
      log(`   ✓ ${pkg}@${packageJson.dependencies[pkg]}`, "green")
    } else {
      log(`   ✗ ${pkg} NOT found`, "red")
      allGood = false
    }
  }

  // Optional: check if pcap is installed
  try {
    require("pcap")
    log(`   ✓ pcap npm package installed`, "green")
  } catch {
    log(`   ⚠ pcap npm package not installed (will fallback to mock)`, "yellow")
  }

  // Check network interfaces
  log("\n4️⃣  Network Interfaces", "bold")
  const interfaces = os.networkInterfaces()
  const activeInterfaces = Object.entries(interfaces)
    .filter(([_, addrs]) => addrs.some((a) => !a.internal && a.family === "IPv4"))
    .map(([name, _]) => name)

  if (activeInterfaces.length > 0) {
    log(`   ✓ Found ${activeInterfaces.length} active interface(s):`, "green")
    activeInterfaces.forEach((iface) => {
      log(`     - ${iface}`, "green")
    })
  } else {
    log(`   ⚠ No active network interfaces found`, "yellow")
  }

  // Check permissions
  log("\n5️⃣  System Permissions", "bold")
  if (platform === "darwin" || platform === "linux") {
    const isRoot = process.getuid ? process.getuid() === 0 : false
    if (isRoot) {
      log(`   ✓ Running with root privileges`, "green")
    } else {
      log(`   ⚠ Not running as root (may need sudo for real packet capture)`, "yellow")
      log(`     Run with: sudo npm run dev`, "yellow")
    }
  } else if (platform === "win32") {
    log(`   ℹ Windows: Run terminal as Administrator for packet capture`, "blue")
  }

  // Check project structure
  log("\n6️⃣  Project Structure", "bold")
  const requiredFiles = [
    "app/api/packets/route.ts",
    "lib/pcap-handler.ts",
    "lib/packet-capture-hybrid.ts",
    "package.json",
  ]

  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      log(`   ✓ ${file}`, "green")
    } else {
      log(`   ✗ ${file} NOT found`, "red")
      allGood = false
    }
  }

  // Summary
  log("\n" + "═".repeat(63), "blue")
  if (allGood) {
    log("✓ Environment is ready for packet capture!", "green")
    log("\nNext steps:", "bold")
    log("1. Install npm dependencies: npm install", "yellow")
    log("2. Start dev server: npm run dev (or sudo npm run dev)", "yellow")
    log("3. Open: http://localhost:3000", "yellow")
  } else {
    log("⚠ Some requirements missing", "yellow")
    log("\nResolve issues above and run this check again:", "yellow")
    log("node scripts/check-pcap-env.js", "yellow")
  }
  log("═".repeat(63) + "\n", "blue")

  process.exit(allGood ? 0 : 1)
}

checkEnvironment().catch((error) => {
  log(`\nError: ${error.message}`, "red")
  process.exit(1)
})
