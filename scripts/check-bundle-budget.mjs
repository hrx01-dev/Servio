import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST_DIR = path.resolve('dist')
const MANIFEST_PATH = path.join(DIST_DIR, '.vite', 'manifest.json')
const REPORT_PATH = path.join(DIST_DIR, 'bundle-report.md')

const KIB = 1024
const MIB = KIB * KIB

const budgets = {
  initialRawBytes: 1.75 * MIB,
  initialGzipBytes: 475 * KIB,
  totalRawBytes: 2.25 * MIB,
  totalGzipBytes: 650 * KIB,
  maxChunkRawBytes: 800 * KIB,
  maxChunkGzipBytes: 210 * KIB,
  cssRawBytes: 240 * KIB,
}

function formatBytes(bytes) {
  if (bytes >= MIB) {
    return `${(bytes / MIB).toFixed(2)} MiB`
  }

  return `${(bytes / KIB).toFixed(1)} KiB`
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolvedPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return walkFiles(resolvedPath)
    }

    return [resolvedPath]
  })
}

function getAssetStats(filePath) {
  const source = readFileSync(filePath)
  const relativePath = path.relative(DIST_DIR, filePath).replaceAll(path.sep, '/')

  return {
    path: relativePath,
    type: path.extname(filePath).slice(1),
    rawBytes: statSync(filePath).size,
    gzipBytes: gzipSync(source).length,
  }
}

function sumAssets(assets) {
  return assets.reduce(
    (total, asset) => ({
      rawBytes: total.rawBytes + asset.rawBytes,
      gzipBytes: total.gzipBytes + asset.gzipBytes,
    }),
    { rawBytes: 0, gzipBytes: 0 },
  )
}

function addAssetPath(assetPaths, assetPath) {
  if (/\.(?:js|css)$/.test(assetPath)) {
    assetPaths.add(assetPath)
  }
}

function addManifestChunkAssets(manifest, chunkKey, assetPaths, seenChunkKeys) {
  if (seenChunkKeys.has(chunkKey)) {
    return
  }

  seenChunkKeys.add(chunkKey)

  const chunk = manifest[chunkKey]

  if (!chunk) {
    return
  }

  addAssetPath(assetPaths, chunk.file)

  for (const cssPath of chunk.css ?? []) {
    addAssetPath(assetPaths, cssPath)
  }

  for (const assetPath of chunk.assets ?? []) {
    addAssetPath(assetPaths, assetPath)
  }

  for (const importKey of chunk.imports ?? []) {
    addManifestChunkAssets(manifest, importKey, assetPaths, seenChunkKeys)
  }
}

function getInitialAssetPaths() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error('dist/.vite/manifest.json does not exist. Run `npm run build` before `npm run bundle:budget`.')
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  const assetPaths = new Set()
  const seenChunkKeys = new Set()

  for (const [chunkKey, chunk] of Object.entries(manifest)) {
    if (chunk.isEntry) {
      addManifestChunkAssets(manifest, chunkKey, assetPaths, seenChunkKeys)
    }
  }

  return assetPaths
}

function createBudgetResult(name, actualBytes, limitBytes) {
  return {
    name,
    actualBytes,
    limitBytes,
    passed: actualBytes <= limitBytes,
  }
}

function createMarkdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

if (!existsSync(DIST_DIR)) {
  console.error('dist/ does not exist. Run `npm run build` before `npm run bundle:budget`.')
  process.exit(1)
}

const allAssets = walkFiles(DIST_DIR)
  .filter((filePath) => /\.(?:js|css)$/.test(filePath))
  .map(getAssetStats)
  .sort((a, b) => b.rawBytes - a.rawBytes)

const initialAssetPaths = getInitialAssetPaths()
const initialAssets = allAssets.filter((asset) => initialAssetPaths.has(asset.path))
const jsAssets = allAssets.filter((asset) => asset.type === 'js')
const cssAssets = allAssets.filter((asset) => asset.type === 'css')

const total = sumAssets(allAssets)
const initial = sumAssets(initialAssets)
const cssTotal = sumAssets(cssAssets)

const budgetResults = [
  createBudgetResult('Initial JS/CSS raw', initial.rawBytes, budgets.initialRawBytes),
  createBudgetResult('Initial JS/CSS gzip', initial.gzipBytes, budgets.initialGzipBytes),
  createBudgetResult('Total JS/CSS raw', total.rawBytes, budgets.totalRawBytes),
  createBudgetResult('Total JS/CSS gzip', total.gzipBytes, budgets.totalGzipBytes),
  createBudgetResult('Total CSS raw', cssTotal.rawBytes, budgets.cssRawBytes),
]

const chunkResults = jsAssets.flatMap((asset) => [
  createBudgetResult(`${asset.path} raw`, asset.rawBytes, budgets.maxChunkRawBytes),
  createBudgetResult(`${asset.path} gzip`, asset.gzipBytes, budgets.maxChunkGzipBytes),
])

const failures = [...budgetResults, ...chunkResults].filter((result) => !result.passed)
const generatedAt = new Date().toISOString()

const report = [
  '# Bundle Size Report',
  '',
  `Generated at: ${generatedAt}`,
  '',
  '## Budget Summary',
  '',
  createMarkdownTable(
    ['Budget', 'Actual', 'Limit', 'Status'],
    budgetResults.map((result) => [
      result.name,
      formatBytes(result.actualBytes),
      formatBytes(result.limitBytes),
      result.passed ? 'PASS' : 'FAIL',
    ]),
  ),
  '',
  '## Largest Assets',
  '',
  createMarkdownTable(
    ['Asset', 'Raw', 'Gzip'],
    allAssets.slice(0, 20).map((asset) => [
      asset.path,
      formatBytes(asset.rawBytes),
      formatBytes(asset.gzipBytes),
    ]),
  ),
  '',
  '## Initial Assets',
  '',
  createMarkdownTable(
    ['Asset', 'Raw', 'Gzip'],
    initialAssets.map((asset) => [
      asset.path,
      formatBytes(asset.rawBytes),
      formatBytes(asset.gzipBytes),
    ]),
  ),
  '',
  failures.length > 0
    ? `Bundle budget failed with ${failures.length} violation(s).`
    : 'Bundle budget passed.',
  '',
].join('\n')

writeFileSync(REPORT_PATH, report)

console.log(report)

if (failures.length > 0) {
  process.exit(1)
}