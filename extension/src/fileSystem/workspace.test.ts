import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { window, workspace, WorkspaceEdit } from 'vscode'
import { Config } from '../Config'
import { deleteTarget, pickSingleRepositoryRoot } from './workspace'
import { findDvcRootPaths } from '.'

const mockedWorkspace = mocked(workspace)
const mockedApplyEdit = jest.fn()
const mockedWorkspaceEdit = mocked(WorkspaceEdit)
const mockedDeleteFile = jest.fn()
const mockedFindDvcRootPaths = mocked(findDvcRootPaths)

const mockedShowRepoQuickPick = mocked<
  (
    items: string[],
    options: { canPickMany: false }
  ) => Thenable<string | undefined>
>(window.showQuickPick)

jest.mock('vscode')
jest.mock('.')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('deleteTarget', () => {
  it('should call WorkspaceEdit deleteFile with the provided uri', async () => {
    mockedWorkspaceEdit.mockImplementationOnce(function() {
      return ({
        deleteFile: mockedDeleteFile
      } as unknown) as WorkspaceEdit
    })
    mockedWorkspace.applyEdit = mockedApplyEdit.mockResolvedValueOnce(true)

    const path = join('test', 'path')
    const deleted = await deleteTarget(path)

    expect(mockedWorkspaceEdit).toBeCalledTimes(1)
    expect(mockedApplyEdit).toBeCalledWith({ deleteFile: mockedDeleteFile })
    expect(deleted).toBe(true)
  })
})

describe('pickSingleRepositoryRoot', () => {
  it('should return the optional repository if provided', async () => {
    const cwd = '/some/path/to'
    const optionallyProvidedRepo = `${cwd}/repo/b`

    const mockedConfig = ({
      getExecutionOptions: () => ({
        cliPath: undefined,
        cwd,
        pythonBinPath: undefined
      })
    } as unknown) as Config

    const repoRoot = await pickSingleRepositoryRoot(
      mockedConfig,
      optionallyProvidedRepo
    )
    expect(repoRoot).toEqual(optionallyProvidedRepo)
  })

  it('should return the single repository if only one is found', async () => {
    const singleRepo = '/some/other/path/to/repo/a'

    const mockedConfig = ({
      getExecutionOptions: () => ({
        cliPath: undefined,
        cwd: singleRepo,
        pythonBinPath: undefined
      })
    } as unknown) as Config

    mockedFindDvcRootPaths.mockResolvedValueOnce([singleRepo])

    const repoRoot = await pickSingleRepositoryRoot(mockedConfig)
    expect(repoRoot).toEqual(singleRepo)
  })

  it('should return the selected option if multiple repositories are found and one is selected', async () => {
    const selectedRepo = '/path/to/repo/a'
    const unselectedRepoB = '/path/to/repo/b'
    const unselectedRepoC = '/path/to/repo/c'

    const mockedConfig = ({
      getExecutionOptions: () => ({
        cliPath: undefined,
        cwd: '/path/to',
        pythonBinPath: undefined
      })
    } as unknown) as Config

    mockedShowRepoQuickPick.mockResolvedValueOnce(selectedRepo)

    mockedFindDvcRootPaths.mockResolvedValueOnce([
      selectedRepo,
      unselectedRepoB,
      unselectedRepoC
    ])

    const repoRoot = await pickSingleRepositoryRoot(mockedConfig)
    expect(repoRoot).toEqual(selectedRepo)
  })

  it('should return undefined if multiple repositories are found but none are selected', async () => {
    const selectedRepo = '/repo/path/a'
    const unselectedRepoB = '/repo/path/b'
    const unselectedRepoC = '/repo/path/c'

    const mockedConfig = ({
      getExecutionOptions: () => ({
        cliPath: undefined,
        cwd: '/some/path/to',
        pythonBinPath: undefined
      })
    } as unknown) as Config

    mockedShowRepoQuickPick.mockResolvedValueOnce(undefined)

    mockedFindDvcRootPaths.mockResolvedValueOnce([
      selectedRepo,
      unselectedRepoB,
      unselectedRepoC
    ])

    const repoRoot = await pickSingleRepositoryRoot(mockedConfig)
    expect(repoRoot).toBeUndefined()
  })
})
