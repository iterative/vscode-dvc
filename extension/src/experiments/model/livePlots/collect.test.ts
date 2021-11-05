import { collectLivePlotsData } from './collect'
import expShowFixture from '../../../test/fixtures/expShow/output'
import livePlotsFixture from '../../../test/fixtures/expShow/livePlots'

describe('collectLivePlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlotsData(expShowFixture)
    expect(data).toEqual(livePlotsFixture)
  })
})
