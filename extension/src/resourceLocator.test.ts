import { Uri } from 'vscode'
import { ResourceLocator } from './resourceLocator'

jest.mock('vscode')

describe('ResourceLocator', () => {
  it('should be able to find the dvcIcon', () => {
    const mockPath = Uri.file('some/path')
    const resourceLocator = new ResourceLocator(mockPath)

    const dark = Uri.file('some/path/resources/dark/dvc-color.svg')
    const light = Uri.file('some/path/resources/light/dvc-color.svg')

    expect(resourceLocator.dvcIcon).toEqual({
      dark,
      light
    })
  })
})
