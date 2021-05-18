import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { window, workspace, WorkspaceEdit } from 'vscode'
import { Config } from '../Config'
import {
  deleteTarget,
  getDefaultOrPickDvcRoot,
  getDvcRootThenRun,
  pickDvcRoot
} from './workspace'
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

const mockedCwd = '/root'

const mockedGetDefaultProject = jest.fn()
const mockedGetExecutionOptions = jest.fn()
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject,
  getExecutionOptions: mockedGetExecutionOptions
} as unknown) as Config

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

describe('pickDvcRoot', () => {
  it('should return the single repository if only one is found', async () => {
    const singleRepo = '/some/other/path/to/repo/a'

    mockedGetExecutionOptions.mockResolvedValueOnce({
      cliPath: undefined,
      cwd: singleRepo,
      pythonBinPath: undefined
    })

    mockedFindDvcRootPaths.mockResolvedValueOnce([singleRepo])

    const repoRoot = await pickDvcRoot(mockedConfig)
    expect(repoRoot).toEqual(singleRepo)
  })

  it('should return the selected option if multiple repositories are found and one is selected', async () => {
    const selectedRepo = '/path/to/repo/a'
    const unselectedRepoB = '/path/to/repo/b'
    const unselectedRepoC = '/path/to/repo/c'

    mockedGetExecutionOptions.mockResolvedValueOnce({
      cliPath: undefined,
      cwd: '/path/to',
      pythonBinPath: undefined
    })

    mockedShowRepoQuickPick.mockResolvedValueOnce(selectedRepo)

    mockedFindDvcRootPaths.mockResolvedValueOnce([
      selectedRepo,
      unselectedRepoB,
      unselectedRepoC
    ])

    const repoRoot = await pickDvcRoot(mockedConfig)
    expect(repoRoot).toEqual(selectedRepo)
  })

  it('should return undefined if multiple repositories are found but none are selected', async () => {
    const selectedRepo = '/repo/path/a'
    const unselectedRepoB = '/repo/path/b'
    const unselectedRepoC = '/repo/path/c'

    mockedShowRepoQuickPick.mockResolvedValueOnce(undefined)

    mockedFindDvcRootPaths.mockResolvedValueOnce([
      selectedRepo,
      unselectedRepoB,
      unselectedRepoC
    ])

    const repoRoot = await pickDvcRoot(mockedConfig)
    expect(repoRoot).toBeUndefined()
  })
})

describe('getDefaultOrPickDvcRoot', () => {
  it('should return the default project if it is set', async () => {
    const defaultProject = `${mockedCwd}/repo/b`
    mockedGetExecutionOptions.mockResolvedValueOnce({
      cliPath: undefined,
      cwd: mockedCwd,
      pythonBinPath: undefined
    })
    mockedGetDefaultProject.mockResolvedValueOnce(defaultProject)

    const repoRoot = await getDefaultOrPickDvcRoot(mockedConfig)
    expect(repoRoot).toEqual(defaultProject)
  })
})

describe('getDvcRootThenRun', () => {
  it('should run the function if a DVC root is found or provided', async () => {
    mockedFindDvcRootPaths.mockResolvedValueOnce(['/root/nested/repo'])

    const mockedFunc = jest.fn()
    await getDvcRootThenRun(mockedConfig, mockedFunc)
    expect(mockedFunc).toBeCalledTimes(1)
  })

  it("should not run the function if a DVC root isn't found or provided", async () => {
    mockedShowRepoQuickPick.mockResolvedValueOnce(undefined)

    mockedFindDvcRootPaths.mockResolvedValueOnce([])

    const mockedFunc = jest.fn()
    await getDvcRootThenRun(mockedConfig, mockedFunc)
    expect(mockedFunc).toBeCalledTimes(0)
  })
})
