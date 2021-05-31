import { queueExperiment, report } from './report'
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

describe('report', () => {
  it('reports the output of the given command', async () => {
    const mockedExperimentApply = jest.fn()
    const mockedStdOut = 'I applied your experiment boss'
    mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

    await report(mockedExperimentApply, defaultPath, exampleExpName)

    expect(mockedExperimentApply).toBeCalledWith(defaultPath, exampleExpName)

    expect(mockedShowInformationMessage).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).toBeCalledWith(mockedStdOut)
  })

  it('reports operation successful when no output is returned for the given command', async () => {
    const mockedExperimentApply = jest.fn()
    const mockedStdOut = ''
    mockedExperimentApply.mockResolvedValueOnce(mockedStdOut)

    await report(mockedExperimentApply, defaultPath, exampleExpName)

    expect(mockedExperimentApply).toBeCalledWith(defaultPath, exampleExpName)

    expect(mockedShowInformationMessage).toBeCalledTimes(1)
    expect(mockedShowInformationMessage).toBeCalledWith('Operation successful.')
  })

  it('reports the error when execute process throws with stderr', async () => {
    const mockedExperimentApply = jest.fn()
    mockedExperimentApply.mockRejectedValueOnce({
      stderr: 'something went very wrong'
    })

    await report(mockedExperimentApply, defaultPath, exampleExpName)

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
