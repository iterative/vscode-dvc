import { collectLivePlotsData } from './collect'
import expShowFixture from '../../../test/fixtures/expShow/output'
import complexLivePlotsData from '../../../test/fixtures/complex-live-plots-example'

describe('collectLivePlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlotsData(expShowFixture)
    expect(data).toEqual(complexLivePlotsData)
  })
})
