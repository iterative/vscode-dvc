import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { GitExecutor } from './executor'
import { createProcess } from '../../process/execution'
import { CliResult, CliStarted } from '..'
import { getMockedProcess } from '../../test/util/jest'
import { standardizePath } from '../../fileSystem/path'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../../process/execution')

const mockedDisposable = jest.mocked(Disposable)

const mockedCreateProcess = jest.mocked(createProcess)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('GitExecutor', () => {
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    },
    untrack: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)

  const gitExecutor = new GitExecutor({
    processCompleted: {
      event: jest.fn(),
      fire: jest.fn()
    } as unknown as EventEmitter<CliResult>,
    processStarted: {
      event: jest.fn(),
      fire: jest.fn()
    } as unknown as EventEmitter<CliStarted>
  })

  const cwd = standardizePath(__dirname)

  describe('pushBranch', () => {
    it('should call createProcess with the correct parameters to push a branch', async () => {
      const branchName = 'my-branch'
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(
          `branch '${branchName}' set up to track 'origin/${branchName}'.`
        )
      )

      await gitExecutor.pushBranch(cwd, branchName)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['push', '--set-upstream', 'origin', branchName],
        cwd,
        executable: 'git'
      })
    })

    it('should call createProcess with the correct parameters to push the current branch', async () => {
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess('Everything up-to-date')
      )

      await gitExecutor.pushBranch(cwd)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['push', '--set-upstream', 'origin', 'HEAD'],
        cwd,
        executable: 'git'
      })
    })
  })

  describe('stageAndCommit', () => {
    it('should call createProcess with the correct parameters to stage all files and then commit', async () => {
      const message = 'best experiment'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(cwd))
      mockedCreateProcess
        .mockReturnValueOnce(getMockedProcess(''))
        .mockReturnValueOnce(
          getMockedProcess(`[current-branch 67effdbc] ${message}`)
        )

      await gitExecutor.stageAndCommit(cwd, message)
      expect(mockedCreateProcess).toHaveBeenCalledTimes(3)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['add', '.'],
        cwd,
        executable: 'git'
      })
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['commit', '-m', message],
        cwd,
        executable: 'git'
      })
    })
  })
})
