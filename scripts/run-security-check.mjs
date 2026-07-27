import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT_DIR = path.resolve('.')
const REPORT_DIR = path.join(ROOT_DIR, 'security-reports')
const REPORT_MD_PATH = path.join(REPORT_DIR, 'security-report.md')
const REPORT_JSON_PATH = path.join(REPORT_DIR, 'security-report.json')

// Directories and file extensions to ignore during file scanning
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  'security-reports',
  '.git',
  '.firebase',
  '.vercel',
  '.gemini',
  'coverage',
  '.vscode',
  '.idea',
])

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.webm', '.mp3',
  '.pdf', '.zip', '.gz', '.tar', '.tgz',
  '.lock', // package-lock.json has integrity hashes that can trigger false positives
])

const IGNORED_FILES = new Set([
  'scripts/run-security-check.mjs',
  'scripts\\run-security-check.mjs',
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  'package-lock.json',
])

const HIGH_RISK_SECRET_PATTERNS = [
  {
    name: 'Private Key',
    regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED )?PRIVATE KEY-----/,
    severity: 'CRITICAL',
    description: 'Hardcoded asymmetric private key detected.',
  },
  {
    name: 'AWS Access Key ID',
    regex: /\b(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/,
    severity: 'CRITICAL',
    description: 'AWS Access Key ID found in source code.',
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,255}\b|\bgithub_pat_[a-zA-Z0-9_]{82}\b/,
    severity: 'CRITICAL',
    description: 'GitHub personal access token or OAuth token detected.',
  },
  {
    name: 'Live API Secret Key (Stripe/Razorpay)',
    regex: /\b(?:sk_live_|rzp_live_)[a-zA-Z0-9]{14,}\b/,
    severity: 'CRITICAL',
    description: 'Live payment provider secret key detected.',
  },
  {
    name: 'Slack Token',
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/,
    severity: 'HIGH',
    description: 'Slack bot or user authentication token detected.',
  },
]

const SAST_PATTERNS = [
  {
    name: 'Dangerous Eval',
    regex: /\beval\s*\(/,
    severity: 'HIGH',
    description: 'Use of eval() can lead to arbitrary code execution vulnerabilities.',
    extensions: ['.ts', '.tsx', '.js', '.mjs', '.jsx'],
  },
  {
    name: 'Unsanitized dangerouslySetInnerHTML',
    regex: /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html\s*:/,
    severity: 'MODERATE',
    description: 'Direct use of dangerouslySetInnerHTML without verified sanitization increases XSS risk.',
    extensions: ['.tsx', '.jsx'],
  },
  {
    name: 'Document Write',
    regex: /\bdocument\.write\s*\(/,
    severity: 'MODERATE',
    description: 'Use of document.write() can lead to XSS vulnerabilities and performance issues.',
    extensions: ['.ts', '.tsx', '.js', '.mjs', '.jsx'],
  },
  {
    name: 'Insecure HTTP URL',
    regex: /http:\/\/(?!localhost|127\.0\.0\.1|w3\.org|schema\.org|0\.0\.0\.0)/,
    severity: 'LOW',
    description: 'Insecure HTTP endpoint detected; prefer HTTPS for external network calls.',
    extensions: ['.ts', '.tsx', '.js', '.mjs', '.jsx', '.html'],
  },
]

function walkFiles(dir) {
  const results = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        results.push(...walkFiles(path.join(dir, entry.name)))
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      const relPath = path.relative(ROOT_DIR, path.join(dir, entry.name)).replaceAll('\\', '/')
      if (!IGNORED_EXTENSIONS.has(ext) && !IGNORED_FILES.has(entry.name) && !IGNORED_FILES.has(relPath)) {
        results.push(path.join(dir, entry.name))
      }
    }
  }

  return results
}

function runDependencyAudit() {
  console.log('📦 Running dependency vulnerability scan (npm audit)...')
  const result = {
    vulnerabilities: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      total: 0,
    },
    advisories: [],
    error: null,
  }

  try {
    const output = execSync('npm audit --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
    parseAuditOutput(output, result)
  } catch (err) {
    // npm audit returns exit code 1 if vulnerabilities are found
    if (err.stdout) {
      parseAuditOutput(err.stdout, result)
    } else {
      result.error = err.message || 'Failed to execute npm audit'
    }
  }

  return result
}

