import { describe, it, expect, vi } from 'vitest'

import { normaliseVersion, getSeverity } from '../../../src/lib/severity.js'

// Mock semver-diff for all tests
vi.mock('semver-diff', () => ({
  default: (a, b) => {
    if (a === '1.0.0' && b === '2.0.0') return 'major'
    if (a === '1.0.0' && b === '1.1.0') return 'minor'
    if (a === '1.0.0' && b === '1.0.1') return 'patch'
    if (a === '1.0.0' && b === '1.0.0') return null
    return null
  }
}))

describe('normaliseVersion', () => {
  it('returns null for invalid input', () => {
    expect(normaliseVersion()).toBeNull()
    expect(normaliseVersion(null)).toBeNull()
    expect(normaliseVersion(123)).toBeNull()
    expect(normaliseVersion('not-a-version')).toBeNull()
  })

  it('normalises simple versions', () => {
    expect(normaliseVersion('20')).toBe('20.0.0')
    expect(normaliseVersion('20.1')).toBe('20.1.0')
    expect(normaliseVersion('20.1.2')).toBe('20.1.2')
  })

  it('normalises versions with quotes', () => {
    expect(normaliseVersion('"20.1.2"')).toBe('20.1.2')
    expect(normaliseVersion("'20.1.2'")).toBe('20.1.2')
  })

  it('normalises versions with suffixes', () => {
    expect(normaliseVersion('20.0.0-beta')).toBe('20.0.0-beta')
    expect(normaliseVersion('20.1.0+build')).toBe('20.1.0+build')
    expect(normaliseVersion('20.1-beta')).toBe('20.1.0-beta')
    expect(normaliseVersion('20-beta')).toBe('20.0.0-beta')
  })

  it('extracts first version-like token from complex strings', () => {
    expect(normaliseVersion('v20.1.2')).toBe('20.1.2')
    expect(normaliseVersion('node 18.5.2')).toBe('18.5.2')
    expect(normaliseVersion('>=18.5.2')).toBe('18.5.2')
    expect(normaliseVersion('^20')).toBe('20.0.0')
  })
})

describe('getSeverity', () => {
  it('returns "unknown" for invalid or missing versions', () => {
    expect(getSeverity('', '1.0.0')).toBe('unknown')
    expect(getSeverity('1.0.0', '')).toBe('unknown')
    expect(getSeverity('foo', 'bar')).toBe('unknown')
  })

  it('returns "unknown" if semverDiff returns null', () => {
    expect(getSeverity('1.0.0', '1.0.0')).toBe('unknown')
  })

  it('returns correct severity for major, minor, patch', () => {
    expect(getSeverity('1.0.0', '2.0.0')).toBe('high')
    expect(getSeverity('1.0.0', '1.1.0')).toBe('medium')
    expect(getSeverity('1.0.0', '1.0.1')).toBe('low')
  })

  it('returns "unknown" for unexpected semverDiff result', async () => {
    // Dynamically mock semver-diff for this test only
    vi.doMock('semver-diff', () => ({ default: () => 'weird' }))
    const { getSeverity: getSeverityWeird } = await import('../../../src/lib/severity.js')
    expect(getSeverityWeird('1.0.0', '1.0.2')).toBe('unknown')
    vi.resetModules()
  })

  it('handles errors gracefully', () => {
    expect(getSeverity(null, undefined)).toBe('unknown')
  })
})
