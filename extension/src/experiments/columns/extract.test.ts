import { extractColumns } from './extract'
import { generateTestExpData } from '../../test/util'

describe('extractColumns', () => {
  it('should handle concatenating errors', () => {
    const data = generateTestExpData({
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
    })

    const { error } = extractColumns(data)
    expect(error).toStrictEqual('metrics file is busted\nthis is also broken')
  })
})
