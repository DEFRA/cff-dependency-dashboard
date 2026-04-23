import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../src/config/config.js', () => ({
  config: {
    get: vi.fn(() => 'repo-a,repo-b')
  }
}))

const { config } = await import('../../../src/config/config.js')
const {
  getDefaultRepos,
  getCustomReposFromQuery,
  getResolvedRepos
} = await import('../../../src/lib/repo-source.js')

describe('repo-source helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.get.mockReturnValue('repo-a,repo-b')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns normalized default repositories from config', () => {
    config.get.mockReturnValue(' repo-a, repo-b,repo-a,invalid/repo ')

    expect(getDefaultRepos()).toEqual(['repo-a', 'repo-b'])
  })

  it('builds custom repositories from text and selected values', () => {
    const repos = getCustomReposFromQuery({
      repos: 'custom-a\ncustom-b',
      selectedRepos: ['custom-b', 'custom-c', 'bad/repo']
    })

    expect(repos).toEqual(['custom-a', 'custom-b', 'custom-c'])
  })

  it('uses default repos when no custom repos were provided', () => {
    const resolved = getResolvedRepos({})

    expect(resolved).toEqual({
      repos: ['repo-a', 'repo-b'],
      isCustomMode: false,
      repoQueryString: ''
    })
  })

  it('uses custom repos and emits query string when provided', () => {
    const resolved = getResolvedRepos({ repos: 'custom-a,custom-b' })

    expect(resolved).toEqual({
      repos: ['custom-a', 'custom-b'],
      isCustomMode: true,
      repoQueryString: 'repos=custom-a%2Ccustom-b'
    })
  })
})
