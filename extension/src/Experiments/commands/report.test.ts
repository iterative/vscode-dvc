import { applyExperiment, queueExperiment } from './report'
import { mocked } from 'ts-jest/utils'
import { executeProcess } from '../../processExecution'
import { getProcessEnv } from '../../env'
import { window } from 'vscode'

jest.mock('../../processExecution')
jest.mock('../../env')
jest.mock('vscode')
jest.mock('../../vscode/EventEmitter')

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
const exampleExpName = 'exp-2021'

const exampleExecutionOptions = {
  cliPath: 'dvc',
  cwd: defaultPath,
  pythonBinPath: undefined
}

describe('applyExperiment', () => {
  it('invokes a quick pick with a list of names from stdout and executes a constructed command', async () => {
    await applyExperiment(exampleExecutionOptions, exampleExpName)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'apply', exampleExpName],
      cwd: defaultPath,
      env: mockedEnv
    })

    expect(mockedShowInformationMessage).toBeCalledTimes(1)
  })

  it('reports the error when execute process throws with stderr', async () => {
    mockedExecuteProcess.mockRejectedValueOnce({
      stderr: 'something went very wrong'
    })
    await applyExperiment(exampleExecutionOptions, exampleExpName)

    expect(mockedShowErrorMessage).toBeCalledTimes(1)
  })
})

describe('queueExperiment', () => {
  it('displays an info message with the contents of stdout when the command succeeds', async () => {
    const stdout = 'Example stdout that will be resolved literally'
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    await queueExperiment(exampleExecutionOptions)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  it('displays an error message with the contents of stderr when the command fails', async () => {
    const stderr = 'Example stderr that will be resolved literally'
    const mockedError = { stderr }
    mockedExecuteProcess.mockRejectedValueOnce(mockedError)
    await queueExperiment(exampleExecutionOptions)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })
})
