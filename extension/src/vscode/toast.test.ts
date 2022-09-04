import { window } from 'vscode'
import { Toast } from './toast'
import { Response } from './response'

jest.mock('vscode')

const mockedShowErrorMessage = jest.mocked<
  (message: string, ...items: string[]) => Thenable<string | undefined>
>(window.showErrorMessage)
const mockedShowInformationMessage = jest.mocked(window.showInformationMessage)

beforeEach(() => {
  jest.resetAllMocks()
})

const defaultPath = '/home/user/project'
const exampleExpName = 'exp-2021'

describe('Toast', () => {
  describe('errorWithOptions', () => {
    it('should call window showErrorMessage with the correct details', async () => {
      const message = 'what do you want to do?'
      const option1 = 'go on' as Response
      const option2 = 'give up' as Response

      mockedShowErrorMessage.mockResolvedValueOnce(option1)

      await Toast.errorWithOptions(message, option1, option2)

      expect(mockedShowErrorMessage).toHaveBeenCalledTimes(1)
      expect(mockedShowErrorMessage).toHaveBeenCalledWith(
        message,
        option1,
        option2
      )
    })
  })

  describe('showOutput', () => {
    it('reports the output of the given command', async () => {
      const mockedExperimentApply = jest.fn()
      const mockedStdOut = 'I applied your experiment boss'
      mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

      await Toast.showOutput(mockedExperimentApply(defaultPath, exampleExpName))

      expect(mockedExperimentApply).toHaveBeenCalledWith(
        defaultPath,
        exampleExpName
      )

      expect(mockedShowInformationMessage).toHaveBeenCalledTimes(1)
      expect(mockedShowInformationMessage).toHaveBeenCalledWith(mockedStdOut)
    })

    it('reports operation successful when no output is returned for the given command', async () => {
      const mockedExperimentApply = jest.fn()
      const mockedStdOut = ''
      mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

      await Toast.showOutput(mockedExperimentApply(defaultPath, exampleExpName))

      expect(mockedExperimentApply).toHaveBeenCalledWith(
        defaultPath,
        exampleExpName
      )

      expect(mockedShowInformationMessage).toHaveBeenCalledTimes(1)
      expect(mockedShowInformationMessage).toHaveBeenCalledWith(
        'Operation successful.'
      )
    })
  })
})
