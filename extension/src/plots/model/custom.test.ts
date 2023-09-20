import { cleanupOldOrderValue } from './custom'

describe('cleanupOlderValue', () => {
  it('should update value if contents are outdated', () => {
    const output = cleanupOldOrderValue({
      metric: 'metrics:summary.json:loss',
      param: 'params:params.yaml:log_file'
    })
    expect(output).toStrictEqual({
      metric: 'summary.json:loss',
      param: 'params.yaml:log_file'
    })
  })

  it('should not update value if contents are not outdated', () => {
    const value = {
      metric: 'summary.json:loss',
      param: 'params.yaml:log_file'
    }
    const output = cleanupOldOrderValue(value)
    expect(output).toStrictEqual(value)
  })
})
