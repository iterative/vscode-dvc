import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { Uri, workspace, WorkspaceEdit } from 'vscode'
import { deletePath } from '.'

const mockedWorkspace = mocked(workspace)
const mockedApplyEdit = jest.fn()
const mockedWorkspaceEdit = mocked(WorkspaceEdit)
const mockedDeleteFile = jest.fn()

jest.mock('vscode')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('deletePath', () => {
  it('should call WorkspaceEdit deleteFile with the provided uri', async () => {
    mockedWorkspaceEdit.mockImplementationOnce(function() {
      return ({
        deleteFile: mockedDeleteFile
      } as unknown) as WorkspaceEdit
    })
    mockedWorkspace.applyEdit = mockedApplyEdit.mockResolvedValueOnce(true)

    const uri = Uri.file(join('test', 'path'))
    const deleted = await deletePath(uri)

    expect(mockedWorkspaceEdit).toBeCalledTimes(1)
    expect(deleted).toBe(true)
    expect(mockedApplyEdit).toBeCalledWith({ deleteFile: mockedDeleteFile })
  })
})
