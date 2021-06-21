import { mocked } from 'ts-jest/utils'
import { window } from 'vscode'
import { getWarningResponse, showGenericError } from './modal'

const mockedWindow = mocked(window)
const mockedShowWarningMessage = jest.fn()
mockedWindow.showWarningMessage = mockedShowWarningMessage
const mockedShowErrorMessage = jest.fn()
mockedWindow.showErrorMessage = mockedShowErrorMessage

jest.mock('vscode')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getWarningResponse', () => {
  it('should return the text of the response provided by the user', async () => {
    const userSelection = 'yes'
    const options = [userSelection, 'no', "don't ask again"]

    mockedShowWarningMessage.mockResolvedValueOnce('yes')

    const response = await getWarningResponse('WHAT DO I DO?', ...options)

    expect(response).toEqual(userSelection)
    expect(mockedShowWarningMessage).toBeCalledTimes(1)
  })

  it('should return undefined if the modal is cancelled', async () => {
    const modalCancelled = undefined
    const options = ['yes', 'no', "don't ask again"]

    mockedShowWarningMessage.mockResolvedValueOnce(modalCancelled)

    const response = await getWarningResponse('WHAT DO I DO?', ...options)

    expect(response).toEqual(modalCancelled)
    expect(mockedShowWarningMessage).toBeCalledTimes(1)
  })
})

describe('showGenericError', () => {
  it('should call showErrorMessage with the correct details', async () => {
    mockedShowErrorMessage.mockResolvedValueOnce(undefined)

    await showGenericError()

    expect(mockedShowErrorMessage).toBeCalledWith(
      'Something went wrong, please see the DVC output channel for more details.',
      { modal: true }
    )
  })
})
