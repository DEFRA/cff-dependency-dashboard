// lib/severity.js
import semverDiff from 'semver-diff'

/**
 * Normalises a version string for comparison.
 * Returns null if version is invalid.
 */
export function normaliseVersion(version) {
  if (!version || typeof version !== 'string') return null
  // strip leading 'v', trim spaces
  const cleaned = version.replace(/^[v^~]/, '').trim()
  // basic semver check
  const semverRegex = /^\d+\.\d+\.\d+(-[\w.-]+)?$/
  return semverRegex.test(cleaned) ? cleaned : null
}

/**
 * Returns severity based on semver difference:
 * major -> high, minor -> medium, patch -> low
 * unknown for invalid versions or errors
 */
export function getSeverity(current, latest) {
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
