import outputFixture from './output'
import columnsFixture from './columns'
import { collectMetricsAndParams } from '../../../experiments/metricsAndParams/collect'

describe('columns fixture', () => {
  it('should match the result of running collectMetricsAndParams on output', () => {
    const metricsAndParams = collectMetricsAndParams(outputFixture)
    expect(metricsAndParams).toEqual(columnsFixture)
  })
})
