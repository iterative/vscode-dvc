import { mocked } from 'ts-jest/utils'
import { executeProcess } from '../../processExecution'
import { getProcessEnv } from '../../env'
import { QuickPickOptions, window } from 'vscode'
import { GcPreserveFlag } from '../../cli/args'
import { QuickPickItemWithValue } from '../../vscode/quickPick'
import {
  branchExperiment,
  garbageCollectExperiments,
  pickExperimentName,
  removeExperiment
} from './quickPick'

jest.mock('../../processExecution')
jest.mock('../../env')
jest.mock('vscode')
jest.mock('../../vscode/EventEmitter')

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

    await garbageCollectExperiments(exampleExecutionOptions)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })

  it('reports the message from a non-shell Exception', async () => {
    const exampleMessage = 'example Error message that will be shown'
    mockedShowQuickPick.mockResolvedValueOnce([])
    mockedExecuteProcess.mockRejectedValueOnce(new Error(exampleMessage))
    await garbageCollectExperiments(exampleExecutionOptions)
    expect(mockedShowErrorMessage).toBeCalledWith(exampleMessage)
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
    mockedExecuteProcess.mockResolvedValueOnce('output from branch')
    mockedShowInputBox.mockResolvedValueOnce(testBranchName)

    await branchExperiment(exampleExecutionOptions, exampleExpName)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'branch', 'exp-2021', 'test-branch-name'],
      cwd: defaultPath,
      env: mockedEnv
    })
  })
})

describe('pickExperimentName', () => {
  it('should return the name of the chosen experiment if one is selected by the user', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(exampleExpName)
    const name = await pickExperimentName(exampleExperimentsList)
    expect(name).toEqual(exampleExpName)
  })

  it('should return undefined if the user cancels the popup dialog', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    const undef = await pickExperimentName(exampleExperimentsList)
    expect(undef).toBeUndefined()
  })

  it('should call showErrorMessage when no experiment names are provided', async () => {
    await pickExperimentName([])
    expect(mockedShowErrorMessage).toHaveBeenCalledTimes(1)
  })
})
