import { Config } from '../Config'
import { experimentGcCommand, queueExperimentCommand } from './vscode'
import { mocked } from 'ts-jest/utils'
import { execPromise } from '../util'
import { resolve } from 'path'
import { QuickPickOptions, window } from 'vscode'
import { GcPreserveFlag } from './commands'
import { QuickPickItemWithValue } from '../util/quickPick'

jest.mock('fs')
jest.mock('../util')
jest.mock('vscode')

const mockedExecPromise = mocked(execPromise)
const mockedShowErrorMessage = mocked(window.showErrorMessage)
const mockedShowInformationMessage = mocked(window.showInformationMessage)
const mockedShowQuickPick = mocked<
  (
    items: QuickPickItemWithValue[],
    options: QuickPickOptions
  ) => Thenable<QuickPickItemWithValue[] | undefined>
>(window.showQuickPick)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('queueExperimentCommand', () => {
  const exampleConfig = ({
    dvcPath: 'dvc',
    cwd: resolve()
  } as unknown) as Config

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
  const exampleConfig = ({
    dvcPath: 'dvc',
    cwd: resolve()
  } as unknown) as Config

  it('invokes a QuickPick with snapshotted options', async () => {
    await experimentGcCommand(exampleConfig)
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

    await experimentGcCommand(exampleConfig)

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
    await experimentGcCommand(exampleConfig)
    expect(mockedShowInformationMessage).toBeCalledWith(stdout)
  })

  it('reports stderr from the executed command via showInformationMessage', async () => {
    const stderr = 'example stderr that will be passed on'
    mockedShowQuickPick.mockResolvedValue([])
    mockedExecPromise.mockRejectedValue({ stderr, stdout: '' })
    await experimentGcCommand(exampleConfig)
    expect(mockedShowErrorMessage).toBeCalledWith(stderr)
  })

  it('reports the message from a non-shell Exception', async () => {
    const message = 'example message that will be passed on'
    mockedShowQuickPick.mockResolvedValue([])
    mockedExecPromise.mockImplementation(() => {
      throw new Error(message)
    })
    await experimentGcCommand(exampleConfig)
    expect(mockedShowErrorMessage).toBeCalledWith(message)
  })

  it('executes the proper default command given no selections', async () => {
    mockedShowQuickPick.mockResolvedValue([])

    await experimentGcCommand(exampleConfig)

    expect(mockedExecPromise).toBeCalledWith('dvc exp gc -f -w', {
      cwd: exampleConfig.workspaceRoot
    })
  })

  it('does not execute a command if the QuickPick is dismissed', async () => {
    mockedShowQuickPick.mockResolvedValue(undefined)
    await experimentGcCommand(exampleConfig)
    expect(mockedExecPromise).not.toBeCalled()
  })
})
