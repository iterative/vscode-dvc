import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { EventEmitter } from 'vscode'
import { CliResult } from '.'
import { GcPreserveFlag } from './args'
import { CliExecutor } from './executor'
import { getProcessEnv } from '../env'
import { Config } from '../config'
import { executeProcess } from '../processExecution'

jest.mock('vscode')
jest.mock('../processExecution')
jest.mock('../env')

const mockedExecuteProcess = mocked(executeProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  PATH: '/some/special/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('CliExecutor', () => {
  const cliExecutor = new CliExecutor(
    ({
      getCliPath: () => undefined,
      pythonBinPath: undefined
    } as unknown) as Config,
    {
      processCompleted: ({
        event: jest.fn(),
        fire: jest.fn()
      } as unknown) as EventEmitter<CliResult>,
      processStarted: ({
        event: jest.fn(),
        fire: jest.fn()
      } as unknown) as EventEmitter<void>
    }
  )

  const everythingUpToDate = 'Everything is up to date.'

  describe('addTarget', () => {
    it('should call executeProcess with the correct parameters to add a file', async () => {
      const cwd = __dirname
      const relPath = join('data', 'MNIST', 'raw')
      const stdout =
        `100% Add|████████████████████████████████████████████████` +
        `█████████████████████████████████████████████████████████` +
        `█████████████████████████████████████████████████████████` +
        `██████████████████████████████████████████|1/1 [00:00,  2` +
        `.20file/s]\n\r\n\rTo track the changes with git, run:\n\r` +
        `\n\rgit add ${relPath} .gitignore`

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.addTarget(cwd, relPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['add', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('checkout', () => {
    it('should call executeProcess with the correct parameters to checkout a repository', async () => {
      const fsPath = __dirname
      const stdout = `M       model.pt\nM       logs/\n`
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.checkout(fsPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['checkout'],
        cwd: fsPath,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('checkoutTarget', () => {
    it('should call executeProcess with the correct parameters to checkout a file', async () => {
      const cwd = __dirname
      const relPath = join('logs', 'acc.tsv')

      const stdout = 'M       ./'

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.checkoutTarget(cwd, relPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['checkout', '-f', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('commit', () => {
    it('should call executeProcess with the correct parameters to commit a repository', async () => {
      const cwd = __dirname
      const stdout = "Updating lock file 'dvc.lock'"
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.commit(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['commit'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('commitTarget', () => {
    it('should call executeProcess with the correct parameters to commit a target', async () => {
      const cwd = __dirname
      const relPath = join(
        'data',
        'fashion-mnist',
        'raw',
        't10k-images-idx3-ubyte.gz'
      )
      const stdout = "Updating lock file 'dvc.lock'"
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.commitTarget(cwd, relPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['commit', '-f', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentApply', () => {
    it('should call executeProcess with the correct parameters to apply an existing experiment to the workspace', async () => {
      const cwd = ''
      const stdout = 'Test output that will be passed along'
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.experimentApply(cwd, 'exp-test')
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['exp', 'apply', 'exp-test'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentBranch', () => {
    it('should call executeProcess with the correct parameters to create a new branch from an existing experiment', async () => {
      const cwd = __dirname
      const stdout =
        `Git branch 'some-branch' has been created from experiment 'exp-0898f'.\n` +
        `To switch to the new branch run:\n\n` +
        `\t\tgit checkout some-branch`
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.experimentBranch(
        cwd,
        'exp-0898f',
        'some-branch'
      )
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['exp', 'branch', 'exp-0898f', 'some-branch'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentGarbageCollect', () => {
    it('should call executeProcess with the correct parameters to garbage collect experiments', async () => {
      const cwd = __dirname
      const stdout =
        `WARNING: This will remove all experiments except those derived from the workspace of the current repo. ` +
        `Run queued experiments will be preserved. Run queued experiments will be removed.\n` +
        `Removed 45 experiments. To remove unused cache files use 'dvc gc'. `
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.experimentGarbageCollect(cwd, [
        GcPreserveFlag.QUEUED
      ])
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['exp', 'gc', '-f', '-w', '--queued'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentRemove', () => {
    it('should call executeProcess with the correct parameters to remove an existing experiment from the workspace', async () => {
      const cwd = __dirname
      const stdout = ''
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.experimentRemove(cwd, 'exp-dfd12')
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['exp', 'remove', 'exp-dfd12'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentRunQueue', () => {
    it('should call executeProcess with the correct parameters to queue an experiment for later execution', async () => {
      const cwd = __dirname
      const stdout = "Queued experiment 'bbf5c01' for future execution."
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.experimentRunQueue(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['exp', 'run', '--queue'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('forceCheckout', () => {
    it('should call executeProcess with the correct parameters to force checkout a repository', async () => {
      const fsPath = __dirname
      const stdout = `M       model.pt\nM       logs/\n`
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.forceCheckout(fsPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['checkout', '-f'],
        cwd: fsPath,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('forceCommit', () => {
    it('should call executeProcess with the correct parameters to force commit a repository', async () => {
      const cwd = __dirname
      const stdout = 'Updating lock file'
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.forceCommit(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['commit', '-f'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('forcePull', () => {
    it('should call executeProcess with the correct parameters to force pull the entire repository', async () => {
      const cwd = __dirname
      const stdout = 'M       data/MNIST/raw/\n1 file modified'

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.forcePull(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['pull', '-f'],
        cwd: __dirname,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('forcePush', () => {
    it('should call executeProcess with the correct parameters to force push the entire repository', async () => {
      const cwd = __dirname
      const stdout = everythingUpToDate
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.forcePush(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['push', '-f'],
        cwd: __dirname,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('help', () => {
    it('should call execute process with the correct parameters', async () => {
      const cwd = __dirname
      const stdout = `
	  	Available Commands:
		COMMAND            Use \`dvc COMMAND --help\` for command-specific help.
			init             Initialize DVC in the current directory.
			get              Download file or directory tracked by DVC or by Git.
			get-url          Download or copy files from URL.
			destroy          Remove DVC files, local DVC config and data cache.
			add              Track data files or directories with DVC.
			remove           Remove stages from dvc.yaml and/or stop tracking files or directories.
			move             Rename or move a DVC controlled data file or a directory.
			unprotect        Unprotect tracked files or directories (when hardlinks or symlinks have been enabled with \`dvc config cache.type\`).
			run              Generate a dvc.yaml file from a command and execute the command.
			repro            Reproduce complete or partial pipelines by executing their stages.
			pull             Download tracked files or directories from remote storage.
			push             Upload tracked files or directories to remote storage.
			fetch            Download files or directories from remote storage to the cache.
			status           Show changed stages, compare local cache and a remote storage.
			gc               Garbage collect unused objects from cache or remote storage.
			import           Download file or directory tracked by DVC or by Git into the workspace, and track it.
			import-url       Download or copy file from URL and take it under DVC control.
			config           Get or set config options.
			checkout         Checkout data files from cache.
			remote           Set up and manage data remotes.
			cache            Manage cache settings.
			metrics          Commands to display and compare metrics.
			params           Commands to display params.
			install          Install DVC git hooks into the repository.
			root             Return the relative path to the root of the DVC project.
			list             List repository contents, including files and directories tracked by DVC and by Git.
			freeze           Freeze stages or .dvc files.
			unfreeze         Unfreeze stages or .dvc files.
			dag              Visualize DVC project DAG.
			commit           Record changes to files or directories tracked by DVC by storing the current versions in the cache.
			completion       Generate shell tab completion.
			diff             Show added, modified, or deleted data between commits in the DVC repository, or between a commit and the workspace.
			version (doctor)
							Display the DVC version and system/environment information.
			update           Update data artifacts imported from other DVC repositories.
			plots            Commands to visualize and compare plot metrics in structured files (JSON, YAML, CSV, TSV).
			stage            Commands to list and create stages.
			experiments (exp)
							Commands to run and compare experiments.
			check-ignore     Check whether files or directories are excluded due to \`.dvcignore\`.`
      mockedExecuteProcess.mockResolvedValueOnce(stdout)
      const output = await cliExecutor.help(cwd)

      expect(output).toEqual(stdout)
      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['-h'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('init', () => {
    it('should call executeProcess with the correct parameters to initialize a project', async () => {
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

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.init(fsPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['init', '--subdir'],
        cwd: fsPath,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('pull', () => {
    it('should call executeProcess with the correct parameters to pull the entire repository', async () => {
      const cwd = __dirname
      const stdout = 'M       data/MNIST/raw/\n1 file modified'

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.pull(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['pull'],
        cwd: __dirname,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('pullTarget', () => {
    it('should call executeProcess with the correct parameters to pull the target', async () => {
      const cwd = __dirname
      const relPath = join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte')
      const stdout = 'M       logs/\n1 file modified'

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.pullTarget(cwd, relPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['pull', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('push', () => {
    it('should call executeProcess with the correct parameters to push the entire repository', async () => {
      const cwd = __dirname
      const stdout = everythingUpToDate

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.push(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['push'],
        cwd: __dirname,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('pushTarget', () => {
    it('should call executeProcess with the correct parameters to push the target', async () => {
      const cwd = __dirname
      const relPath = join('data', 'MNIST')
      const stdout = everythingUpToDate

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.pushTarget(cwd, relPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['push', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('removeTarget', () => {
    it('should call executeProcess with the correct parameters to remove a .dvc file', async () => {
      const cwd = __dirname
      const relPath = 'data.dvc'

      const stdout = ''

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.removeTarget(cwd, relPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        args: ['remove', relPath],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })
})
