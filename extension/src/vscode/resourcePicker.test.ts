import { resolve } from 'path'
import { Uri, window } from 'vscode'
import { pickFile, pickResources } from './resourcePicker'
import { Title } from './title'

jest.mock('vscode')

const mockedShowOpenDialog = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.showOpenDialog = mockedShowOpenDialog

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickFile', () => {
  it('should called window.showOpenDialog with the correct options', async () => {
    const mockedTitle = 'I decided to not decide' as Title
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
    const mockedTitle = 'this is a fun time' as Title
    mockedShowOpenDialog.mockResolvedValueOnce(mockedPickedUri)

    const pickedFile = await pickFile(mockedTitle)

    expect(pickedFile).toStrictEqual(mockedUri.fsPath)
  })
})

describe('pickResources', () => {
  it('should called window.showOpenDialog with the correct options', async () => {
    const mockedTitle = 'I decided to not decide' as Title
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
    const mockedTitle = 'this is even more fun' as Title
    mockedShowOpenDialog.mockResolvedValueOnce(mockedPickedUri)

    const pickedResources = await pickResources(mockedTitle)

    expect(pickedResources).toStrictEqual([mockedUri])
  })
})
