import { collectLivePlotsData } from './collect'
import complexExperimentsOutput from '../test/fixtures/complex-output-example'
import complexPlots from '../test/fixtures/complex-plots-example'

describe('collectLivePlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlotsData(complexExperimentsOutput)

    expect(complexPlots.length).toEqual(data.size)
    complexPlots.forEach(({ title, values }) =>
      expect(data.get('metrics:' + title)).toEqual(values)
    )
  })
})
