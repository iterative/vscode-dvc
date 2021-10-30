import { ViewKey } from './constants'
import { isValidState } from './factory'
import complexPlotsData from '../test/fixtures/complex-plots-example'

describe('isValidState', () => {
  const dvcRoot = 'test'
  it('Successfully validates example plots data', () => {
    expect(
      isValidState(ViewKey.PLOTS, {
        data: complexPlotsData,
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
