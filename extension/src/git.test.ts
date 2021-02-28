import { getRepoPathCore } from './git'
import { lstatSync } from 'fs-extra'
import { resolve } from 'path'
import { window } from 'vscode'
import { mocked } from 'ts-jest/utils'

jest.mock('vscode')

const mockedWindow = mocked(window)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getRepoPathCore', () => {
  it('should find the root directory given a directory in this project', async () => {
    const repoRoot = await getRepoPathCore(__dirname, true)

    expect(repoRoot).toBeDefined()
    if (repoRoot) {
      const gitDir = resolve(repoRoot, '.git')
      expect(lstatSync(gitDir).isDirectory).toBeTruthy()
    }
  })

  it('should find the root directory and present a warning given a directory in this project with the wrong casing', async () => {
    const mockedWarningMessage = jest.fn().mockResolvedValue(undefined)
    mockedWindow.showWarningMessage = mockedWarningMessage

    const repoRoot = await getRepoPathCore(__dirname.toUpperCase(), true)

    expect(repoRoot).toBeDefined()
    if (repoRoot) {
      const gitDir = resolve(repoRoot, '.git')
      expect(lstatSync(gitDir).isDirectory).toBeTruthy()
      expect(mockedWarningMessage).toHaveBeenCalledTimes(1)
    }
  })

  it('should return undefined given a non-existent path', async () => {
    const repoRoot = await getRepoPathCore(
      '/some/path/that/does/not/exist',
      true
    )
    expect(repoRoot).toBeUndefined()
  })
})
