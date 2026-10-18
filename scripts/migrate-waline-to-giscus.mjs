#!/usr/bin/env node
/**
 * One-time migration: Waline comments -> Giscus (GitHub Discussions).
 *
 * Usage:
 *   GITHUB_TOKEN=... GISCUS_CATEGORY_ID=DIC_... \
 *     node scripts/migrate-waline-to-giscus.mjs waline-comments.json
 *
 * Add --apply to actually create discussions/comments. The default is a
 * read-only dry run that prints what would happen.
 *
 * Input: a LeanCloud JSON export of the `Comment` class (an array, or an
 * object with `results`). Every old comment becomes a GitHub comment in a
 * discussion whose title contains the page path. GitHub comments are authored
 * by the token owner; the original nick/date are kept in the body, and email
 * addresses are intentionally not migrated.
 */
import fs from 'node:fs/promises'
import process from 'node:process'

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const DEFAULT_REPO = 'coooredump/coooredump.github.io'
const DEFAULT_CATEGORY = 'Announcements'
const MARKER = /<!--\s*waline:([^\s>]+)\s*-->/g

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const file = args.find((arg) => !arg.startsWith('--')) ?? 'waline-comments.json'
const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPO ?? DEFAULT_REPO
const categoryName = process.env.GISCUS_CATEGORY ?? DEFAULT_CATEGORY
const categoryIdFromEnv = process.env.GISCUS_CATEGORY_ID

if (!token) {
  console.error('Missing GITHUB_TOKEN. Create a token with Discussions read/write access.')
  process.exit(1)
}

const [owner, name] = repo.split('/')
if (!owner || !name) {
  console.error(`GITHUB_REPO must be owner/name, got: ${repo}`)
  process.exit(1)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function graphql(query, variables = {}) {
  const response = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'waline-to-giscus-migration'
    },
    body: JSON.stringify({ query, variables })
  })

  const payload = await response.json()
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.map((error) => error.message).join('; ')
    throw new Error(`GitHub GraphQL ${response.status}: ${message ?? response.statusText}`)
  }
  return payload.data
}

function readRows(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.data)) return payload.data
  throw new Error('Unsupported JSON shape: expected an array or { results: [...] }.')
}

function pathOf(value) {
  if (!value) return ''
  const raw = String(value).trim()
  if (!raw) return ''
  try {
    return new URL(raw, 'https://example.com').pathname || '/'
  } catch {
    return raw.split('?')[0].split('#')[0] || '/'
  }
}

function normalize(row, index) {
  const attributes = row?.attributes ?? row
  const url = attributes?.url ?? attributes?.pageKey ?? attributes?.path
  const content = attributes?.comment ?? attributes?.content ?? ''
  const objectId = row?.objectId ?? attributes?.objectId ?? row?.id ?? `row-${index}`

  if (!url || !content) return null
  if (String(attributes?.status ?? '').toLowerCase() === 'spam') return null

  const path = pathOf(url)
  if (!path) return null

  return {
    id: String(objectId),
    path,
    key: path !== '/' ? path.replace(/\/+$/, '') : '/',
    nick: String(attributes?.nick ?? attributes?.nickname ?? '匿名'),
    content: String(content),
    createdAt: attributes?.createdAt ?? attributes?.insertedAt ?? null,
    pid: attributes?.pid ? String(attributes.pid) : null,
    rid: attributes?.rid ? String(attributes.rid) : null
  }
}

