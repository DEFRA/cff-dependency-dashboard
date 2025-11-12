import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('npm-check-updates', () => ({ default: { run: vi.fn() } }))
vi.mock('../../../src/lib/github.js', () => ({ getFileContent: vi.fn() }))
vi.mock('../../../src/lib/severity.js', () => ({ getSeverity: vi.fn() }))

const ncu = (await import('npm-check-updates')).default
const { getFileContent } = await import('../../../src/lib/github.js')
const { getSeverity } = await import('../../../src/lib/severity.js')
const { getRepoDependencyUpdates } = await import('../../../src/lib/dependency-updates.js')

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getRepoDependencyUpdates', () => {
  it('returns runtime and dev dependency update info and calls ncu with packageData', async () => {
    const pkg = {
      dependencies: { dep1: '^1.0.0' },
      devDependencies: { devdep1: '~1.0.0' }
    }

    getFileContent.mockResolvedValue(pkg)
    ncu.run.mockResolvedValue({ dep1: '2.0.0', devdep1: '1.1.0' })
    getSeverity.mockImplementation((current, latest) => {
      if (current === '^1.0.0' && latest === '2.0.0') return 'major'
      if (current === '~1.0.0' && latest === '1.1.0') return 'minor'
      return 'unknown'
    })

    const result = await getRepoDependencyUpdates('some-repo')

    expect(getFileContent).toHaveBeenCalledWith('some-repo', 'package.json')
    expect(ncu.run).toHaveBeenCalledWith({ packageData: JSON.stringify(pkg) })
    expect(getSeverity).toHaveBeenCalledTimes(2)

    expect(result.runtime).toEqual([
      { name: 'dep1', current: '^1.0.0', latest: '2.0.0', severity: 'major' }
    ])
    expect(result.dev).toEqual([
      { name: 'devdep1', current: '~1.0.0', latest: '1.1.0', severity: 'minor' }
    ])
  })

  it('ignores updates not present in package.json', async () => {
    const pkg = {
      dependencies: { dep1: '^1.0.0' },
      devDependencies: {}
    }

    getFileContent.mockResolvedValue(pkg)
    ncu.run.mockResolvedValue({ dep1: '2.0.0', unknown: '9.9.9' })
    getSeverity.mockReturnValue('major')

    const result = await getRepoDependencyUpdates('repo-with-unknown')

    expect(result.runtime).toEqual([
      { name: 'dep1', current: '^1.0.0', latest: '2.0.0', severity: 'major' }
    ])
    expect(result.dev).toEqual([])
  })

  it('logs and rethrows when getFileContent throws', async () => {
    const error = new Error('fail to read')
    getFileContent.mockRejectedValue(error)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(getRepoDependencyUpdates('bad-repo')).rejects.toThrow(error)
    expect(consoleSpy).toHaveBeenCalledWith('Error checking dependency updates:', error)

    consoleSpy.mockRestore()
  })

  it('logs and rethrows when ncu.run throws', async () => {
    const pkg = {
      dependencies: { dep1: '^1.0.0' }
    }

    getFileContent.mockResolvedValue(pkg)
    const error = new Error('ncu failed')
    ncu.run.mockRejectedValue(error)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(getRepoDependencyUpdates('repo-ncu-fail')).rejects.toThrow(error)
    expect(consoleSpy).toHaveBeenCalledWith('Error checking dependency updates:', error)

    consoleSpy.mockRestore()
  })
})
