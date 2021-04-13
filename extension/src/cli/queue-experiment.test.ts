import { resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { window } from 'vscode'
import { execPromise } from '../util'
import { Config } from '../Config'
import { queueExperimentCommand } from './index'
jest.mock('vscode')
jest.mock('../util')
jest.mock('.')
const { showErrorMessage } = window

const mockedShowInformationMessage = jest.spyOn(
  window,
  'showInformationMessage'
)
const mockedShowErrorMessage = mocked(showErrorMessage)
const mockedExecPromise = mocked(execPromise)

describe('queueExperimentCommand', () => {
  const exampleConfig = ({
    dvcPath: 'dvc',
    cwd: resolve()
  } as unknown) as Config

  test('it displays an info message with the contents of stdout when the command succeeds', async () => {
    const stdout = 'Example stdout that will be resolved literally\n'
    mockedExecPromise.mockResolvedValue({ stdout, stderr: '' })
    await queueExperimentCommand(exampleConfig)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  test('it displays an error message with the contents of stderr when the command fails', async () => {
    const stderr = 'Example stderr that will be resolved literally\n'
    mockedExecPromise.mockRejectedValue({ stderr, stdout: '' })
    await queueExperimentCommand(exampleConfig)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })
})
