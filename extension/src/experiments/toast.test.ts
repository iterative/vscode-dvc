import { askToDisableAutoApplyFilters } from './toast'
import { getConfigValue, setUserConfigValue } from '../vscode/config'
import { report } from '../vscode/toast'
import { Response } from '../vscode/response'

jest.mock('../vscode/config')
jest.mock('../vscode/toast')

const mockedGetConfigValue = jest.mocked(getConfigValue)
const mockedSetUserConfigValue = jest.mocked(setUserConfigValue)
const mockedReportWithOptions = jest.mocked(report)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('askToDisableAutoApplyFilters', () => {
  it('should return early when the appropriate config option is set', async () => {
    mockedGetConfigValue.mockReturnValueOnce(true)

    const response = await askToDisableAutoApplyFilters(
      'Can we turn off auto apply filters?',
      Response.TURN_OFF
    )
    expect(response).toBeUndefined()
    expect(mockedGetConfigValue).toBeCalledTimes(1)
    expect(mockedSetUserConfigValue).not.toBeCalled()
    expect(mockedReportWithOptions).not.toBeCalled()
  })

  it("should set the appropriate config option when the user response with Don't Show Again", async () => {
    mockedGetConfigValue.mockReturnValueOnce(undefined)
    mockedReportWithOptions.mockResolvedValueOnce(Response.NEVER)

    const response = await askToDisableAutoApplyFilters(
      'Can we turn off auto apply filters?',
      Response.TURN_OFF
    )
    expect(response).toEqual(Response.NEVER)
    expect(mockedSetUserConfigValue).toBeCalledTimes(1)
  })

  it('should return cancel when the user dismisses the toast', async () => {
    mockedGetConfigValue.mockReturnValueOnce(undefined)
    mockedReportWithOptions.mockResolvedValueOnce(undefined)

    const response = await askToDisableAutoApplyFilters(
      'Can we turn off auto apply filters?',
      Response.TURN_OFF
    )
    expect(response).toEqual(Response.CANCEL)
    expect(mockedSetUserConfigValue).not.toBeCalled()
  })
})
