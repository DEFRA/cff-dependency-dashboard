import { describe, it, expect } from 'vitest'
import { sortDeps } from '../../../src/lib/sort-deps.js'

describe('sortDeps', () => {
  const deps = [
    { name: 'b', severity: 'medium' },
    { name: 'a', severity: 'high' },
    { name: 'c', severity: 'low' },
    { name: 'd', severity: 'unknown' }
  ]

  it('sorts by name ascending by default', () => {
    const result = sortDeps(deps)
    expect(result.map(d => d.name)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('sorts by name descending', () => {
    const result = sortDeps(deps, 'name', 'desc')
    expect(result.map(d => d.name)).toEqual(['d', 'c', 'b', 'a'])
  })

  it('sorts by severity ascending', () => {
    const result = sortDeps(deps, 'severity')
    expect(result.map(d => d.severity)).toEqual(['high', 'medium', 'low', 'unknown'])
  })

  it('sorts by severity descending', () => {
    const result = sortDeps(deps, 'severity', 'desc')
    expect(result.map(d => d.severity)).toEqual(['unknown', 'low', 'medium', 'high'])
  })

  it('handles missing severity gracefully', () => {
    const arr = [{ name: 'x' }, { name: 'y', severity: 'high' }]
    const result = sortDeps(arr, 'severity')
    expect(result[0].name).toBe('y') // high comes before missing
    expect(result[1].name).toBe('x')
  })
})
