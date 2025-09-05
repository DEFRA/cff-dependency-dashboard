import { getRepoDependencyUpdates } from '../lib/dependency-updates.js'
import { getNodeVersionStats } from '../lib/summary-stats.js'
import { sortDeps } from '../lib/sort-deps.js'
import { config } from '../config/config.js'
export const htmlDashboard = {
  method: 'GET',
  path: '/html-dashboard/{repo?}',
  handler: async (request, h) => {
    try {
      // Get list of repos from environment
    const repos = config.get('github.repos')
      ? config.get('github.repos').split(',').map(r => r.trim())
      : []

      const repoName = request.params.repo
      const sort = request.query.sort || 'name'
      const dir = request.query.dir === 'desc' ? 'desc' : 'asc'

      // Fetch dependency updates if repo specified
      let data = { runtime: [], dev: [] }
      if (repoName) {
        data = await getRepoDependencyUpdates(repoName)
      }

      // Sort dependencies
      const runtime = sortDeps(data.runtime, sort, dir)
      const dev = sortDeps(data.dev, sort, dir)

      // Get Node version stats
      const nodeResults = await getNodeVersionStats(repos)

      // Render the dashboard view
      return h.view('dashboard.njk', {
        repo: repoName || 'All Repos',
        runtime,
        dev,
        repos,
        nodeResults,
        sort
      })
    } catch (err) {
      console.error('Error loading dashboard view:', err)
      return h.response('Internal Server Error').code(500)
    }
  }
}
