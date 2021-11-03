import { resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { Uri, window } from 'vscode'
import { pickFile, pickResources } from './resourcePicker'

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

describe('pickResources', () => {
  it('should called window.showOpenDialog with the correct options', async () => {
    const mockedTitle = 'I decided to not decide'
    mockedShowOpenDialog.mockResolvedValueOnce(undefined)

    await pickResources(mockedTitle)

    expect(mockedShowOpenDialog).toBeCalledWith({
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: true,
      openLabel: 'Select',
      title: mockedTitle
    })
  })

  it('should return an array of uris if any are selected', async () => {
    const mockedUri = Uri.file(resolve('mock', 'multiple', 'resource', 'fun'))
    const mockedPickedUri = [mockedUri]
    const mockedTitle = 'this is even more fun'
    mockedShowOpenDialog.mockResolvedValueOnce(mockedPickedUri)

    const pickedResources = await pickResources(mockedTitle)

    expect(pickedResources).toEqual([mockedUri])
  })
})
