import { window } from 'vscode'
import { warnOfConsequences } from './modal'
import { Response } from './response'

const mockedWindow = jest.mocked(window)
const mockedShowWarningMessage = jest.fn()
mockedWindow.showWarningMessage = mockedShowWarningMessage
const mockedShowErrorMessage = jest.fn()
mockedWindow.showErrorMessage = mockedShowErrorMessage

jest.mock('vscode')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('warnOfConsequences', () => {
  it('should return the text of the response provided by the user', async () => {
    const userSelection = Response.YES
    const options = [userSelection, Response.NO, Response.NEVER]

    mockedShowWarningMessage.mockResolvedValueOnce(Response.YES)

    const response = await warnOfConsequences('WHAT DO I DO?', ...options)

    expect(response).toEqual(userSelection)
    expect(mockedShowWarningMessage).toBeCalledTimes(1)
  })

  it('should return undefined if the modal is cancelled', async () => {
    const modalCancelled = undefined
    const options = [Response.YES, Response.NO, Response.NEVER]

    mockedShowWarningMessage.mockResolvedValueOnce(modalCancelled)

    const response = await warnOfConsequences('WHAT DO I DO?', ...options)

    expect(response).toEqual(modalCancelled)
    expect(mockedShowWarningMessage).toBeCalledTimes(1)
  })
})
