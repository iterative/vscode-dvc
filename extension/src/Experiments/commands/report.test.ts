import { queueExperiment } from './report'
import { mocked } from 'ts-jest/utils'
import { executeProcess } from '../../processExecution'
import { getProcessEnv } from '../../env'
import { window } from 'vscode'

jest.mock('../../processExecution')
jest.mock('../../env')
jest.mock('vscode')

const mockedExecuteProcess = mocked(executeProcess)
const mockedShowErrorMessage = mocked(window.showErrorMessage)
const mockedShowInformationMessage = mocked(window.showInformationMessage)

const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/all/of/the/goodies:/in/my/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValue(mockedEnv)
})

const defaultPath = '/home/user/project'

const exampleExecutionOptions = {
  cliPath: 'dvc',
  cwd: defaultPath,
  pythonBinPath: undefined
}

describe('queueExperiment', () => {
  it('displays an info message with the contents of stdout when the command succeeds', async () => {
    const stdout = 'Example stdout that will be resolved literally'
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    await queueExperiment(exampleExecutionOptions)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  it('displays an error message when the command fails', async () => {
    const stderr = 'Example stderr that will be resolved literally'
    const mockedError = { stderr }
    mockedExecuteProcess.mockRejectedValueOnce(mockedError)
    await queueExperiment(exampleExecutionOptions)
    expect(mockedShowErrorMessage).toBeCalledWith(
      'Failed to queue an experiment'
    )
  })
})
