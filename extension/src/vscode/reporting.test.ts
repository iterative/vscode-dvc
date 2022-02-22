import { window } from 'vscode'
import { ReportLevel, reportOutput, reportWithOptions } from './reporting'
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

describe('reportErrorWithOptions', () => {
  it('should call window showErrorMessage with the correct details', async () => {
    const message = 'what do you want to do?'
    const option1 = 'go on' as Response
    const option2 = 'give up' as Response

    mockedShowErrorMessage.mockResolvedValueOnce(option1)

    await reportWithOptions(ReportLevel.ERROR, message, option1, option2)

    expect(mockedShowErrorMessage).toBeCalledTimes(1)
    expect(mockedShowErrorMessage).toBeCalledWith(message, option1, option2)
  })
})

describe('reportOutput', () => {
  it('reports the output of the given command', async () => {
    const mockedExperimentApply = jest.fn()
    const mockedStdOut = 'I applied your experiment boss'
    mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

    await reportOutput(mockedExperimentApply(defaultPath, exampleExpName))

    expect(mockedExperimentApply).toBeCalledWith(defaultPath, exampleExpName)

    expect(mockedShowInformationMessage).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).toBeCalledWith(mockedStdOut)
  })

  it('reports operation successful when no output is returned for the given command', async () => {
    const mockedExperimentApply = jest.fn()
    const mockedStdOut = ''
    mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

    await reportOutput(mockedExperimentApply(defaultPath, exampleExpName))

    expect(mockedExperimentApply).toBeCalledWith(defaultPath, exampleExpName)

    expect(mockedShowInformationMessage).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).toBeCalledWith('Operation successful.')
  })
})
