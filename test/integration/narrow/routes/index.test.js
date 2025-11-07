import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../../src/lib/summary-stats.js', () => ({
  getSummaryStats: vi.fn(),
  getNodeVersionStats: vi.fn()
}))

vi.mock('../../../../src/config/config.js', () => ({
  config: { get: vi.fn() }
}))

const { getSummaryStats, getNodeVersionStats } = await import('../../../../src/lib/summary-stats.js')
const { config } = await import('../../../../src/config/config.js')
const { index } = await import('../../../../src/routes/index.js')

describe('index route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.get.mockImplementation((key) => {
      if (key === 'github.repos') return 'repo1,repo2'
      return undefined
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

    const request = {}
    const viewMock = vi.fn()
    const h = { view: viewMock }

    await index.handler(request, h)

    expect(getNodeVersionStats).toHaveBeenCalledWith(repos)
    expect(getSummaryStats).toHaveBeenCalledWith(repos)
    expect(viewMock).toHaveBeenCalledTimes(1)
    const [template, ctx] = viewMock.mock.calls[0]
    expect(template).toBe('index.njk')
    expect(ctx.repos).toEqual(repos)
    expect(ctx.stats).toBe(fakeStats)
    expect(ctx.nodeResults).toBe(fakeNode)
  })

  it('renders index view with empty repos array when no github.repos configured', async () => {
    config.get.mockImplementation(() => undefined)
    const fakeStats = {}
    const fakeNode = {}

    getSummaryStats.mockResolvedValue(fakeStats)
    getNodeVersionStats.mockResolvedValue(fakeNode)

    const request = {}
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

  it('propagates errors from summary-stats', async () => {
    getSummaryStats.mockRejectedValue(new Error('boom'))
    getNodeVersionStats.mockResolvedValue({})

    const request = {}
    const h = { view: vi.fn() }

    await expect(index.handler(request, h)).rejects.toThrow('boom')
  })
})
