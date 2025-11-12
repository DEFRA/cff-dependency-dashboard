import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(function () {
    return {
      repos: {
        getContent: vi.fn()
      }
    }
  })
}))
vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'github.owner') return 'owner'
      if (key === 'github.token') return 'token'
      return undefined
    })
  }
}))

const { Octokit } = await import('@octokit/rest')
const { getFileContent, getNodeVersion } = await import('../../../src/lib/github.js')

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getFileContent', () => {
  it('returns parsed JSON when content is JSON', async () => {
    const pkg = { name: 'repo' }
    const instance = new Octokit()
    instance.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from(JSON.stringify(pkg)).toString('base64') }
    })

    const result = await getFileContent('my-repo', 'package.json', instance)
    expect(instance.repos.getContent).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'my-repo',
      path: 'package.json'
    })
    expect(result).toEqual(pkg)
  })

  it('returns string when content is non-JSON', async () => {
    const text = 'plain text content'
    const instance = new Octokit()
    instance.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from(text).toString('base64') }
    })

    const result = await getFileContent('my-repo', 'README.md', instance)
    expect(result).toBe(text)
  })

  it('returns null on 404 without logging error', async () => {
    const instance = new Octokit()
    instance.repos.getContent.mockRejectedValue({ status: 404 })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await getFileContent('my-repo', 'missing.file', instance)
    expect(result).toBeNull()
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('returns null and logs on non-404 error', async () => {
    const instance = new Octokit()
    const err = new Error('boom')
    instance.repos.getContent.mockRejectedValue(err)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await getFileContent('my-repo', 'bad.file', instance)
    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in getFileContent for my-repo/bad.file:',
      err
    )
    consoleSpy.mockRestore()
  })
})

describe('getNodeVersion', () => {
  it('returns trimmed .nvmrc version when present', async () => {
    const getFile = vi.fn(async (_repo, file) => {
      if (file === '.nvmrc') return ' 14.17.0\n'
      return null
    })

    const version = await getNodeVersion('repo', getFile)
    expect(version).toBe('14.17.0')
  })

  it('returns .nvmrc value even if not semver-like', async () => {
    const getFile = vi.fn(async (_repo, file) => {
      if (file === '.nvmrc') return 'lts/*'
      return null
    })

    const version = await getNodeVersion('repo', getFile)
    expect(version).toBe('lts/*')
  })

  it('rethrows non-404 error from .nvmrc lookup', async () => {
    const error = new Error('fail')
    error.status = 500
    const getFile = vi.fn(async () => { throw error })

    await expect(getNodeVersion('repo', getFile)).rejects.toEqual(error)
  })

  it('falls back to package.json engines.node when .nvmrc missing', async () => {
    const pkg = { engines: { node: '14.15.0' } }
    const getFile = vi.fn(async (_repo, file) => {
      if (file === '.nvmrc') return null
      if (file === 'package.json') return pkg
      return null
    })

    const version = await getNodeVersion('repo', getFile)
    expect(version).toBe('14.15.0')
  })

  it('parses package.json string content and returns engines.node', async () => {
    const pkg = { engines: { node: '16.0.0' } }
    const getFile = vi.fn(async (_repo, file) => {
      if (file === '.nvmrc') return null
      if (file === 'package.json') return JSON.stringify(pkg)
      return null
    })

    const version = await getNodeVersion('repo', getFile)
    expect(version).toBe('16.0.0')
  })

  it('returns unknown when engines.node includes "x"', async () => {
    const pkg = { engines: { node: '>=14.x' } }
    const getFile = vi.fn(async (_repo, file) => {
      if (file === '.nvmrc') return null
      if (file === 'package.json') return pkg
      return null
    })

    const version = await getNodeVersion('repo', getFile)
    expect(version).toBe('unknown')
  })

  it('returns unknown when no version info available', async () => {
    const getFile = vi.fn(async (_repo, file) => null)
    const version = await getNodeVersion('repo', getFile)
    expect(version).toBe('unknown')
  })
})
