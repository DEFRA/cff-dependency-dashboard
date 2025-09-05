import { config } from '../config/config.js'
import { Octokit } from '@octokit/rest'


const octokit = new Octokit({ auth: config.get('github.token') })

export async function getFileContent (repoName, filePath) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: config.get('github.owner'),
      repo: repoName,
      path: filePath
    })
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    try {
      return JSON.parse(content)
    } catch {
      return content
    }
  } catch (err) {
    if (err.status !== 404) {
      console.error(`Error in getFileContent for ${repoName}/${filePath}:`, err)
    }
    return null
  }
}

export async function getNodeVersion (repo, getFileContentFn = getFileContent) {
  const nvmrc = await getFileContentFn(repo, '.nvmrc')
  if (nvmrc) {
    const version = nvmrc.trim()
    if (/^\d+\.\d+\.\d+$/.test(version) || /^\d+$/.test(version)) return version
    return version
  }

  try {
    const pkgContent = await getFileContentFn(repo, 'package.json')
    if (pkgContent) {
      const pkg = typeof pkgContent === 'string' ? JSON.parse(pkgContent) : pkgContent
      const engine = pkg.engines?.node
      if (engine && typeof engine === 'string' && !engine.includes('x')) {
        return engine
      }
    }
  } catch {}

  return 'unknown'
}
