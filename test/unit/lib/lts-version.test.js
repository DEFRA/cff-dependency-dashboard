import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('got')

const got = (await import('got')).default
const { getLatestLtsVersion } = await import('../../../src/lib/lts-version.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getLatestLtsVersion', () => {
  it('returns the highest LTS tag without the leading "v"', async () => {
    const releases = [
      { name: 'Node v16 LTS', tag_name: 'v16.20.0' },
      { name: 'Node v18 LTS', tag_name: 'v18.12.0' },
      { name: 'Node v20 Current', tag_name: 'v20.1.0' }
    ]

    got.mockImplementation(() => ({ json: async () => releases }))

    const result = await getLatestLtsVersion()
    expect(result).toBe('18.12.0')
  })

  it('picks the newest release when multiple LTS releases of same major exist', async () => {
    const releases = [
      { name: 'Node v18 LTS', tag_name: 'v18.11.0' },
      { name: 'Node v18 LTS', tag_name: 'v18.12.3' },
      { name: 'Node v18 LTS', tag_name: 'v18.12.1' }
    ]

    got.mockImplementation(() => ({ json: async () => releases }))

    const result = await getLatestLtsVersion()
    expect(result).toBe('18.12.3')
  })

  it('is case-insensitive when detecting LTS in the release name', async () => {
    const releases = [
      { name: 'node v14 lTs', tag_name: 'v14.19.0' },
      { name: 'Node v12 NotLTS', tag_name: 'v12.22.0' }
    ]

    got.mockImplementation(() => ({ json: async () => releases }))

    const result = await getLatestLtsVersion()
    expect(result).toBe('14.19.0')
  })

  it('throws when no LTS releases are found', async () => {
    const releases = [
      { name: 'Node v20 Current', tag_name: 'v20.1.0' },
      { name: 'Node v19 Beta', tag_name: 'v19.0.0' }
    ]

    got.mockImplementation(() => ({ json: async () => releases }))

    await expect(getLatestLtsVersion()).rejects.toThrow()
  })
})
