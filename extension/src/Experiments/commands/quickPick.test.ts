import { mocked } from 'ts-jest/utils'
import { executeProcess } from '../../processExecution'
import { getProcessEnv } from '../../env'
import { QuickPickOptions, window } from 'vscode'
import { GcPreserveFlag } from '../../cli/args'
import { QuickPickItemWithValue } from '../../vscode/quickPick'
import {
  applyExperiment,
  branchExperiment,
  garbageCollectExperiments,
  removeExperiment
} from './quickPick'

jest.mock('../../processExecution')
jest.mock('../../env')
jest.mock('vscode')

const mockedExecuteProcess = mocked(executeProcess)
const mockedShowErrorMessage = mocked(window.showErrorMessage)
const mockedShowInformationMessage = mocked(window.showInformationMessage)
const mockedShowQuickPick = mocked<
  (
    items: QuickPickItemWithValue[],
    options: QuickPickOptions
  ) => Thenable<
    QuickPickItemWithValue[] | QuickPickItemWithValue | string | undefined
  >
>(window.showQuickPick)
const mockedShowInputBox = mocked(window.showInputBox)
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

const exampleExperimentsList = [
  'exp-0580a',
  'exp-c54c4',
  'exp-054f1',
  'exp-ae4fa',
  'exp-1324e',
  'exp-3bd24',
  'exp-5d170',
  'exp-9fe22',
  'exp-b707b',
  'exp-47694',
  'exp-59807'
]

const exampleExpName = 'exp-2021'

const exampleListStdout = exampleExperimentsList.join('\n') + '\n'

describe('garbageCollectExperiments', () => {
  it('invokes a QuickPick with the correct options', async () => {
    await garbageCollectExperiments(exampleExecutionOptions)
    expect(mockedShowQuickPick).toBeCalledWith(
      [
        {
          detail: 'Preserve Experiments derived from all Git branches',
          label: 'All Branches',
          value: '--all-branches'
        },
        {
          detail: 'Preserve Experiments derived from all Git tags',
          label: 'All Tags',
          value: '--all-tags'
        },
        {
          detail: 'Preserve Experiments derived from all Git commits',
          label: 'All Commits',
          value: '--all-commits'
        },
        {
          detail: 'Preserve all queued Experiments',
          label: 'Queued Experiments',
          value: '--queued'
        }
      ],
      {
        canPickMany: true,
        placeHolder: 'Select which Experiments to preserve'
      }
    )
  })

  it('executes the proper command given a mocked selection', async () => {
    mockedExecuteProcess.mockResolvedValueOnce('')
    mockedShowQuickPick.mockResolvedValueOnce([
      {
        detail: 'Preserve Experiments derived from all Git tags',
        value: GcPreserveFlag.ALL_TAGS,
        label: 'All Tags'
      },
      {
        detail: 'Preserve Experiments derived from all Git commits',
        value: GcPreserveFlag.ALL_COMMITS,
        label: 'All Commits'
      }
    ])

    await garbageCollectExperiments(exampleExecutionOptions)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'gc', '-f', '-w', '--all-tags', '--all-commits'],
      cwd: exampleExecutionOptions.cwd,
      env: mockedEnv
    })
  })

  it('reports stdout from the executed command via showInformationMessage', async () => {
    const stdout = 'example stdout that will be passed on'
    mockedShowQuickPick.mockResolvedValueOnce([])
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    await garbageCollectExperiments(exampleExecutionOptions)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  it('reports stderr from the executed command via showInformationMessage', async () => {
    const stderr = 'example stderr that will be passed on'
    const mockedError = { stderr }

    mockedShowQuickPick.mockResolvedValueOnce([])
    mockedExecuteProcess.mockRejectedValueOnce(mockedError)

    await expect(
      garbageCollectExperiments(exampleExecutionOptions)
    ).rejects.toEqual(mockedError)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })

  it('throws from a non-shell Exception', async () => {
    mockedShowQuickPick.mockResolvedValueOnce([])
    mockedExecuteProcess.mockRejectedValueOnce(new Error())
    await expect(
      garbageCollectExperiments(exampleExecutionOptions)
    ).rejects.toThrow()
    expect(mockedShowErrorMessage).not.toBeCalled()
  })

  it('executes the proper default command given no selections', async () => {
    mockedExecuteProcess.mockResolvedValueOnce('')
    mockedShowQuickPick.mockResolvedValueOnce([])

    await garbageCollectExperiments(exampleExecutionOptions)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'gc', '-f', '-w'],
      cwd: exampleExecutionOptions.cwd,
      env: mockedEnv
    })
  })

  it('does not execute a command if the QuickPick is dismissed', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    await garbageCollectExperiments(exampleExecutionOptions)
    expect(mockedExecuteProcess).not.toBeCalled()
  })
})

