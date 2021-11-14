import { ViewKey } from './constants'
import { isValidState } from './factory'
import livePlotsFixture from '../test/fixtures/expShow/livePlots'
import plotsShowFixture from '../test/fixtures/plotsShow/minimalOutput'

describe('isValidState', () => {
  const dvcRoot = 'test'
  it('should successfully validate example plots data', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: { live: livePlotsFixture, static: plotsShowFixture },
        dvcRoot
      })
    ).toBe(true)
  })

  it('should successfully validate data containing only live plots', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: { live: livePlotsFixture },
        dvcRoot
      })
    ).toBe(true)
  })

  it('should successfully validate data containing only static plots', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: { static: plotsShowFixture },
        dvcRoot
      })
    ).toBe(true)
  })

  it('should successfully validate an empty plots state', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: {},
        dvcRoot
      })
    ).toBe(true)
  })

  it('should successfully invalidate an empty object without data', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: undefined,
        dvcRoot
      })
    ).toBe(false)
  })

  it('should successfully invalidate an object with the wrong key', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: { tableData: {} },
        dvcRoot
      })
    ).toBe(false)
  })
})
