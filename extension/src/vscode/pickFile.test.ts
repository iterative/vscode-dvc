import { resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { Uri, window } from 'vscode'
import { pickFile } from './pickFile'

jest.mock('vscode')

const mockedShowOpenDialog = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.showOpenDialog = mockedShowOpenDialog

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickFile', () => {
  it('should called window.showOpenDialog with the correct options', async () => {
    const mockedTitle = 'I decided to not decide'
    mockedShowOpenDialog.mockResolvedValueOnce(undefined)

    await pickFile(mockedTitle)

    expect(mockedShowOpenDialog).toBeCalledWith({
      canSelectFolders: false,
      canSelectMany: false,
      title: mockedTitle
    })
  })

  it('should return a path if a file is selected', async () => {
    const mockedUri = Uri.file(resolve('mock', 'path', 'fun'))
    const mockedPickedUri = [mockedUri]
    const mockedTitle = 'this is a fun time'
    mockedShowOpenDialog.mockResolvedValueOnce(mockedPickedUri)

    const pickedFile = await pickFile(mockedTitle)

    expect(pickedFile).toEqual(mockedUri.fsPath)
  })
})