describe('applyExperiment', () => {
  it('invokes a quick pick with a list of names from stdout and executes a constructed command', async () => {
    mockedExecuteProcess.mockResolvedValueOnce(exampleListStdout)
    mockedShowQuickPick.mockResolvedValueOnce(exampleExpName)
    await applyExperiment(exampleExecutionOptions)
    expect(mockedShowQuickPick).toBeCalledWith(exampleExperimentsList)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'list', '--names-only'],
      cwd: defaultPath,
      env: mockedEnv
    })

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'apply', 'exp-2021'],
      cwd: defaultPath,
      env: mockedEnv
    })
  })

  it('throws from a non-shell Exception', async () => {
    mockedShowQuickPick.mockResolvedValueOnce([])
    mockedExecuteProcess.mockRejectedValueOnce(new Error())
    await expect(applyExperiment(exampleExecutionOptions)).rejects.toThrow()
    expect(mockedShowErrorMessage).not.toBeCalled()
  })

  it('displays an error message when there are no experiments to select', async () => {
    mockedExecuteProcess.mockResolvedValueOnce('')
    mockedShowQuickPick.mockResolvedValueOnce(exampleExpName)
    await applyExperiment(exampleExecutionOptions)
    expect(mockedShowQuickPick).not.toBeCalled()
    expect(mockedShowErrorMessage).toBeCalledWith(
      'There are no experiments to select!'
    )
  })

  it('does not execute a command if the QuickPick is dismissed', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    mockedExecuteProcess.mockResolvedValueOnce(exampleListStdout)
    await applyExperiment(exampleExecutionOptions)
    expect(mockedExecuteProcess).toBeCalledTimes(1)
  })
})

describe('removeExperiment', () => {
  it('executes a constructed command', async () => {
    mockedExecuteProcess.mockResolvedValueOnce(exampleListStdout)
    mockedExecuteProcess.mockResolvedValueOnce('output from remove')
    mockedShowQuickPick.mockResolvedValueOnce(exampleExpName)
    await removeExperiment(exampleExecutionOptions)

    expect(mockedShowInformationMessage).toBeCalledWith(
      'Experiment exp-2021 has been removed!'
    )
    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'remove', 'exp-2021'],
      cwd: defaultPath,
      env: mockedEnv
    })
  })
})

describe('branchExperiment', () => {
  const testBranchName = 'test-branch-name'

  it('gets a name from showInputBox and executes a constructed command', async () => {
    mockedExecuteProcess.mockResolvedValueOnce(exampleListStdout)
    mockedExecuteProcess.mockResolvedValueOnce('output from branch')
    mockedShowQuickPick.mockResolvedValueOnce(exampleExpName)
    mockedShowInputBox.mockResolvedValueOnce(testBranchName)

    await branchExperiment(exampleExecutionOptions)

    expect(mockedShowQuickPick).toBeCalledWith(exampleExperimentsList)
    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'branch', 'exp-2021', 'test-branch-name'],
      cwd: defaultPath,
      env: mockedEnv
    })
  })

  it('does not execute a command if the InputBox is dismissed', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    mockedExecuteProcess.mockResolvedValueOnce(exampleListStdout)
    mockedShowQuickPick.mockResolvedValueOnce(exampleExpName)
    mockedShowInputBox.mockResolvedValueOnce(undefined)
    mockedExecuteProcess.mockResolvedValueOnce('output from branch')

    await branchExperiment(exampleExecutionOptions)
    expect(mockedExecuteProcess).toBeCalledTimes(1)
  })
})
