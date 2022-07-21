import { extractColumns } from './extract'

describe('extractColumns', () => {
  it('should handle concatenating errors', () => {
    const data = {
      metrics: {
        'summary.json': {
          error: { msg: 'metrics file is busted', type: 'fatal' }
        }
      },
      params: {
        'params.yaml': {
          error: { msg: 'this is also broken', type: 'impossible' }
        }
      }
    }

    const { error } = extractColumns(data)
    expect(error).toStrictEqual('metrics file is busted\nthis is also broken')
  })
})
