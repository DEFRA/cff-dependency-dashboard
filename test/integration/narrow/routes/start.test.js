import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import { createServer } from '../../../../src/server.js'
import { config } from '../../../../src/config/config.js'
import * as summaryStats from '../../../../src/lib/summary-stats.js'
import path from 'node:path'

describe('Start route', () => {
  let server

  beforeAll(async () => {
    // Mock config.get to provide required values for the route and server
    const projectRoot = path.resolve(__dirname, '../../../../')

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    config.get = (key) => {
      if (key === 'github.repos') return 'repo1,repo2'
      if (key === 'root') return projectRoot
      if (key === 'assetPath') return '/public'
      return undefined
    }
    // Mock summaryStats functions to avoid real logic/errors
    vi.spyOn(summaryStats, 'getNodeVersionStats').mockResolvedValue([])
    vi.spyOn(summaryStats, 'getSummaryStats').mockResolvedValue({})

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    if (server && typeof server.stop === 'function') {
      await server.stop({ timeout: 0 })
    }
    vi.restoreAllMocks()
  })

  test('Should return status code 200 for GET /', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/'
    })
    expect(response.statusCode).toBe(200)
  })
})
