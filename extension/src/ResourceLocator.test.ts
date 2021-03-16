import { resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { Uri } from 'vscode'
import { ResourceLocator } from './ResourceLocator'

jest.mock('vscode')

describe('ResourceLocator', () => {
  it('should be able to find the dvcIconPath', () => {
    const mockPath = resolve('some', 'path')
    const mockSvgLocation = resolve(mockPath, 'mock.svg')
    const mockedUri = mocked(Uri)
    const mockUri = ({ file: mockSvgLocation } as unknown) as Uri
    mockedUri.file.mockReturnValue(mockUri)

    const resourceLocator = new ResourceLocator(mockPath)

    expect(resourceLocator.dvcIconPath).toEqual({
      dark: mockUri,
      light: mockUri
    })
    expect(mockedUri.file).toBeCalledTimes(2)
  })
})
