import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../../src/lib/summary-stats.js', () => ({
  getSummaryStats: vi.fn(),
  getNodeVersionStats: vi.fn()
}))

vi.mock('../../../../src/lib/repo-source.js', () => ({
  getResolvedRepos: vi.fn()
}))

const { getSummaryStats, getNodeVersionStats } = await import('../../../../src/lib/summary-stats.js')
const { getResolvedRepos } = await import('../../../../src/lib/repo-source.js')
const { index } = await import('../../../../src/routes/index.js')

describe('index route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getResolvedRepos.mockReturnValue({
      repos: ['repo1', 'repo2'],
      isCustomMode: false,
      repoQueryString: ''
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders index view with repos, stats and nodeResults when repos present', async () => {
    const repos = ['repo1', 'repo2']
    const fakeStats = { repo1: { deps: 1 } }
    const fakeNode = { node: 'v18' }

    getSummaryStats.mockResolvedValue(fakeStats)
    getNodeVersionStats.mockResolvedValue(fakeNode)

    const request = { query: {} }
    const viewMock = vi.fn()
    const h = { view: viewMock }

    await index.handler(request, h)

    expect(getResolvedRepos).toHaveBeenCalledWith({})
    expect(getNodeVersionStats).toHaveBeenCalledWith(repos)
    expect(getSummaryStats).toHaveBeenCalledWith(repos)
    expect(viewMock).toHaveBeenCalledTimes(1)
    const [template, ctx] = viewMock.mock.calls[0]
    expect(template).toBe('index.njk')
    expect(ctx.repos).toEqual(repos)
    expect(ctx.stats).toBe(fakeStats)
    expect(ctx.nodeResults).toBe(fakeNode)
    expect(ctx.isCustomMode).toBe(false)
    expect(ctx.repoQueryString).toBe('')
  })

  it('renders index view with empty repos array when resolver returns none', async () => {
    getResolvedRepos.mockReturnValue({
      repos: [],
      isCustomMode: false,
      repoQueryString: ''
    })

    const fakeStats = {}
    const fakeNode = {}

    getSummaryStats.mockResolvedValue(fakeStats)
    getNodeVersionStats.mockResolvedValue(fakeNode)

    const request = { query: {} }
    const viewMock = vi.fn()
    const h = { view: viewMock }

    await index.handler(request, h)

    expect(getNodeVersionStats).toHaveBeenCalledWith([])
    expect(getSummaryStats).toHaveBeenCalledWith([])
    const [, ctx] = viewMock.mock.calls[0]
    expect(ctx.repos).toEqual([])
    expect(ctx.stats).toBe(fakeStats)
    expect(ctx.nodeResults).toBe(fakeNode)
  })

  it('passes custom mode metadata to the view when custom repos are selected', async () => {
    getResolvedRepos.mockReturnValue({
      repos: ['custom-a', 'custom-b'],
      isCustomMode: true,
      repoQueryString: 'repos=custom-a%2Ccustom-b'
    })

    getSummaryStats.mockResolvedValue({})
    getNodeVersionStats.mockResolvedValue([])

    const request = { query: { repos: 'custom-a,custom-b' } }
    const viewMock = vi.fn()
    const h = { view: viewMock }

    await index.handler(request, h)

    const [, ctx] = viewMock.mock.calls[0]
    expect(ctx.isCustomMode).toBe(true)
    expect(ctx.repoQueryString).toBe('repos=custom-a%2Ccustom-b')
  })

  it('propagates errors from summary-stats', async () => {
    getSummaryStats.mockRejectedValue(new Error('boom'))
    getNodeVersionStats.mockResolvedValue({})

    const request = {}
    const h = { view: vi.fn() }

    await expect(index.handler(request, h)).rejects.toThrow('boom')
  })
})
