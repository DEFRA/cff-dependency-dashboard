import { config } from '../config/config.js'
import { getDefaultRepos, getCustomReposFromQuery } from '../lib/repo-source.js'
import { listPublicRepos } from '../lib/github.js'

export const adminRepos = {
  method: 'GET',
  path: '/admin/repos',
  handler: async function (request, h) {
    const defaultRepos = getDefaultRepos()
    const currentCustomRepos = getCustomReposFromQuery(request.query)

    let availableRepos = []
    let loadError = ''

    try {
      availableRepos = await listPublicRepos(config.get('github.owner'))
    } catch (err) {
      console.error('Error loading available repositories:', err)
      loadError = 'Could not load public repositories from GitHub. You can still enter repository names manually.'
    }

    return h.view('admin-repos.njk', {
      defaultRepos,
      defaultReposText: defaultRepos.join(', '),
      currentCustomRepos,
      availableRepos,
      loadError,
      githubOwner: config.get('github.owner')
    })
  }
}