function parseAuditOutput(jsonStr, result) {
  try {
    const data = JSON.parse(jsonStr)
    if (data.metadata && data.metadata.vulnerabilities) {
      const v = data.metadata.vulnerabilities
      result.vulnerabilities = {
        info: v.info || 0,
        low: v.low || 0,
        moderate: v.moderate || 0,
        high: v.high || 0,
        critical: v.critical || 0,
        total: v.total || 0,
      }
    }

    if (data.vulnerabilities) {
      for (const [pkgName, vuln] of Object.entries(data.vulnerabilities)) {
        if (vuln.severity === 'high' || vuln.severity === 'critical' || vuln.severity === 'moderate') {
          result.advisories.push({
            package: pkgName,
            severity: vuln.severity.toUpperCase(),
            via: Array.isArray(vuln.via) ? vuln.via.map((item) => typeof item === 'string' ? item : item.title || item.name).join(', ') : 'Unknown',
            fixAvailable: typeof vuln.fixAvailable === 'boolean' ? vuln.fixAvailable : Boolean(vuln.fixAvailable),
          })
        }
      }
    }
  } catch (e) {
    result.error = 'Failed to parse npm audit JSON output'
  }
}

function runSecretAndSastScans(files) {
  console.log(`🔍 Scanning ${files.length} files for secrets and security patterns...`)
  const secretFindings = []
  const sastFindings = []

  for (const filePath of files) {
    const relPath = path.relative(ROOT_DIR, filePath).replaceAll('\\', '/')
    const ext = path.extname(filePath).toLowerCase()

    let content = ''
    try {
      content = readFileSync(filePath, 'utf8')
    } catch {
      continue // skip unreadable or binary files
    }

    const lines = content.split(/\r?\n/)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      // Skip overly long lines (minified code or bundles)
      if (line.length > 500) continue

      // Secret checks
      for (const rule of HIGH_RISK_SECRET_PATTERNS) {
        if (rule.regex.test(line)) {
          secretFindings.push({
            file: relPath,
            line: lineNum,
            type: rule.name,
            severity: rule.severity,
            description: rule.description,
            snippet: line.trim().substring(0, 80),
          })
        }
      }

      // SAST checks
      for (const rule of SAST_PATTERNS) {
        if (!rule.extensions || rule.extensions.includes(ext)) {
          if (rule.regex.test(line)) {
            sastFindings.push({
              file: relPath,
              line: lineNum,
              type: rule.name,
              severity: rule.severity,
              description: rule.description,
              snippet: line.trim().substring(0, 80),
            })
          }
        }
      }
    }
  }

  return { secretFindings, sastFindings }
}

