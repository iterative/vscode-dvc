import { resolve } from 'path'
import { Uri, window } from 'vscode'
import { pickFile, pickResources, pickFiles } from './resourcePicker'
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

    expect(mockedShowOpenDialog).toHaveBeenCalledWith({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: 'Select',
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

    expect(mockedShowOpenDialog).toHaveBeenCalledWith({
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

describe('pickFiles', () => {
  it('should call window.showOpenDialog with the correct options', async () => {
    const mockedTitle = 'I decided to not decide' as Title
    mockedShowOpenDialog.mockResolvedValueOnce(undefined)

    await pickFiles(mockedTitle, { Images: ['png', 'jpg'] })

    expect(mockedShowOpenDialog).toHaveBeenCalledWith({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: true,
      filters: { Images: ['png', 'jpg'] },
      openLabel: 'Select',
      title: mockedTitle
    })
  })

  it('should return an array of paths if any are selected', async () => {
    const mockedUris = [
      Uri.file(resolve('mock', 'file1.json')),
      Uri.file(resolve('mock', 'file2.json'))
    ]
    const mockedTitle = 'this is even more fun' as Title
    mockedShowOpenDialog.mockResolvedValueOnce(mockedUris)

    const pickedResources = await pickFiles(mockedTitle)

    expect(pickedResources).toStrictEqual(mockedUris.map(uri => uri.fsPath))
  })
})
