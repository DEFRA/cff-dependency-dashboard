import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../../src/config/config.js', () => ({
  config: { get: vi.fn(() => 'DEFRA') }
}))

vi.mock('../../../../src/lib/repo-source.js', () => ({
  getDefaultRepos: vi.fn(() => ['flood-a', 'flood-b']),
  getCustomReposFromQuery: vi.fn(() => ['custom-a'])
}))

vi.mock('../../../../src/lib/github.js', () => ({
  listPublicRepos: vi.fn()
}))

const { config } = await import('../../../../src/config/config.js')
const { getDefaultRepos, getCustomReposFromQuery } = await import('../../../../src/lib/repo-source.js')
const { listPublicRepos } = await import('../../../../src/lib/github.js')
const { adminRepos } = await import('../../../../src/routes/admin-repos.js')

describe('adminRepos route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.get.mockReturnValue('DEFRA')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders admin page with default and available repos', async () => {
    listPublicRepos.mockResolvedValue(['repo-x', 'repo-y'])

    const request = { query: { repos: 'custom-a' } }
    const viewMock = vi.fn()
    const h = { view: viewMock }

    await adminRepos.handler(request, h)

    expect(getDefaultRepos).toHaveBeenCalledTimes(1)
    expect(getCustomReposFromQuery).toHaveBeenCalledWith({ repos: 'custom-a' })
    expect(listPublicRepos).toHaveBeenCalledWith('DEFRA')

    const [template, ctx] = viewMock.mock.calls[0]
    expect(template).toBe('admin-repos.njk')
    expect(ctx.defaultRepos).toEqual(['flood-a', 'flood-b'])
    expect(ctx.currentCustomRepos).toEqual(['custom-a'])
    expect(ctx.availableRepos).toEqual(['repo-x', 'repo-y'])
    expect(ctx.loadError).toBe('')
    expect(ctx.githubOwner).toBe('DEFRA')
  })

  it('renders fallback message when public repo lookup fails', async () => {
    listPublicRepos.mockRejectedValue(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const request = { query: {} }
    const viewMock = vi.fn()
    const h = { view: viewMock }

    await adminRepos.handler(request, h)

    const [, ctx] = viewMock.mock.calls[0]
    expect(ctx.availableRepos).toEqual([])
    expect(ctx.loadError).toContain('Could not load public repositories from GitHub')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
