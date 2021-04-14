import { Config } from '../Config'
import {
  GcQuickPickItem,
  experimentGcCommand,
  queueExperimentCommand
} from './index'
import { mocked } from 'ts-jest/utils'
import { execPromise } from '../util'
import { basename, resolve } from 'path'
import { addTarget } from '.'
import { QuickPickOptions, window } from 'vscode'
import { GcPreserveFlag } from './commands'

jest.mock('fs')
jest.mock('../util')
jest.mock('vscode')

const mockedExecPromise = mocked(execPromise)
const mockedShowErrorMessage = mocked(window.showErrorMessage)
const mockedShowInformationMessage = mocked(window.showInformationMessage)
const mockedShowQuickPick = mocked<
  (
    items: GcQuickPickItem[],
    options: QuickPickOptions
  ) => Thenable<GcQuickPickItem[] | undefined>
>(window.showQuickPick)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('add', () => {
  it('should call execPromise with the correct parameters', async () => {
    const fsPath = __filename
    const dir = resolve(fsPath, '..')
    const file = basename(__filename)
    const stdout =
      `100% Add|████████████████████████████████████████████████` +
      `█████████████████████████████████████████████████████████` +
      `█████████████████████████████████████████████████████████` +
      `██████████████████████████████████████████|1/1 [00:00,  2` +
      `.20file/s]\n\r\n\rTo track the changes with git, run:\n\r` +
      `\n\rgit add ${file} .gitignore`

    mockedExecPromise.mockResolvedValueOnce({
      stdout,
      stderr: ''
    })

    const output = await addTarget({
      cliPath: 'dvc',
      fsPath
    })
    expect(output).toEqual(stdout)

    expect(mockedExecPromise).toBeCalledWith(`dvc add ${file}`, {
      cwd: dir
    })
  })
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
              "flag": "--all-branches",
              "label": "All Branches",
            },
            Object {
              "detail": "Preserve Experiments derived from all Git tags",
              "flag": "--all-tags",
              "label": "All Tags",
            },
            Object {
              "detail": "Preserve Experiments derived from all Git commits",
              "flag": "--all-commits",
              "label": "All Commits",
            },
            Object {
              "detail": "Preserve all queued Experiments",
              "flag": "--queued",
              "label": "Queued Experiments",
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
        flag: GcPreserveFlag.ALL_TAGS,
        label: 'All Tags'
      },
      {
        detail: 'Preserve Experiments derived from all Git commits',
        flag: GcPreserveFlag.ALL_COMMITS,
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
