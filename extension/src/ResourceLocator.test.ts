import { mocked } from 'ts-jest/utils'
import { Uri } from 'vscode'
import { Utils } from 'vscode-uri'
import { ResourceLocator } from './ResourceLocator'

jest.mock('vscode')

const mockedJoinPath = mocked(Uri.joinPath)

describe('ResourceLocator', () => {
  it('should be able to find the dvcIconPath', () => {
    mockedJoinPath.mockImplementation(Utils.joinPath)
    const mockPath = Uri.file('some/path')
    const resourceLocator = new ResourceLocator(mockPath)

    const dark = Uri.file('some/path/media/dvc-color.svg')
    const light = Uri.file('some/path/media/dvc-color.svg')

    const mockedUriClass = mocked(Uri)

    expect(resourceLocator.dvcIconPath).toEqual({
      dark,
      light
    })
    expect(mockedUriClass.joinPath).toBeCalledTimes(2)
  })
})
