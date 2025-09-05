// lib/dependencyUpdates.js
import ncu from 'npm-check-updates'
import { getFileContent } from './github.js'
import { getSeverity } from './severity.js'

export async function getRepoDependencyUpdates (repoName) {
  try {
    const pkg = await getFileContent(repoName, 'package.json')
    const updates = await ncu.run({ packageData: JSON.stringify(pkg) })

    const runtime = []
    const dev = []

    for (const [dep, latest] of Object.entries(updates)) {
      if (pkg.dependencies && pkg.dependencies[dep]) {
        const current = pkg.dependencies[dep]
        runtime.push({ name: dep, current, latest, severity: getSeverity(current, latest) })
      } else if (pkg.devDependencies && pkg.devDependencies[dep]) {
        const current = pkg.devDependencies[dep]
        dev.push({ name: dep, current, latest, severity: getSeverity(current, latest) })
      }
    }

    return { runtime, dev }
  } catch (err) {
    console.error('Error checking dependency updates:', err)
    throw err
  }
}
