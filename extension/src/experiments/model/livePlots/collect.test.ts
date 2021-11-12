import { collectLivePlotsData } from './collect'
import expShowFixture from '../../../test/fixtures/expShow/output'
import livePlotsFixture from '../../../test/fixtures/expShow/livePlots'
import { ExperimentsOutput } from '../../../cli/reader'

describe('collectLivePlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlotsData(expShowFixture)
    expect(data).toEqual(livePlotsFixture.plots)
  })

  it('should return undefined given no input', () => {
    const data = collectLivePlotsData({} as ExperimentsOutput)
    expect(data).toBeUndefined()
  })
})
