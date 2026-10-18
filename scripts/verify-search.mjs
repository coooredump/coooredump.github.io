#!/usr/bin/env node
/**
 * Search regression checks against the built Pagefind index.
 *
 * Run after `npm run build` (also wired to the npm `postbuild` lifecycle).
 * It loads dist/pagefind/pagefind.js in Node with a small fetch shim, so no
 * browser or dev server is needed.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const distDir = path.resolve('dist')
const pagefindDir = path.join(distDir, 'pagefind')
const pagefindEntry = path.join(pagefindDir, 'pagefind.js')

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

if (!(await exists(pagefindEntry))) {
  console.log('[verify-search] dist/pagefind not found; Pagefind is disabled, skipping.')
  process.exit(0)
}

const entry = JSON.parse(await fs.readFile(path.join(pagefindDir, 'pagefind-entry.json'), 'utf8'))
const languages = Object.keys(entry.languages ?? {})
const language = languages[0]
assert.ok(language, '[verify-search] no Pagefind language index was built')
const pageCount = entry.languages[language].page_count
assert.ok(
  pageCount >= 140 && pageCount <= 170,
  `[verify-search] expected 140-170 indexed pages, got ${pageCount}`
)
console.log(`[verify-search] indexed pages: ${pageCount} (${language})`)

// Pagefind's browser bundle loads its assets through fetch(). Map /pagefind/*
// to the built directory so the same bundle can run under Node.
globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url
  if (url.startsWith('/pagefind/')) {
    const relative = url.slice('/pagefind/'.length).split('?')[0].split('#')[0]
    return new Response(await fs.readFile(path.join(pagefindDir, relative)), { status: 200 })
  }
  return new Response('not found', { status: 404 })
}

const pagefind = await import(pathToFileURL(pagefindEntry).href)
await pagefind.options({ basePath: '/pagefind/', baseUrl: '/' })
await pagefind.init()

const normalize = (value) =>
  (value ?? '')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const isCJK = (value) => /[\u3400-\u9fff]/.test(value)
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function haystack(data) {
  return [
    data.raw_content ?? data.content ?? '',
    data.meta?.title ?? '',
    data.meta?.description ?? '',
    ...(data.filters?.tag ?? [])
  ].join(' ')
}

function exactMatch(query, text) {
  if (isCJK(query)) {
    return normalize(text).replace(/\s+/g, '').includes(normalize(query).replace(/\s+/g, ''))
  }
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(normalize(query))}([^\\p{L}\\p{N}]|$)`,
    'iu'
  ).test(normalize(text))
}

async function search(term, options) {
  return pagefind.search(term, options)
}

async function dataOf(searchResult) {
  return Promise.all(searchResult.results.map((result) => result.data()))
}

// --- Header/footer/list-page noise must be gone ---------------------------
const blogResults = await search('Blog')
assert.ok(
  blogResults.results.length < 30,
  `[verify-search] "Blog" should not match the whole site, got ${blogResults.results.length}`
)
console.log(`[verify-search] "Blog" results: ${blogResults.results.length}`)

const searchResults = await search('Search')
assert.ok(
  searchResults.results.length < 30,
  `[verify-search] "Search" should not match the whole site, got ${searchResults.results.length}`
)
console.log(`[verify-search] "Search" results: ${searchResults.results.length}`)

const noiseResults = await search('comments')
assert.ok(
  noiseResults.results.length < 20,
  `[verify-search] page chrome like "comments" is still indexed: ${noiseResults.results.length}`
)
console.log(`[verify-search] "comments" results: ${noiseResults.results.length}`)

// --- List/tag pages must not rank above articles ---------------------------
const travel = await search('旅游')
assert.ok(travel.results.length > 0, '[verify-search] "旅游" returned no results')
const travelTop = await dataOf({ results: travel.results.slice(0, 5) })
for (const data of travelTop) {
  assert.ok(
    !data.url.startsWith('/tags/'),
    `[verify-search] tag page leaked into "旅游" results: ${data.url}`
  )
  assert.ok(
    !/^\/blog\/\d+\/?$/.test(data.url),
    `[verify-search] paginated blog list leaked into "旅游" results: ${data.url}`
  )
}
console.log(`[verify-search] "旅游" results: ${travel.results.length}, no tag/list pages in top 5`)

// --- Exact phrase checks ---------------------------------------------------
const dali = await search('大理')
assert.ok(dali.results.length > 0, '[verify-search] "大理" returned no results')
const daliData = await dataOf({ results: dali.results.slice(0, 3) })
assert.ok(
  daliData[0]?.url.includes('/blog/tourism/dali_2026-10-03/'),
  `[verify-search] expected the Dali post first, got ${daliData[0]?.url}`
)
assert.ok(
  !haystack(daliData[0]).includes(
    "Core's ink Blog Archives Projects Love Docs About Search Dark Theme Menu"
  ),
  '[verify-search] site navigation is still indexed inside the Dali post'
)
console.log('[verify-search] "大理" top result and body scope are correct')

const yunnan = await search('云南')
const yunnanData = await dataOf(yunnan)
const yunnanExact = yunnanData.filter((data) => exactMatch('云南', haystack(data)))
assert.equal(
  yunnanExact.length,
  0,
  `[verify-search] exact "云南" should be empty, got ${yunnanExact.length}`
)
console.log(`[verify-search] exact "云南": 0 of ${yunnan.results.length} segmented matches`)

const os = await search('操作系统')
const osData = await dataOf(os)
const osExact = osData.filter((data) => exactMatch('操作系统', haystack(data)))
assert.ok(osExact.length > 0, '[verify-search] exact "操作系统" returned no results')
assert.ok(
  osExact[0].url.includes('/blog/recruitment/2025-os/'),
  `[verify-search] expected the OS post first for exact "操作系统", got ${osExact[0].url}`
)
console.log(`[verify-search] exact "操作系统": ${osExact.length} of ${os.results.length} matches`)

// --- Tag filter sidebar ----------------------------------------------------
const filters = await pagefind.filters()
assert.ok(filters.tag?.['旅游'], '[verify-search] missing tag=旅游 filter')
assert.deepEqual(
  Object.keys(filters),
  ['tag'],
  `[verify-search] expected only the Tag filter, got ${Object.keys(filters).join(', ')}`
)
console.log(
  `[verify-search] filters: ${Object.keys(filters).join(', ')}; tags: ${Object.keys(filters.tag ?? {}).length}`
)

console.log('[verify-search] all checks passed')
