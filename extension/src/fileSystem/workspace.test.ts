import { join } from 'path'
import { Uri, workspace, WorkspaceEdit } from 'vscode'
import { deleteTarget, moveTargets } from './workspace'

const mockedWorkspace = jest.mocked(workspace)
const mockedApplyEdit = jest.fn()
const mockedWorkspaceEdit = jest.mocked(WorkspaceEdit)
const mockedDeleteFile = jest.fn()
const mockedRenameFile = jest.fn()

jest.mock('vscode')
jest.mock('.')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('deleteTarget', () => {
  it('should call WorkspaceEdit deleteFile with the provided uri', async () => {
    mockedWorkspaceEdit.mockImplementationOnce(function () {
      return {
        deleteFile: mockedDeleteFile
      } as unknown as WorkspaceEdit
    })
    mockedWorkspace.applyEdit = mockedApplyEdit.mockResolvedValueOnce(true)

    const path = Uri.file(join('test', 'path'))
    const deleted = await deleteTarget(path)

    expect(mockedWorkspaceEdit).toBeCalledTimes(1)
    expect(mockedApplyEdit).toBeCalledWith({ deleteFile: mockedDeleteFile })
    expect(deleted).toBe(true)
  })
})

describe('moveTargets', () => {
  it('should call WorkspaceEdit renameFile with the provided uri', async () => {
    mockedWorkspaceEdit.mockImplementationOnce(function () {
      return {
        renameFile: mockedRenameFile
      } as unknown as WorkspaceEdit
    })
    mockedWorkspace.applyEdit = mockedApplyEdit.mockResolvedValueOnce(true)

    const filename = 'fun.txt'
    const path = Uri.file(join('test', filename))
    const destination = Uri.file(join('other', 'folder'))
    const moved = await moveTargets([path], destination)

    expect(mockedWorkspaceEdit).toBeCalledTimes(1)
    expect(mockedRenameFile).toBeCalledWith(
      path,
      Uri.joinPath(destination, filename)
    )
    expect(mockedApplyEdit).toBeCalledWith({ renameFile: mockedRenameFile })
    expect(moved).toBe(true)
  })
})
