import { resolve } from 'path'
import { Config } from './Config'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { Repository } from './Repository'
import { window } from 'vscode'

jest.mock('./Config')

const mockedWindow = mocked(window)
mockedWindow.registerFileDecorationProvider = jest.fn()

describe('Repository', () => {
  it('should be able to be instantiated', async () => {
    const config = new Config()
    const dvcRoot = resolve(__dirname, '..', '..', 'demo')
    const decorationProvider = new DecorationProvider()
    const repository = new Repository(dvcRoot, config, decorationProvider)
    expect(repository.ready).toBeDefined()
  })
})
