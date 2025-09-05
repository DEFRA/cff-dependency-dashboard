// lib/summaryStats.js
import { getRepoDependencyUpdates } from './dependency-updates.js'
import { getSeverity } from './severity.js'
import { getNodeVersion } from './github.js'
import { getLatestLtsVersion } from './lts-version.js'

export async function getNodeVersionStats (repoNames) {
  const latestLts = await getLatestLtsVersion()
  const results = []

  for (const repo of repoNames) {
    try {
      const nodeVersion = await getNodeVersion(repo)
      const severity = nodeVersion && latestLts !== 'unknown'
        ? getSeverity(nodeVersion, latestLts)
        : 'unknown'

      results.push({
        repo,
        node: {
          version: nodeVersion,
          latestLts,
          severity
        }
      })
    } catch (err) {
      console.error(`Error checking Node.js for ${repo}:`, err)
      results.push({
        repo,
        node: { version: 'error', latestLts, severity: 'unknown' }
      })
    }
  }

  return results
}
export async function getSummaryStats (repoNames) {
  const stats = {
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
    totalWithIssues: 0,
    totalChecked: 0
  }

  const results = await Promise.all(repoNames.map(getRepoDependencyUpdates))

  for (const { runtime = [], dev = [] } of results) {
    const allDeps = [...runtime, ...dev]
    for (const dep of allDeps) {
      stats[dep.severity] = (stats[dep.severity] || 0) + 1
      if (dep.severity !== 'low') stats.totalWithIssues += 1
      stats.totalChecked += 1
    }
  }

  return stats
}
