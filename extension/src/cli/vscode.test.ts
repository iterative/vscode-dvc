import { Config } from '../Config'
import { experimentRunQueueCommand } from './vscode'
import { mocked } from 'ts-jest/utils'
import { executeProcess } from '../processExecution'
import { getProcessEnv } from '../env'
import { window } from 'vscode'

jest.mock('../processExecution')
jest.mock('../env')
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

const exampleConfig = {
  getCliPath: () => 'dvc',
  workspaceRoot: defaultPath
} as Config

describe('experimentRunQueueCommand', () => {
  it('displays an info message with the contents of stdout when the command succeeds', async () => {
    const stdout = 'Example stdout that will be resolved literally'
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    await experimentRunQueueCommand(exampleConfig)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  it('displays an error message with the contents of stderr when the command fails', async () => {
    const stderr = 'Example stderr that will be resolved literally'
    mockedExecuteProcess.mockRejectedValueOnce(stderr)
    await experimentRunQueueCommand(exampleConfig)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })
})