function dateOf(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function escapeNick(value) {
  return value.replace(/([*_`[\]\\])/g, '\\$1')
}

function bodyOf(comment, parentNick) {
  const header = `> 原评论者：**${escapeNick(comment.nick)}**${
    dateOf(comment.createdAt) ? ` · ${dateOf(comment.createdAt)}` : ''
  }`
  const reply = parentNick ? `\n>\n> 回复：@${escapeNick(parentNick)}` : ''
  return `${header}${reply}\n\n${comment.content}\n\n<!-- waline:${comment.id} -->`
}

function titleOf(path) {
  return `Comments · ${path}`
}

async function getRepositoryAndCategory() {
  const data = await graphql(
    `
      query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
          discussionCategories(first: 100) {
            nodes {
              id
              name
            }
          }
        }
      }
    `,
    { owner, name }
  )

  const repository = data.repository
  if (!repository) throw new Error(`Repository not found: ${repo}`)

  const categories = repository.discussionCategories.nodes
  const category = categoryIdFromEnv
    ? categories.find((item) => item.id === categoryIdFromEnv)
    : categories.find((item) => item.name.toLowerCase() === categoryName.toLowerCase())

  if (!category) {
    throw new Error(
      `Discussion category not found. Available: ${categories.map((item) => item.name).join(', ')}`
    )
  }
  return { repositoryId: repository.id, categoryId: category.id, category: category.name }
}

async function listDiscussions(categoryId) {
  const discussions = []
  let after = null

  do {
    const data = await graphql(
      `
        query ($owner: String!, $name: String!, $categoryId: ID!, $after: String) {
          repository(owner: $owner, name: $name) {
            discussions(first: 100, after: $after, categoryId: $categoryId) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                title
                number
                url
              }
            }
          }
        }
      `,
      { owner, name, categoryId, after }
    )

    const connection = data.repository.discussions
    discussions.push(...connection.nodes)
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null
  } while (after)

  return discussions
}

async function listComments(discussionId) {
  const comments = []
  let after = null

  do {
    const data = await graphql(
      `
        query ($discussionId: ID!, $after: String) {
          node(id: $discussionId) {
            ... on Discussion {
              comments(first: 100, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  id
                  body
                }
              }
            }
          }
        }
      `,
      { discussionId, after }
    )

    const connection = data.node.comments
    comments.push(...connection.nodes)
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null
  } while (after)

  return comments
}

function markersOf(comments) {
  const markers = new Map()
  for (const comment of comments) {
    for (const match of comment.body.matchAll(MARKER)) {
      markers.set(match[1], comment.id)
    }
  }
  return markers
}

async function createDiscussion(repositoryId, categoryId, path) {
  const data = await graphql(
    `
      mutation ($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
        createDiscussion(
          input: {
            repositoryId: $repositoryId
            categoryId: $categoryId
            title: $title
            body: $body
          }
        ) {
          discussion {
            id
            title
            url
          }
        }
      }
    `,
    {
      repositoryId,
      categoryId,
      title: titleOf(path),
      body: '由 Waline 旧评论迁移。原评论者与时间保留在每条评论中。'
    }
  )
  return data.createDiscussion.discussion
}

async function createComment(discussionId, body, replyToId) {
  const input = { discussionId, body }
  if (replyToId) input.replyToId = replyToId

  const data = await graphql(
    `
      mutation ($input: AddDiscussionCommentInput!) {
        addDiscussionComment(input: $input) {
          comment {
            id
          }
        }
      }
    `,
    { input }
  )
  return data.addDiscussionComment.comment
}

async function main() {
  const raw = await fs.readFile(file, 'utf8')
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  }

  const comments = readRows(payload)
    .map(normalize)
    .filter(Boolean)
    .sort((a, b) => {
      const left = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const right = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return left - right
    })

  if (!comments.length) {
    console.error(`No comments found in ${file}`)
    process.exit(1)
  }

  const pages = new Map()
  for (const comment of comments) {
    const list = pages.get(comment.key) ?? []
    list.push(comment)
    pages.set(comment.key, list)
  }

  const { repositoryId, categoryId, category } = await getRepositoryAndCategory()
  const discussions = await listDiscussions(categoryId)

  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${comments.length} comments on ${pages.size} pages`)
  console.log(
    `Repository: ${repo}; category: ${category}; existing discussions: ${discussions.length}`
  )

  let createdDiscussions = 0
  let createdComments = 0
  let skippedComments = 0

  for (const [key, pageComments] of pages) {
    const path = pageComments[0].path
    const isRoot = path === '/'
    let discussion = discussions.find((item) =>
      isRoot ? item.title === titleOf(path) : item.title.includes(path) || item.title.includes(key)
    )

    if (!discussion) {
      if (!apply) {
        console.log(`[plan] create discussion: ${titleOf(path)} (${pageComments.length} comments)`)
        continue
      }
      discussion = await createDiscussion(repositoryId, categoryId, path)
      createdDiscussions += 1
      discussions.push(discussion)
      console.log(`[created] discussion: ${discussion.title}`)
      await sleep(350)
    }

    const existing = markersOf(await listComments(discussion.id))
    const oldIdToNewComment = new Map(existing)
    const nickById = new Map(comments.map((comment) => [comment.id, comment.nick]))

    for (const comment of pageComments) {
      if (oldIdToNewComment.has(comment.id)) {
        skippedComments += 1
        continue
      }

      const parentId = comment.pid ?? comment.rid
      const parentNick = parentId ? nickById.get(parentId) : null
      // GitHub Discussions only supports replies to top-level comments, so
      // prefer the root comment (rid) over a nested parent (pid).
      const replyToId = comment.rid
        ? oldIdToNewComment.get(comment.rid)
        : comment.pid
          ? oldIdToNewComment.get(comment.pid)
          : null
      const body = bodyOf(comment, parentNick ?? null)

      if (!apply) {
        console.log(`[plan] ${path} <- ${comment.nick}: ${comment.content.slice(0, 60)}`)
        continue
      }

      const created = await createComment(discussion.id, body, replyToId)
      oldIdToNewComment.set(comment.id, created.id)
      createdComments += 1
      await sleep(350)
    }

    console.log(
      `${apply ? '[done]' : '[plan]'} ${path}: ${pageComments.length} comments -> ${discussion.url}`
    )
  }

  console.log(
    apply
      ? `Created ${createdDiscussions} discussions and ${createdComments} comments; skipped ${skippedComments} already migrated.`
      : 'Dry run complete. Re-run with --apply to write to GitHub.'
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
