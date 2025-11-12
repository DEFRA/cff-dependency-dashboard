import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../src/lib/dependency-updates.js', () => ({
  getRepoDependencyUpdates: vi.fn()
}))
vi.mock('../../../src/lib/severity.js', () => ({
  getSeverity: vi.fn()
}))
vi.mock('../../../src/lib/github.js', () => ({
  getNodeVersion: vi.fn()
}))
vi.mock('../../../src/lib/lts-version.js', () => ({
  getLatestLtsVersion: vi.fn()
}))

const { getRepoDependencyUpdates } = await import('../../../src/lib/dependency-updates.js')
const { getSeverity } = await import('../../../src/lib/severity.js')
const { getNodeVersion } = await import('../../../src/lib/github.js')
const { getLatestLtsVersion } = await import('../../../src/lib/lts-version.js')
const { getNodeVersionStats, getSummaryStats } = await import('../../../src/lib/summary-stats.js')

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getNodeVersionStats', () => {
  it('returns node version stats for each repo', async () => {
    getLatestLtsVersion.mockResolvedValue('18.0.0')
    getNodeVersion.mockResolvedValueOnce('16.0.0').mockResolvedValueOnce('18.0.0')
    getSeverity.mockImplementation((current, latest) => (current === latest ? 'low' : 'high'))

    const repos = ['repo1', 'repo2']
    const result = await getNodeVersionStats(repos)

    expect(getLatestLtsVersion).toHaveBeenCalled()
    expect(getNodeVersion).toHaveBeenCalledTimes(2)
    expect(getSeverity).toHaveBeenCalledWith('16.0.0', '18.0.0')
    expect(getSeverity).toHaveBeenCalledWith('18.0.0', '18.0.0')
    expect(result).toEqual([
      {
        repo: 'repo1',
        node: { version: '16.0.0', latestLts: '18.0.0', severity: 'high' }
      },
      {
        repo: 'repo2',
        node: { version: '18.0.0', latestLts: '18.0.0', severity: 'low' }
      }
    ])
  })

  it('handles unknown node version or LTS', async () => {
    getLatestLtsVersion.mockResolvedValue('unknown')
    getNodeVersion.mockResolvedValue('unknown')
    getSeverity.mockReturnValue('unknown')

    const result = await getNodeVersionStats(['repo1'])
    expect(result[0].node.severity).toBe('unknown')
  })

  it('handles errors from getNodeVersion', async () => {
    getLatestLtsVersion.mockResolvedValue('18.0.0')
    getNodeVersion.mockRejectedValue(new Error('fail'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await getNodeVersionStats(['repo1'])
    expect(result[0].node.version).toBe('error')
    expect(result[0].node.severity).toBe('unknown')
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('getSummaryStats', () => {
  it('returns correct stats for multiple repos', async () => {
    getRepoDependencyUpdates
      .mockResolvedValueOnce({
        runtime: [{ severity: 'high' }, { severity: 'low' }],
        dev: [{ severity: 'medium' }]
      })
      .mockResolvedValueOnce({
        runtime: [{ severity: 'unknown' }],
        dev: []
      })

    const result = await getSummaryStats(['repo1', 'repo2'])
    expect(result).toEqual({
      high: 1,
      medium: 1,
      low: 1,
      unknown: 1,
      totalWithIssues: 3, // high, medium, unknown
      totalChecked: 4
    })
  })

  it('handles empty repos array', async () => {
    const result = await getSummaryStats([])
    expect(result).toEqual({
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
      totalWithIssues: 0,
      totalChecked: 0
    })
  })

  it('handles repos with no dependencies', async () => {
    getRepoDependencyUpdates.mockResolvedValue({ runtime: [], dev: [] })
    const result = await getSummaryStats(['repo1'])
    expect(result).toEqual({
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
      totalWithIssues: 0,
      totalChecked: 0
    })
  })
})
