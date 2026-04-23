import { config } from '../config/config.js'

const repoNamePattern = /^[A-Za-z0-9._-]+$/

function parseRepoCsv (value) {
  if (!value || typeof value !== 'string') {
    return []
  }

  return value
    .split(/[\n,]/)
    .map(repo => repo.trim())
    .filter(Boolean)
}

function normalizeRepoList (repos) {
  const uniqueRepos = new Set()

  for (const repo of repos) {
    if (repoNamePattern.test(repo)) {
      uniqueRepos.add(repo)
    }
  }

  return [...uniqueRepos]
}

export function getDefaultRepos () {
  return normalizeRepoList(parseRepoCsv(config.get('github.repos')))
}

export function getCustomReposFromQuery (query = {}) {
  const textRepos = parseRepoCsv(query.repos)
  const selectedRepos = Array.isArray(query.selectedRepos)
    ? query.selectedRepos
    : parseRepoCsv(query.selectedRepos)

  return normalizeRepoList([...textRepos, ...selectedRepos])
}

export function getResolvedRepos (query = {}) {
  const customRepos = getCustomReposFromQuery(query)
  const isCustomMode = customRepos.length > 0
  const repos = isCustomMode ? customRepos : getDefaultRepos()

  return {
    repos,
    isCustomMode,
    repoQueryString: isCustomMode
      ? new URLSearchParams({ repos: customRepos.join(',') }).toString()
      : ''
  }
}
