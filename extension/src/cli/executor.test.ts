import { join } from 'path'
import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { CliResult, CliStarted } from '.'
import { Flag, GcPreserveFlag } from './args'
import { CliExecutor } from './executor'
import { createProcess } from '../processExecution'
import { getMockedProcess } from '../test/util/jest'
import { getProcessEnv } from '../env'
import { Config } from '../config'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../processExecution')
jest.mock('../env')

const mockedDisposable = jest.mocked(Disposable)

const mockedCreateProcess = jest.mocked(createProcess)
const mockedGetProcessEnv = jest.mocked(getProcessEnv)
const mockedEnv = {
  DVC_NO_ANALYTICS: 'true',
  PATH: '/some/special/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('CliExecutor', () => {
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    },
    untrack: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)

  const cliExecutor = new CliExecutor(
    {
      getCliPath: () => undefined,
      pythonBinPath: undefined
    } as unknown as Config,
    {
      processCompleted: {
        event: jest.fn(),
        fire: jest.fn()
      } as unknown as EventEmitter<CliResult>,
      processStarted: {
        event: jest.fn(),
        fire: jest.fn()
      } as unknown as EventEmitter<CliStarted>
    }
  )

  const everythingUpToDate = 'Everything is up to date.'
  const updatingLockFile = "Updating lock file 'dvc.lock'"

  describe('add', () => {
    it('should call createProcess with the correct parameters to add a file', async () => {
      const cwd = __dirname
      const relPath = join('data', 'MNIST', 'raw')
      const stdout =
        '100% Add|████████████████████████████████████████████████' +
        '█████████████████████████████████████████████████████████' +
        '█████████████████████████████████████████████████████████' +
        '██████████████████████████████████████████|1/1 [00:00,  2' +
        '.20file/s]\n\r\n\rTo track the changes with git, run:\n\r' +
        `\n\rgit add ${relPath} .gitignore`

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.add(cwd, relPath)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['add', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('checkout', () => {
    it('should call createProcess with the correct parameters to checkout a repository', async () => {
      const fsPath = __dirname
      const stdout = 'M       model.pt\nM       logs/\n'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.checkout(fsPath)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['checkout'],
        cwd: fsPath,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force checkout a repository', async () => {
      const fsPath = __dirname
      const stdout = 'M       model.pt\nM       logs/\n'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.checkout(fsPath, Flag.FORCE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['checkout', '-f'],
        cwd: fsPath,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to checkout a file', async () => {
      const cwd = __dirname
      const relPath = join('logs', 'acc.tsv')

      const stdout = 'M       ./'

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.checkout(cwd, relPath)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['checkout', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force checkout a file', async () => {
      const cwd = __dirname
      const relPath = join('logs', 'acc.tsv')

      const stdout = 'M       ./'

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.checkout(cwd, relPath, Flag.FORCE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['checkout', relPath, '-f'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('commit', () => {
    it('should call createProcess with the correct parameters to commit a repository', async () => {
      const cwd = __dirname
      const stdout = updatingLockFile
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.commit(cwd)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['commit'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force commit a repository', async () => {
      const cwd = __dirname
      const stdout = updatingLockFile
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.commit(cwd, Flag.FORCE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['commit', '-f'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to commit a target', async () => {
      const cwd = __dirname
      const relPath = join(
        'data',
        'fashion-mnist',
        'raw',
        't10k-images-idx3-ubyte.gz'
      )
      const stdout = updatingLockFile
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.commit(cwd, relPath)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['commit', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force commit a target', async () => {
      const cwd = __dirname
      const relPath = join(
        'data',
        'fashion-mnist',
        'raw',
        't10k-images-idx3-ubyte.gz'
      )
      const stdout = updatingLockFile
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.commit(cwd, relPath, Flag.FORCE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['commit', relPath, '-f'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentApply', () => {
    it('should call createProcess with the correct parameters to apply an existing experiment to the workspace', async () => {
      const cwd = ''
      const stdout = 'Test output that will be passed along'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.experimentApply(cwd, 'exp-test')
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'apply', 'exp-test'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentBranch', () => {
    it('should call createProcess with the correct parameters to create a new branch from an existing experiment', async () => {
      const cwd = __dirname
      const stdout =
        "Git branch 'some-branch' has been created from experiment 'exp-0898f'.\n" +
        'To switch to the new branch run:\n\n' +
        '\t\tgit checkout some-branch'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.experimentBranch(
        cwd,
        'exp-0898f',
        'some-branch'
      )
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'branch', 'exp-0898f', 'some-branch'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentGarbageCollect', () => {
    it('should call createProcess with the correct parameters to garbage collect experiments', async () => {
      const cwd = __dirname
      const stdout =
        'WARNING: This will remove all experiments except those derived from the workspace of the current repo. ' +
        'Run queued experiments will be preserved. Run queued experiments will be removed.\n' +
        "Removed 45 experiments. To remove unused cache files use 'dvc gc'. "
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.experimentGarbageCollect(
        cwd,
        GcPreserveFlag.WORKSPACE,
        GcPreserveFlag.QUEUED
      )
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'gc', '-f', '--workspace', '--queued'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentRemove', () => {
    it('should call createProcess with the correct parameters to remove an existing experiment from the workspace', async () => {
      const cwd = __dirname
      const stdout = ''
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.experimentRemove(cwd, 'exp-dfd12')
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'remove', 'exp-dfd12'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentRunQueue', () => {
    it('should call createProcess with the correct parameters to queue an experiment for later execution', async () => {
      const cwd = __dirname
      const stdout = "Queued experiment 'bbf5c01' for future execution."
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.experimentRunQueue(cwd)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'run', '--queue'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('init', () => {
    it('should call createProcess with the correct parameters to initialize a project', async () => {
      const fsPath = __dirname
      const stdout = `
		Initialized DVC repository.
		You can now commit the changes to git.
		
		+---------------------------------------------------------------------+
		|                                                                     |
		|        DVC has enabled anonymous aggregate usage analytics.         |
		|     Read the analytics documentation (and how to opt-out) here:     |
		|             <https://dvc.org/doc/user-guide/analytics>              |
		|                                                                     |
		+---------------------------------------------------------------------+
		
		What's next?
		------------
		- Check out the documentation: <https://dvc.org/doc>
		- Get help and share ideas: <https://dvc.org/chat>
		- Star us on GitHub: <https://github.com/iterative/dvc>`

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.init(fsPath)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['init', '--subdir'],
        cwd: fsPath,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('move', () => {
    it('should call createProcess with the correct parameters to move a DVC tracked target', async () => {
      const cwd = __dirname
      const target = 'data/data.xml.dvc'
      const destination = 'data/data1.xml.dvc'
      const stdout = `                                                                      
			To track the changes with git, run:
			
							git add ${destination} data/.gitignore`

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.move(cwd, target, destination)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['move', target, destination],
        cwd: cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('pull', () => {
    it('should call createProcess with the correct parameters to pull the entire repository', async () => {
      const cwd = __dirname
      const stdout = 'M       data/MNIST/raw/\n1 file modified'

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.pull(cwd)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['pull'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force pull the entire repository', async () => {
      const cwd = __dirname
      const stdout = 'M       data/MNIST/raw/\n1 file modified'

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.pull(cwd, Flag.FORCE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['pull', '-f'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to pull the target', async () => {
      const cwd = __dirname
      const relPath = join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte')
      const stdout = 'M       logs/\n1 file modified'

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.pull(cwd, relPath)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['pull', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force pull a target', async () => {
      const cwd = __dirname
      const stdout = everythingUpToDate
      const relPath = join('logs', 'acc.tsv')

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.pull(
        cwd,
        relPath,
        Flag.FORCE,
        Flag.RECURSIVE
      )
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['pull', relPath, '-f', '-R'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('push', () => {
    it('should call createProcess with the correct parameters to push the entire repository', async () => {
      const cwd = __dirname
      const stdout = everythingUpToDate

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.push(cwd)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['push'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force push the entire repository', async () => {
      const cwd = __dirname
      const stdout = everythingUpToDate
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.push(cwd, Flag.FORCE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['push', '-f'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to push the target', async () => {
      const cwd = __dirname
      const relPath = join('data', 'MNIST')
      const stdout = everythingUpToDate

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.push(cwd, relPath, Flag.RECURSIVE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['push', relPath, '-R'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should call createProcess with the correct parameters to force push a target', async () => {
      const cwd = __dirname
      const stdout = everythingUpToDate
      const relPath = join('logs', 'loss.tsv')

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.push(cwd, relPath, Flag.FORCE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['push', relPath, '-f'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('remove', () => {
    it('should call createProcess with the correct parameters to remove a .dvc file', async () => {
      const cwd = __dirname
      const relPath = 'data.dvc'

      const stdout = ''

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await cliExecutor.remove(cwd, relPath)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['remove', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })
})
