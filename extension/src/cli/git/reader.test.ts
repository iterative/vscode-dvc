import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { GitReader } from './reader'
import { CliResult, CliStarted } from '..'
import { createProcess } from '../../process/execution'
import { getFailingMockedProcess, getMockedProcess } from '../../test/util/jest'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('fs')
jest.mock('../../process/execution')
jest.mock('../../env')
jest.mock('../../common/logger')

const mockedDisposable = jest.mocked(Disposable)

const mockedCreateProcess = jest.mocked(createProcess)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('GitReader', () => {
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    },
    untrack: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)

  const gitReader = new GitReader({
    processCompleted: {
      event: jest.fn(),
      fire: jest.fn()
    } as unknown as EventEmitter<CliResult>,
    processStarted: {
      event: jest.fn(),
      fire: jest.fn()
    } as unknown as EventEmitter<CliStarted>
  })

  describe('getBranches', () => {
    it('should match the expected output', async () => {
      const cwd = __dirname
      const branches = ['main', 'exp-12', 'fix-bug-11', 'other']
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(branches.join('\n'))
      )

      const cliOutput = await gitReader.getBranches(cwd)
      expect(cliOutput).toStrictEqual(branches)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['branch'],
        cwd,
        env: { GIT_OPTIONAL_LOCKS: '0', LANG: 'en_US.UTF-8' },
        executable: 'git'
      })
    })

    it('should return an empty array if the cli returns any type of error', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockImplementationOnce(() => {
        throw new Error('unexpected error - something something')
      })

      const cliOutput = await gitReader.getBranches(cwd)
      expect(cliOutput).toStrictEqual([])
    })
  })

  describe('version', () => {
    it('should return the expected output', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess('git version 2.41.0')
      )

      const cliOutput = await gitReader.gitVersion(cwd)
      expect(cliOutput).toBeDefined()
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['version'],
        cwd,
        executable: 'git'
      })
    })

    it('should not fail if git is not available', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getFailingMockedProcess('git is not available')
      )

      const cliOutput = await gitReader.gitVersion(cwd)
      expect(cliOutput).toBeUndefined()
    })
  })
})
