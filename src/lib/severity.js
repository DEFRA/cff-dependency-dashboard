// lib/severity.js
import semverDiff from 'semver-diff'

/**
 * Normalises a version string for comparison.
 * Returns null if version is invalid.
 */
export function normaliseVersion (version) {
  if (!version || typeof version !== 'string') return null

  // trim and remove surrounding quotes if present
  const raw = version.trim().replace(/^["']|["']$/g, '')

  // find the first numeric version-like token, possibly with pre-release/build suffix
  const match = raw.match(/(\d+(?:\.\d+(?:\.\d+)?)?(?:[-+][\w.-]+)?)/)
  if (!match) return null

  const found = match[1] // e.g. "20", "20.1", "20.0-beta", "18.5.2"
  const suffixMatch = found.match(/([-+].+)$/)
  const suffix = suffixMatch ? suffixMatch[1] : ''
  const core = found.replace(/[-+].*$/, '') // digits only: "20", "20.1", "20.0"
  const parts = core.split('.')

  if (parts.length === 1) return `${parts[0]}.0.0${suffix}` // "20" -> "20.0.0"
  if (parts.length === 2) return `${parts[0]}.${parts[1]}.0${suffix}` // "20.1" -> "20.1.0"
  if (parts.length === 3) return found // already "x.y.z" (preserves suffix)

  return null
}

export function getSeverity (current, latest) {
  try {
    const normCurrent = normaliseVersion(current)
    const normLatest = normaliseVersion(latest)
    if (!normCurrent || !normLatest) return 'unknown'

    const diff = semverDiff(normCurrent, normLatest)
    if (!diff) return 'unknown'

    switch (diff) {
      case 'major': return 'high'
      case 'minor': return 'medium'
      case 'patch': return 'low'
      default: return 'unknown'
    }
  } catch {
    return 'unknown'
  }
}
