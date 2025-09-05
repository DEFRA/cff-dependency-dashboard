import { getSummaryStats, getNodeVersionStats } from  '../lib/summary-stats.js'

export const index = {
  method: 'GET',
  path: '/',
  handler: async function (_request, h) {
    // Get repos from environment variable
    const repos = process.env.GITHUB_REPOS
      ? process.env.GITHUB_REPOS.split(',').map(r => r.trim())
      : []

    // Fetch stats
    const nodeResults = await getNodeVersionStats(repos)
    const stats = await getSummaryStats(repos)

    // Render view with data
    return h.view('index.njk', { repos, stats, nodeResults })
  }
}
