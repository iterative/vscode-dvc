import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { GitExecutor } from './executor'
import { createProcess } from '../../processExecution'
import { CliResult, CliStarted } from '..'
import { getMockedProcess } from '../../test/util/jest'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../../processExecution')

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

  describe('pushBranch', () => {
    it('should call createProcess with the correct parameters to push a branch', async () => {
      const cwd = __dirname
      const branchName = 'my-branch'
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(
          `branch '${branchName}' set up to track 'origin/${branchName}'.`
        )
      )

      await gitExecutor.pushBranch(cwd, branchName)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['push', '--set-upstream', 'origin', branchName],
        cwd,
        executable: 'git'
      })
    })

    it('should call createProcess with the correct parameters to push the current branch', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess('Everything up-to-date')
      )

      await gitExecutor.pushBranch(cwd)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['push', '--set-upstream', 'origin'],
        cwd,
        executable: 'git'
      })
    })
  })

  describe('stageAndCommit', () => {
    it('should call createProcess with the correct parameters to stage all file and then commit', async () => {
      const cwd = __dirname
      const message = 'best experiment'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(cwd))
      mockedCreateProcess
        .mockReturnValueOnce(getMockedProcess(''))
        .mockReturnValueOnce(
          getMockedProcess(`[current-branch 67effdbc] ${message}`)
        )

      await gitExecutor.stageAndCommit(cwd, message)
      expect(mockedCreateProcess).toBeCalledTimes(3)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['add', '.'],
        cwd,
        executable: 'git'
      })
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['commit', '-m', message],
        cwd,
        executable: 'git'
      })
    })
  })
})
