import { getSummaryStats, getNodeVersionStats } from '../lib/summary-stats.js'
import { getResolvedRepos } from '../lib/repo-source.js'

export const index = {
  method: 'GET',
  path: '/',
  handler: async function (request, h) {
    const { repos, isCustomMode, repoQueryString } = getResolvedRepos(request.query)

    // Fetch stats
    const nodeResults = await getNodeVersionStats(repos)
    const stats = await getSummaryStats(repos)

    // Render view with data
    return h.view('index.njk', { repos, stats, nodeResults, isCustomMode, repoQueryString })
  }
}
