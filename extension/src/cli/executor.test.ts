import { basename, join, resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { EventEmitter } from 'vscode'
import { Config } from '../Config'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import { CliExecutor, experimentApply, init, removeTarget } from './executor'

jest.mock('vscode')
jest.mock('fs-extra')
jest.mock('../processExecution')
jest.mock('../env')
jest.mock('../vscode/EventEmitter')

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
    ({
      fire: jest.fn(),
      event: jest.fn()
    } as unknown) as EventEmitter<string>
  )

  describe('addTarget', () => {
    it('should call executeProcess with the correct parameters to add a file', async () => {
      const fsPath = __filename
      const dir = resolve(fsPath, '..')
      const file = basename(__filename)
      const stdout =
        `100% Add|████████████████████████████████████████████████` +
        `█████████████████████████████████████████████████████████` +
        `█████████████████████████████████████████████████████████` +
        `██████████████████████████████████████████|1/1 [00:00,  2` +
        `.20file/s]\n\r\n\rTo track the changes with git, run:\n\r` +
        `\n\rgit add ${file} .gitignore`

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.addTarget(fsPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['add', file],
        cwd: dir,
        env: mockedEnv
      })
    })
  })

  describe('checkout', () => {
    it('should call executeProcess with the correct parameters to checkout a repo', async () => {
      const fsPath = __dirname
      const stdout = `M       model.pt\nM       logs/\n`
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.checkout(fsPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['checkout', '-f'],
        cwd: fsPath,
        env: mockedEnv
      })
    })
  })

  describe('checkoutTarget', () => {
    it('should call executeProcess with the correct parameters to checkout a file', async () => {
      const file = 'acc.tsv'
      const dir = join(__dirname, 'logs')
      const fsPath = join(dir, 'acc.tsv')

      const stdout = 'M       ./'

      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.checkoutTarget(fsPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['checkout', '-f', file],
        cwd: dir,
        env: mockedEnv
      })
    })
  })

  describe('commit', () => {
    it('should call execPromise with the correct parameters to commit a repo', async () => {
      const cwd = __dirname
      const stdout = "Updating lock file 'dvc.lock'"
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.commit(cwd)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['commit', '-f'],
        cwd,
        env: mockedEnv
      })
    })
  })

  describe('commitTarget', () => {
    it('should call execPromise with the correct parameters to commit a target', async () => {
      const fsPath = __filename
      const dir = resolve(fsPath, '..')
      const file = basename(__filename)
      const stdout = "Updating lock file 'dvc.lock'"
      mockedExecuteProcess.mockResolvedValueOnce(stdout)

      const output = await cliExecutor.commitTarget(fsPath)
      expect(output).toEqual(stdout)

      expect(mockedExecuteProcess).toBeCalledWith({
        executable: 'dvc',
        args: ['commit', '-f', file],
        cwd: dir,
        env: mockedEnv
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
        executable: 'dvc',
        args: ['-h'],
        cwd,
        env: mockedEnv
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
          executable: 'dvc',
          args: ['pull'],
          cwd: __dirname,
          env: mockedEnv
        })
      })
    })

    describe('push', () => {
      it('should call executeProcess with the correct parameters to push the entire repository', async () => {
        const cwd = __dirname
        const stdout = 'Everything is up to date.'

        mockedExecuteProcess.mockResolvedValueOnce(stdout)

        const output = await cliExecutor.push(cwd)
        expect(output).toEqual(stdout)

        expect(mockedExecuteProcess).toBeCalledWith({
          executable: 'dvc',
          args: ['push'],
          cwd: __dirname,
          env: mockedEnv
        })
      })
    })
  })
})

describe('experimentApply', () => {
  it('builds the correct command and returns stdout', async () => {
    const cwd = ''
    const stdout = 'Test output that will be passed along'
    mockedExecuteProcess.mockResolvedValueOnce(stdout)
    expect(
      await experimentApply(
        { cwd, cliPath: 'dvc', pythonBinPath: undefined },
        'exp-test'
      )
    ).toEqual(stdout)
    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['exp', 'apply', 'exp-test'],
      cwd,
      env: mockedEnv
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

    const output = await init({
      cliPath: 'dvc',
      cwd: fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['init', '--subdir'],
      cwd: fsPath,
      env: mockedEnv
    })
  })
})

describe('removeTarget', () => {
  it('should call executeProcess with the correct parameters to remove a .dvc file', async () => {
    const file = 'data.dvc'
    const fsPath = join(__dirname, 'data.dvc')

    const stdout = ''

    mockedExecuteProcess.mockResolvedValueOnce(stdout)

    const output = await removeTarget({
      cliPath: 'dvc',
      fsPath,
      pythonBinPath: undefined
    })
    expect(output).toEqual(stdout)

    expect(mockedExecuteProcess).toBeCalledWith({
      executable: 'dvc',
      args: ['remove', file],
      cwd: __dirname,
      env: mockedEnv
    })
  })
})
