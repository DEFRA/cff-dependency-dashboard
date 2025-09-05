import { getSummaryStats, getNodeVersionStats } from '../lib/summary-stats.js'
import { config } from '../config/config.js' 

export const index = {
  method: 'GET',
  path: '/',
  handler: async function (_request, h) {
    // Get repos from environment variable
    const repos = config.get('github.repos')
      ? config.get('github.repos').split(',').map(r => r.trim())
      : []

    // Fetch stats
    const nodeResults = await getNodeVersionStats(repos)
    const stats = await getSummaryStats(repos)

    // Render view with data
    return h.view('index.njk', { repos, stats, nodeResults })
  }
}
