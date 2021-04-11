import { URI } from 'vscode-uri'
import { ResourceLocator } from './ResourceLocator'

describe('ResourceLocator', () => {
  it('should be able to find the dvcIconPath', () => {
    const mockPath = URI.file('some/path')
    const resourceLocator = new ResourceLocator(mockPath)

    const dark = URI.file('some/path/media/dvc-color.svg')
    const light = URI.file('some/path/media/dvc-color.svg')

    expect(resourceLocator.dvcIconPath).toEqual({
      dark,
      light
    })
  })
})
