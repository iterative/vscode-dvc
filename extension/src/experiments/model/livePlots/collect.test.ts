import { collectLivePlotsData } from './collect'
import complexExperimentsOutput from '../../../test/fixtures/complex-output-example'
import complexLivePlotsData from '../../../test/fixtures/complex-live-plots-example'

describe('collectLivePlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlotsData(complexExperimentsOutput)
    expect(data).toEqual(complexLivePlotsData)
  })
})
