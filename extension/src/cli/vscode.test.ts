import { Config } from '../Config'
import {
  applyExperimentFromQuickPick,
  experimentGcQuickPick,
  queueExperimentCommand
} from './vscode'
import { mocked } from 'ts-jest/utils'
import { execPromise } from '../util/exec'
import { QuickPickOptions, window } from 'vscode'
import { GcPreserveFlag } from './commands'
import { QuickPickItemWithValue } from '../util/quickPick'

jest.mock('fs')
jest.mock('../util/exec')
jest.mock('vscode')

const mockedExecPromise = mocked(execPromise)
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

beforeEach(() => {
  jest.resetAllMocks()
})

const exampleConfig = {
  dvcPath: 'dvc',
  workspaceRoot: '/home/user/project'
} as Config

describe('queueExperimentCommand', () => {
  it('displays an info message with the contents of stdout when the command succeeds', async () => {
    const stdout = 'Example stdout that will be resolved literally\n'
    mockedExecPromise.mockResolvedValue({ stdout, stderr: '' })
    await queueExperimentCommand(exampleConfig)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  it('displays an error message with the contents of stderr when the command fails', async () => {
    const stderr = 'Example stderr that will be resolved literally\n'
    mockedExecPromise.mockRejectedValue({ stderr, stdout: '' })
    await queueExperimentCommand(exampleConfig)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })
})

describe('experimentGcCommand', () => {
  it('invokes a QuickPick with snapshotted options', async () => {
    await experimentGcQuickPick(exampleConfig)
    expect(mockedShowQuickPick.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Array [
            Object {
              "detail": "Preserve Experiments derived from all Git branches",
              "label": "All Branches",
              "value": "--all-branches",
            },
            Object {
              "detail": "Preserve Experiments derived from all Git tags",
              "label": "All Tags",
              "value": "--all-tags",
            },
            Object {
              "detail": "Preserve Experiments derived from all Git commits",
              "label": "All Commits",
              "value": "--all-commits",
            },
            Object {
              "detail": "Preserve all queued Experiments",
              "label": "Queued Experiments",
              "value": "--queued",
            },
          ],
          Object {
            "canPickMany": true,
            "placeHolder": "Select which Experiments to preserve",
          },
        ],
      ]
    `)
  })

  it('executes the proper command given a mocked selection', async () => {
    mockedExecPromise.mockResolvedValue({ stdout: '', stderr: '' })
    mockedShowQuickPick.mockResolvedValue([
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

    await experimentGcQuickPick(exampleConfig)

    expect(mockedExecPromise).toBeCalledWith(
      'dvc exp gc -f -w --all-tags --all-commits',
      {
        cwd: exampleConfig.workspaceRoot
      }
    )
  })

  it('reports stdout from the executed command via showInformationMessage', async () => {
    const stdout = 'example stdout that will be passed on'
    mockedShowQuickPick.mockResolvedValue([])
    mockedExecPromise.mockResolvedValue({ stdout, stderr: '' })
    await experimentGcQuickPick(exampleConfig)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  it('reports stderr from the executed command via showInformationMessage', async () => {
    const stderr = 'example stderr that will be passed on'
    mockedShowQuickPick.mockResolvedValue([])
    mockedExecPromise.mockRejectedValue({ stderr, stdout: '' })
    await experimentGcQuickPick(exampleConfig)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })

  it('reports the message from a non-shell Exception', async () => {
    const message = 'example message that will be passed on'
    mockedShowQuickPick.mockResolvedValue([])
    mockedExecPromise.mockImplementation(() => {
      throw new Error(message)
    })
    await expect(experimentGcQuickPick(exampleConfig)).rejects.toThrow()
    expect(mockedShowErrorMessage).not.toBeCalled()
  })

  it('executes the proper default command given no selections', async () => {
    mockedExecPromise.mockResolvedValue({ stdout: '', stderr: '' })
    mockedShowQuickPick.mockResolvedValue([])

    await experimentGcQuickPick(exampleConfig)

    expect(mockedExecPromise).toBeCalledWith('dvc exp gc -f -w', {
      cwd: exampleConfig.workspaceRoot
    })
  })

  it('does not execute a command if the QuickPick is dismissed', async () => {
    mockedShowQuickPick.mockResolvedValue(undefined)
    await experimentGcQuickPick(exampleConfig)
    expect(mockedExecPromise).not.toBeCalled()
  })
})

describe('applyExperimentFromQuickPick', () => {
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

  it('invokes a quickpick with a list of names from stdout and executes a constructed command', async () => {
    mockedExecPromise.mockResolvedValue({
      stdout: 'output from apply',
      stderr: ''
    })
    mockedExecPromise.mockResolvedValueOnce({
      stdout: exampleListStdout,
      stderr: ''
    })
    mockedShowQuickPick.mockResolvedValue(exampleExpName)
    await applyExperimentFromQuickPick(exampleConfig)
    expect(mockedShowQuickPick).toBeCalledWith(exampleExperimentsList)

    expect(mockedExecPromise).toBeCalledWith('dvc exp list --names-only', {
      cwd: '/home/user/project'
    })

    expect(mockedExecPromise).toBeCalledWith('dvc exp apply exp-2021', {
      cwd: '/home/user/project'
    })
  })

  it('displays an error message when there are no experiments to select', async () => {
    mockedExecPromise.mockResolvedValue({
      stdout: 'output from apply',
      stderr: ''
    })
    mockedExecPromise.mockResolvedValueOnce({
      stdout: '',
      stderr: ''
    })
    mockedShowQuickPick.mockResolvedValue(exampleExpName)
    await applyExperimentFromQuickPick(exampleConfig)
    expect(mockedShowQuickPick).not.toBeCalled()
    expect(mockedShowErrorMessage).toBeCalledWith(
      'There are no experiments to select!'
    )
  })

  it('throws when catching an error without stderr', async () => {
    mockedExecPromise.mockImplementation(() => {
      throw new Error("This didn't work!")
    })
    mockedExecPromise.mockResolvedValueOnce({
      stdout: exampleListStdout,
      stderr: ''
    })

    mockedShowQuickPick.mockResolvedValue(exampleExpName)
    await expect(applyExperimentFromQuickPick(exampleConfig)).rejects.toThrow()
  })

  it('does not execute a command if the QuickPick is dismissed', async () => {
    mockedShowQuickPick.mockResolvedValue(undefined)
    mockedExecPromise.mockResolvedValueOnce({
      stdout: exampleListStdout,
      stderr: ''
    })
    await applyExperimentFromQuickPick(exampleConfig)
    expect(mockedExecPromise).toBeCalledTimes(1)
  })
})
