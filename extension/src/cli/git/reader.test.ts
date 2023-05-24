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

  describe('getCommitMessages', () => {
    it('should call git with the correct parameters', async () => {
      const cwd = __dirname
      const shas = [
        'c921aaa025b7c09686937e58b3dc45b83ef5c732',
        '3d702b23b17d2f0699295a0242b2c36511fb9865',
        'aaba93ee11b8c7d254775769ad342072afdfbd81'
      ]

      const gitLog = `c921aaa025b7c09686937e58b3dc45b83ef5c732
      Matt Seddon
      19 minutes ago
      refNames:branch-for-commits
      message:make another commit
      ^@3d702b23b17d2f0699295a0242b2c36511fb9865
      Matt Seddon
      19 minutes ago
      refNames:
      message:make a commit
      ^@aaba93ee11b8c7d254775769ad342072afdfbd81
      Matt Seddon
      6 hours ago
      refNames:HEAD -> main, origin/main, origin/HEAD, z-last-branch
      message:Update dependency dvc to v2.58.1 (#88)`

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(gitLog))

      const cliOutput = await gitReader.getCommitMessages(cwd, ...shas)
      expect(cliOutput).toStrictEqual(gitLog)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: [
          'log',
          ...shas,
          '--pretty=format:%H%n%an%n%ar%nrefNames:%D%nmessage:%B',
          '-z'
        ],
        cwd,
        executable: 'git'
      })
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