function runConfigurationChecks() {
  console.log('⚙️ Verifying repository configuration security...')
  const configFindings = []

  // Check firestore.rules for open access
  const firestoreRulesPath = path.join(ROOT_DIR, 'firestore.rules')
  if (existsSync(firestoreRulesPath)) {
    try {
      const rulesContent = readFileSync(firestoreRulesPath, 'utf8')
      if (/allow\s+read,\s*write\s*:\s*if\s+true/.test(rulesContent)) {
        configFindings.push({
          file: 'firestore.rules',
          severity: 'HIGH',
          type: 'Insecure Database Rules',
          description: 'Firestore security rules allow unauthenticated public read/write access.',
        })
      }
    } catch {
      // ignore
    }
  }

  // Check gitignore for .env protection
  const gitignorePath = path.join(ROOT_DIR, '.gitignore')
  if (existsSync(gitignorePath)) {
    try {
      const gitignoreContent = readFileSync(gitignorePath, 'utf8')
      if (!gitignoreContent.includes('.env')) {
        configFindings.push({
          file: '.gitignore',
          severity: 'MODERATE',
          type: 'Missing Environment Variable Exclusion',
          description: '.gitignore does not explicitly exclude .env files.',
        })
      }
    } catch {
      // ignore
    }
  }

  // Check if real .env files are tracked in git
  try {
    const trackedEnvFiles = execSync('git ls-files .env*', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
    if (trackedEnvFiles) {
      for (const file of trackedEnvFiles.split(/\r?\n/)) {
        if (file && !file.endsWith('.example')) {
          configFindings.push({
            file,
            severity: 'CRITICAL',
            type: 'Tracked Environment File',
            description: `Environment variable file (${file}) is tracked by git and may expose secrets.`,
          })
        }
      }
    }
  } catch {
    // ignore git command error if outside git repo
  }

  return configFindings
}

function generateMarkdownReport(report) {
  const { timestamp, summary, dependencyAudit, secretFindings, sastFindings, configFindings } = report

  const statusEmoji = summary.status === 'PASS' ? '✅' : summary.status === 'WARNING' ? '⚠️' : '❌'
  
  let md = `# 🛡️ Repository Security Audit Report\n\n`
  md += `**Timestamp:** ${timestamp}  \n`
  md += `**Overall Status:** ${statusEmoji} **${summary.status}**  \n\n`

  md += `## 📊 Executive Summary\n\n`
  md += `| Category | Critical | High | Moderate | Low | Total |\n`
  md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`
  md += `| **Dependencies (npm audit)** | ${dependencyAudit.vulnerabilities.critical} | ${dependencyAudit.vulnerabilities.high} | ${dependencyAudit.vulnerabilities.moderate} | ${dependencyAudit.vulnerabilities.low} | ${dependencyAudit.vulnerabilities.total} |\n`

  const countBySev = (items, sev) => items.filter(i => i.severity === sev).length
  md += `| **Secret Scanning** | ${countBySev(secretFindings, 'CRITICAL')} | ${countBySev(secretFindings, 'HIGH')} | ${countBySev(secretFindings, 'MODERATE')} | ${countBySev(secretFindings, 'LOW')} | ${secretFindings.length} |\n`
  md += `| **Static Code Analysis (SAST)** | ${countBySev(sastFindings, 'CRITICAL')} | ${countBySev(sastFindings, 'HIGH')} | ${countBySev(sastFindings, 'MODERATE')} | ${countBySev(sastFindings, 'LOW')} | ${sastFindings.length} |\n`
  md += `| **Configuration Checks** | ${countBySev(configFindings, 'CRITICAL')} | ${countBySev(configFindings, 'HIGH')} | ${countBySev(configFindings, 'MODERATE')} | ${countBySev(configFindings, 'LOW')} | ${configFindings.length} |\n\n`

  md += `---\n\n`

  // Section 1: Dependencies
  md += `## 📦 1. Dependency Vulnerabilities\n\n`
  if (dependencyAudit.vulnerabilities.total === 0) {
    md += `✅ No known dependency vulnerabilities detected.\n\n`
  } else {
    md += `Found **${dependencyAudit.vulnerabilities.total}** vulnerabilities in dependencies.\n\n`
    if (dependencyAudit.advisories.length > 0) {
      md += `| Package | Severity | Via / Advisory | Fix Available |\n`
      md += `| :--- | :---: | :--- | :---: |\n`
      for (const adv of dependencyAudit.advisories) {
        md += `| \`${adv.package}\` | **${adv.severity}** | ${adv.via} | ${adv.fixAvailable ? '✅ Yes' : '❌ No'} |\n`
      }
      md += `\n`
    }
  }

  // Section 2: Secrets
  md += `## 🔑 2. Secret & Credential Scanning\n\n`
  if (secretFindings.length === 0) {
    md += `✅ No exposed secrets or hardcoded credentials detected.\n\n`
  } else {
    md += `⚠️ Found **${secretFindings.length}** potential credential disclosures:\n\n`
    md += `| File | Line | Type | Severity | Description |\n`
    md += `| :--- | :---: | :--- | :---: | :--- |\n`
    for (const item of secretFindings) {
      md += `| [${item.file}](file:///${item.file}#L${item.line}) | ${item.line} | **${item.type}** | ${item.severity} | ${item.description} |\n`
    }
    md += `\n`
  }

  // Section 3: SAST
  md += `## 🔬 3. Static Code Analysis (SAST)\n\n`
  if (sastFindings.length === 0) {
    md += `✅ No high-risk static code patterns detected.\n\n`
  } else {
    md += `Found **${sastFindings.length}** code pattern notices:\n\n`
    md += `| File | Line | Pattern | Severity | Description |\n`
    md += `| :--- | :---: | :--- | :---: | :--- |\n`
    for (const item of sastFindings) {
      md += `| [${item.file}](file:///${item.file}#L${item.line}) | ${item.line} | **${item.type}** | ${item.severity} | ${item.description} |\n`
    }
    md += `\n`
  }

  // Section 4: Config
  md += `## ⚙️ 4. Configuration Checks\n\n`
  if (configFindings.length === 0) {
    md += `✅ All security configurations passed checks.\n\n`
  } else {
    md += `Found **${configFindings.length}** configuration notices:\n\n`
    md += `| File | Severity | Issue | Description |\n`
    md += `| :--- | :---: | :--- | :--- |\n`
    for (const item of configFindings) {
      md += `| \`${item.file}\` | **${item.severity}** | ${item.type} | ${item.description} |\n`
    }
    md += `\n`
  }

  md += `---\n*Generated automatically by Servio Security Automation.* \n`
  return md
}

async function main() {
  console.log('🚀 Starting repository security audit...\n')
  const startTime = Date.now()

  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true })
  }

  const dependencyAudit = runDependencyAudit()
  const allFiles = walkFiles(ROOT_DIR)
  const { secretFindings, sastFindings } = runSecretAndSastScans(allFiles)
  const configFindings = runConfigurationChecks()

  // Determine overall status
  let status = 'PASS'
  const criticalCount = dependencyAudit.vulnerabilities.critical +
    secretFindings.filter(f => f.severity === 'CRITICAL').length +
    sastFindings.filter(f => f.severity === 'CRITICAL').length +
    configFindings.filter(f => f.severity === 'CRITICAL').length

  const highCount = dependencyAudit.vulnerabilities.high +
    secretFindings.filter(f => f.severity === 'HIGH').length +
    sastFindings.filter(f => f.severity === 'HIGH').length +
    configFindings.filter(f => f.severity === 'HIGH').length

  const modCount = dependencyAudit.vulnerabilities.moderate +
    secretFindings.filter(f => f.severity === 'MODERATE').length +
    sastFindings.filter(f => f.severity === 'MODERATE').length +
    configFindings.filter(f => f.severity === 'MODERATE').length

  if (criticalCount > 0 || highCount > 0) {
    status = 'FAIL'
  } else if (modCount > 0 || dependencyAudit.vulnerabilities.low > 0) {
    status = 'WARNING'
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      status,
      durationMs: Date.now() - startTime,
      totalIssues: criticalCount + highCount + modCount + dependencyAudit.vulnerabilities.low,
      critical: criticalCount,
      high: highCount,
      moderate: modCount,
    },
    dependencyAudit,
    secretFindings,
    sastFindings,
    configFindings,
  }

  // Save JSON report
  writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2), 'utf8')
  console.log(`\n💾 Saved JSON report to: ${REPORT_JSON_PATH}`)

  // Save Markdown report
  const markdownContent = generateMarkdownReport(report)
  writeFileSync(REPORT_MD_PATH, markdownContent, 'utf8')
  console.log(`💾 Saved Markdown report to: ${REPORT_MD_PATH}\n`)

  // Output to console
  console.log(markdownContent)

  // If running in GitHub Actions, append to step summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdownContent + '\n', 'utf8')
      console.log('📋 Appended report to GitHub Step Summary.')
    } catch (e) {
      console.error('Failed to write to GITHUB_STEP_SUMMARY:', e)
    }
  }

  // Exit code logic
  if (status === 'FAIL') {
    console.error(`\n❌ Security check FAILED with ${criticalCount} critical and ${highCount} high severity issues.`)
    process.exit(1)
  } else {
    console.log(`\n✅ Security check completed with status: ${status}`)
    process.exit(0)
  }
}

main()
