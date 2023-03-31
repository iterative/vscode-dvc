import { join } from 'path'
import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { DOT_DVC, UNEXPECTED_ERROR_CODE } from './constants'
import { EXPERIMENT_WORKSPACE_ID } from './contract'
import { DvcReader } from './reader'
import { CliResult, CliStarted } from '..'
import { MaybeConsoleError } from '../error'
import { createProcess } from '../../process/execution'
import { getFailingMockedProcess, getMockedProcess } from '../../test/util/jest'
import { getProcessEnv } from '../../env'
import expShowFixture from '../../test/fixtures/expShow/base/output'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output/minimal'
import { Config } from '../../config'
import { joinEnvPath } from '../../util/env'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('fs')
jest.mock('../../process/execution')
jest.mock('../../env')
jest.mock('../../common/logger')

const mockedDisposable = jest.mocked(Disposable)

const mockedCreateProcess = jest.mocked(createProcess)
const mockedGetProcessEnv = jest.mocked(getProcessEnv)
const mockedEnv = {
  DVCLIVE_OPEN: 'false',
  DVC_NO_ANALYTICS: 'true',
  PATH: '/all/of/the/goodies:/in/my/path'
}
const JSON_FLAG = '--json'

const mockedGetPythonBinPath = jest.fn()

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

  const dvcReader = new DvcReader(
    {
      getCliPath: () => undefined,
      getPythonBinPath: mockedGetPythonBinPath
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

  describe('expShow', () => {
    it('should match the expected output', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(expShowFixture))
      )

      const cliOutput = await dvcReader.expShow(cwd)
      expect(cliOutput).toStrictEqual(expShowFixture)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['exp', 'show', JSON_FLAG],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should return the default output if the cli returns any type of error', async () => {
      const cwd = __dirname
      const error = new Error('unexpected error - something something')
      const unexpectedStderr = 'This is very unexpected'
      ;(error as MaybeConsoleError).exitCode = UNEXPECTED_ERROR_CODE
      ;(error as MaybeConsoleError).stderr = unexpectedStderr
      mockedCreateProcess.mockImplementationOnce(() => {
        throw error
      })

      const cliOutput = await dvcReader.expShow(cwd)
      expect(cliOutput).toStrictEqual({
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: { error: { msg: unexpectedStderr, type: 'Caught error' } }
        }
      })
    })

    it('should return the default output if the cli returns an empty object (no commits)', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify({}))
      )

      const cliOutput = await dvcReader.expShow(cwd)
      expect(cliOutput).toStrictEqual({
        [EXPERIMENT_WORKSPACE_ID]: { baseline: {} }
      })
    })
  })

  describe('dataStatus', () => {
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
      const statusOutput = await dvcReader.dataStatus(cwd)

      expect(statusOutput).toStrictEqual(cliOutput)

      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['data', 'status', '--granular', '--unchanged', JSON_FLAG],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('globalVersion', () => {
    it('should call execute process with the correct parameters (does not respect pythonBinPath)', async () => {
      const cwd = __dirname
      const stdout = '3.9.11'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))
      mockedGetPythonBinPath.mockReturnValueOnce('python')
      const output = await dvcReader.globalVersion(cwd)

      expect(output).toStrictEqual(stdout)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['--version'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should not retry if the process fails (cannot find cli - extension should reset)', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockImplementationOnce(() => {
        throw new Error('spawn dvc ENOENT retrying...')
      })

      await expect(dvcReader.globalVersion(cwd)).rejects.toBeTruthy()
    })
  })

  describe('plotsDiff', () => {
    it('should handle empty output being returned', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(''))

      const plots = await dvcReader.plotsDiff(cwd, 'HEAD')
      expect(plots).toStrictEqual({})
    })

    it('should match the expected output', async () => {
      const cwd = __dirname

      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(plotsDiffFixture))
      )

      const plots = await dvcReader.plotsDiff(cwd, 'HEAD')
      expect(plots).toStrictEqual(plotsDiffFixture)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: [
          'plots',
          'diff',
          'HEAD',
          '-o',
          join(DOT_DVC, 'tmp', 'plots'),
          '--split',
          JSON_FLAG
        ],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('root', () => {
    it('should return the root relative to the cwd', async () => {
      const stdout = join('..', '..')
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))
      const relativeRoot = await dvcReader.root(cwd)
      expect(relativeRoot).toStrictEqual(stdout)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
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

      const relativeRoot = await dvcReader.root(cwd)
      expect(relativeRoot).toBeUndefined()
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['root'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('version', () => {
    it('should call execute process with the correct parameters', async () => {
      const cwd = __dirname
      const stdout = '3.9.11'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))
      const output = await dvcReader.version(cwd)

      expect(output).toStrictEqual(stdout)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['--version'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should respect the pythonBinPath parameters', async () => {
      const cwd = __dirname
      const stdout = '2.47.0'
      const mockedPythonPath = 'some/python/path'
      const mockedPythonBinPath = [mockedPythonPath, 'python'].join('/')
      mockedGetPythonBinPath.mockReturnValue(mockedPythonBinPath)
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))
      const output = await dvcReader.version(cwd)

      expect(output).toStrictEqual(stdout)
      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['-m', 'dvc', '--version'],
        cwd,
        env: {
          ...mockedEnv,
          PATH: joinEnvPath(mockedPythonPath, mockedEnv.PATH)
        },
        executable: mockedPythonBinPath
      })
    })

    it('should not retry if the process fails (cannot find cli - extension should reset)', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockImplementationOnce(() => {
        throw new Error('spawn dvc ENOENT retrying...')
      })

      await expect(dvcReader.version(cwd)).rejects.toBeTruthy()
    })
  })
})
