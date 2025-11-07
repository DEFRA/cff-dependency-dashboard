import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../../src/lib/dependency-updates.js', () => ({
  getRepoDependencyUpdates: vi.fn()
}))

vi.mock('../../../../src/lib/summary-stats.js', () => ({
  getNodeVersionStats: vi.fn()
}))

vi.mock('../../../../src/lib/sort-deps.js', () => ({
  sortDeps: vi.fn()
}))

vi.mock('../../../../src/config/config.js', () => ({
  config: { get: vi.fn() }
}))

const { getRepoDependencyUpdates } = await import('../../../../src/lib/dependency-updates.js')
const { getNodeVersionStats } = await import('../../../../src/lib/summary-stats.js')
const { sortDeps } = await import('../../../../src/lib/sort-deps.js')
const { config } = await import('../../../../src/config/config.js')

const { htmlDashboard } = await import('../../../../src/routes/dashboard.js')

describe('htmlDashboard route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // default repos returned from config
    config.get.mockImplementation((key) => {
      if (key === 'github.repos') return 'repo1,repo2'
      return undefined
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders dashboard with data for a specific repo', async () => {
    const fakeRuntime = [{ name: 'a' }]
    const fakeDev = [{ name: 'b' }]
    const repos = ['repo1', 'repo2']
    const nodeResults = { some: 'nodeStats' }

    getRepoDependencyUpdates.mockResolvedValue({ runtime: fakeRuntime, dev: fakeDev })
    sortDeps.mockImplementation((arr) => arr)
    getNodeVersionStats.mockResolvedValue(nodeResults)

    const request = {
      params: { repo: 'repo1' },
      query: { sort: 'name', dir: 'desc' }
    }

    const viewMock = vi.fn()
    const codeMock = vi.fn()

    const h = {
      view: viewMock,
      response: vi.fn(() => ({
        code: codeMock
      }))
    }

    await htmlDashboard.handler(request, h)

    expect(getRepoDependencyUpdates).toHaveBeenCalledWith('repo1')
    expect(getNodeVersionStats).toHaveBeenCalledWith(repos)
    expect(sortDeps).toHaveBeenCalledWith(fakeRuntime, 'name', 'desc')
    expect(sortDeps).toHaveBeenCalledWith(fakeDev, 'name', 'desc')

    expect(viewMock).toHaveBeenCalledTimes(1)
    const [template, ctx] = viewMock.mock.calls[0]
    expect(template).toBe('dashboard.njk')
    expect(ctx.repo).toBe('repo1')
    expect(ctx.runtime).toEqual(fakeRuntime)
    expect(ctx.dev).toEqual(fakeDev)
    expect(ctx.repos).toEqual(repos)
    expect(ctx.nodeResults).toBe(nodeResults)
    expect(ctx.sort).toBe('name')
  })
  it('renders dashboard for all repos when no repo param provided (defaults)', async () => {
    getRepoDependencyUpdates.mockResolvedValue({ runtime: [], dev: [] })
    sortDeps.mockImplementation((arr) => arr)
    getNodeVersionStats.mockResolvedValue({})

    const request = {
      params: {},
      query: {}
    }

    const viewMock = vi.fn()
    const h = {
      view: viewMock,
      response: vi.fn()
    }

    await htmlDashboard.handler(request, h)

    expect(getRepoDependencyUpdates).not.toHaveBeenCalled()
    expect(getNodeVersionStats).toHaveBeenCalledWith(['repo1', 'repo2'])
    expect(viewMock).toHaveBeenCalled()
    const [, ctx] = viewMock.mock.calls[0]
    expect(ctx.repo).toBe('All Repos')
    expect(ctx.sort).toBe('name') // default sort
  })

  it('returns 500 when dependency fetch throws', async () => {
    getRepoDependencyUpdates.mockRejectedValue(new Error('boom'))

    const request = {
      params: { repo: 'repo1' },
      query: {}
    }

    // h.response should return an object with a code method
    const codeMock = vi.fn()
    const responseMock = vi.fn(() => ({ code: codeMock }))
    const h = {
      view: vi.fn(),
      response: responseMock
    }

    await htmlDashboard.handler(request, h)

    expect(responseMock).toHaveBeenCalledWith('Internal Server Error')
    expect(codeMock).toHaveBeenCalledWith(500)
  })
})
