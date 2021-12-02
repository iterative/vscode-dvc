import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { CliResult, CliStarted } from '.'
import { CliReader } from './reader'
import { createProcess } from '../processExecution'
import { getFailingMockedProcess, getMockedProcess } from '../test/util/jest'
import { getProcessEnv } from '../env'
import expShowFixture from '../test/fixtures/expShow/output'
import { plotsShowFixture } from '../test/fixtures/plotsShow/output'
import { Config } from '../config'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('fs')
jest.mock('../processExecution')
jest.mock('../env')
jest.mock('../common/logger')

const mockedDisposable = mocked(Disposable)

const mockedCreateProcess = mocked(createProcess)
const mockedGetProcessEnv = mocked(getProcessEnv)
const mockedEnv = {
  DVC_NO_ANALYTICS: 'true',
  PATH: '/all/of/the/goodies:/in/my/path'
}
const SHOW_JSON = '--show-json'

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('CliReader', () => {
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    },
    untrack: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)

  const cliReader = new CliReader(
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

  describe('experimentListCurrent', () => {
    it('should call the cli with the correct parameters to list all current experiments', async () => {
      const cwd = __dirname
      const experimentNames = ['exp-0180a', 'exp-c5444', 'exp-054c1']
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(experimentNames.join('\n'))
      )

      const experimentList = await cliReader.experimentListCurrent(cwd)
      expect(experimentList).toEqual(experimentNames)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'list', '--names-only'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('experimentShow', () => {
    it('should match the expected output', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(expShowFixture))
      )

      const experiments = await cliReader.experimentShow(cwd)
      expect(experiments).toEqual(expShowFixture)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'show', SHOW_JSON],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('diff', () => {
    it('should call the cli with the correct parameters', async () => {
      const cliOutput = {
        added: [],
        deleted: [{ path: 'data/MNIST/raw/t10k-images-idx3-ubyte' }],
        modified: [
          { path: 'data/MNIST/raw/' },
          { path: 'logs/' },
          { path: 'logs/acc.tsv' },
          { path: 'logs/loss.tsv' },
          { path: 'model.pt' },
          { path: 'predictions.json' }
        ],
        'not in cache': [],
        renamed: []
      }
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(cliOutput))
      )
      const statusOutput = await cliReader.diff(cwd)

      expect(statusOutput).toEqual(cliOutput)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['diff', SHOW_JSON],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should retry if the command returns a lock error', async () => {
      const cliOutput = ''
      const cwd = __dirname
      mockedCreateProcess
        .mockImplementationOnce(() => {
          throw new Error('I failed wit a lock error')
        })
        .mockReturnValueOnce(getMockedProcess(JSON.stringify(cliOutput)))
      const statusOutput = await cliReader.diff(cwd)

      expect(statusOutput).toEqual(cliOutput)

      expect(mockedCreateProcess).toBeCalledTimes(2)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['diff', SHOW_JSON],
        cwd,
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
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))
      const output = await cliReader.help(cwd)

      expect(output).toEqual(stdout)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['-h'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('listDvcOnlyRecursive', () => {
    it('should return all relative tracked paths', async () => {
      const cwd = __dirname
      const listOutput = [
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/t10k-images-idx3-ubyte'
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/t10k-images-idx3-ubyte.gz'
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/t10k-labels-idx1-ubyte'
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/t10k-labels-idx1-ubyte.gz'
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/train-images-idx3-ubyte'
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/train-images-idx3-ubyte.gz'
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/train-labels-idx1-ubyte'
        },
        {
          isdir: false,
          isexec: false,
          isout: false,
          path: 'data/MNIST/raw/train-labels-idx1-ubyte.gz'
        },
        { isdir: false, isexec: false, isout: false, path: 'logs/acc.tsv' },
        { isdir: false, isexec: false, isout: false, path: 'logs/loss.tsv' },
        { isdir: false, isexec: false, isout: true, path: 'model.pt' }
      ]
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(listOutput))
      )
      const tracked = await cliReader.listDvcOnlyRecursive(cwd)

      expect(tracked).toEqual(listOutput)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['list', '.', '--dvc-only', '-R', SHOW_JSON],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    describe('plotsShow', () => {
      it('should match the expected output', async () => {
        const cwd = __dirname

        mockedCreateProcess.mockReturnValueOnce(
          getMockedProcess(JSON.stringify(plotsShowFixture))
        )

        const plots = await cliReader.plotsShow(cwd)
        expect(plots).toEqual({})
        expect(mockedCreateProcess).not.toBeCalled()
        // expect(mockedCreateProcess).toBeCalledWith({
        //   args: ['plots', 'show', SHOW_JSON],
        //   cwd,
        //   env: mockedEnv,
        //   executable: 'dvc'
        // })
      })
    })

    describe('root', () => {
      it('should return the root relative to the cwd', async () => {
        const stdout = join('..', '..')
        const cwd = __dirname
        mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))
        const relativeRoot = await cliReader.root(cwd)
        expect(relativeRoot).toEqual(stdout)
        expect(mockedCreateProcess).toBeCalledWith({
          args: ['root'],
          cwd,
          env: mockedEnv,
          executable: 'dvc'
        })
      })

      it('should return undefined when run outside of a project', async () => {
        const cwd = __dirname
        mockedCreateProcess.mockReturnValueOnce(
          getFailingMockedProcess(
            "ERROR: you are not inside of a DVC repository (checked up to mount point '/' )"
          )
        )

        const relativeRoot = await cliReader.root(cwd)
        expect(relativeRoot).toBeUndefined()
        expect(mockedCreateProcess).toBeCalledWith({
          args: ['root'],
          cwd,
          env: mockedEnv,
          executable: 'dvc'
        })
      })
    })
  })

  describe('status', () => {
    it('should call the cli with the correct parameters', async () => {
      const cliOutput = {
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
          'always changed'
        ]
      }
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(cliOutput))
      )
      const diffOutput = await cliReader.status(cwd)

      expect(diffOutput).toEqual(cliOutput)

      expect(mockedCreateProcess).toBeCalledWith({
        args: ['status', SHOW_JSON],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })
})
