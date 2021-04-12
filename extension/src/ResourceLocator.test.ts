import { Uri } from 'vscode'
import { ResourceLocator } from './ResourceLocator'

jest.mock('vscode')

describe('ResourceLocator', () => {
  it('should be able to find the dvcIconPath', () => {
    const mockPath = Uri.file('some/path')
    const resourceLocator = new ResourceLocator(mockPath)

    const dark = Uri.file('some/path/media/dvc-color.svg')
    const light = Uri.file('some/path/media/dvc-color.svg')

    expect(resourceLocator.dvcIconPath).toEqual({
      dark,
      light
    })
  })
})
