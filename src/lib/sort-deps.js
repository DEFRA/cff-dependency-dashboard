const severityOrder = { high: 1, medium: 2, low: 3, unknown: 4 }

export function sortDeps (arr, sort = 'name', dir = 'asc') {
  let sorted
  if (sort === 'severity') {
    sorted = [...arr].sort((a, b) =>
      (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5)
    )
  } else {
    sorted = [...arr].sort((a, b) => a.name.localeCompare(b.name))
  }
  if (dir === 'desc') sorted.reverse()
  return sorted
}
