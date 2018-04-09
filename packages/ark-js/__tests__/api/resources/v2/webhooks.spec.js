import Ark from '@/'
import network from '@/networks/ark/devnet'
import ApiResource from '@/api/resources/v2/webhooks'
require('../../mocks/v2')

let resource

beforeEach(() => {
  const ark = new Ark(network)
  resource = ark.getClient('https://localhost:4003').setVersion(2).resource('webhooks')
})

describe('API - 2.0 - Resources - Blocks', () => {
  it('should be instantiated', () => {
    expect(resource).toBeInstanceOf(ApiResource)
  })

  it('should call "all" method', async () => {
    const response = await resource.all()
    await expect(response.status).toBe(200)
  })

  it('should call "create" method', async () => {
    const response = await resource.create()
    await expect(response.status).toBe(200)
  })

  it('should call "get" method', async () => {
    const response = await resource.get('123')
    await expect(response.status).toBe(200)
  })

  it('should call "update" method', async () => {
    const response = await resource.update('123')
    await expect(response.status).toBe(200)
  })

  it('should call "delete" method', async () => {
    const response = await resource.delete('123')
    await expect(response.status).toBe(200)
  })

  it('should call "events" method', async () => {
    const response = await resource.events()
    await expect(response.status).toBe(200)
  })
})
