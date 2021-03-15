import { resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { Uri } from 'vscode'
import { ResourceLocator } from './ResouceLocator'

jest.mock('vscode')

describe('ResourceLocator', () => {
  it('should be able to find the dvcIconPath', () => {
    const mockPath = resolve('some', 'path')
    const mockSvgLocation = resolve(mockPath, 'mock.svg')
    const mockUri = mocked(Uri)
    mockUri.file.mockReturnValue((mockSvgLocation as unknown) as Uri)

    const resourceLocator = new ResourceLocator(mockPath)

    expect(resourceLocator.dvcIconPath).toEqual({
      dark: mockSvgLocation,
      light: mockSvgLocation
    })
    expect(mockUri.file).toBeCalledTimes(2)
  })
})
