import { ViewKey } from './constants'
import { isValidState } from './factory'
import livePlotsFixture from '../test/fixtures/expShow/livePlots'

describe('isValidState', () => {
  const dvcRoot = 'test'
  it('Successfully validates example plots data', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: livePlotsFixture,
        dvcRoot
      })
    ).toBe(true)
  })
  it('Successfully validates an empty plots state', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: [],
        dvcRoot
      })
    ).toBe(true)
  })
  it('Does not validate when given an object as data', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: {},
        dvcRoot
      })
    ).toBe(false)
  })
})
