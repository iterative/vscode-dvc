import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { GitReader } from './reader'
import { CliResult, CliStarted } from '..'
import { createProcess } from '../../process/execution'
import { getMockedProcess } from '../../test/util/jest'

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
        args: ['branch', '--no-merge'],
        cwd,
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

  describe('getCurrentBranch', () => {
    it('should match the expected output', async () => {
      const cwd = __dirname
      const branches = ['* main', 'exp-12', 'fix-bug-11', 'other']
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(branches.join('\n'))
      )

      const cliOutput = await gitReader.getCurrentBranch(cwd)
      expect(cliOutput).toStrictEqual('main')
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['branch'],
        cwd,
        executable: 'git'
      })
    })

    it('should match the expected output for detached HEAD', async () => {
      const cwd = __dirname
      const branches = [
        '* (HEAD detached at 4d06da1b)',
        'main',
        'fix-bug-11',
        'other'
      ]
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(branches.join('\n'))
      )

      const cliOutput = await gitReader.getCurrentBranch(cwd)
      expect(cliOutput).toStrictEqual('4d06da1b')
    })

    it('should return an empty string if the current branch cannot be found', async () => {
      const cwd = __dirname
      const branches = ['main', 'fix-bug-11', 'other']
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(branches.join('\n'))
      )

      const cliOutput = await gitReader.getCurrentBranch(cwd)
      expect(cliOutput).toStrictEqual('')
    })

    it('should return an empty string if the cli returns any type of error', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockImplementationOnce(() => {
        throw new Error('unexpected error - something something')
      })

      const cliOutput = await gitReader.getCurrentBranch(cwd)
      expect(cliOutput).toStrictEqual('')
    })
  })
})
