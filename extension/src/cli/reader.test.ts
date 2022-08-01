import { join } from 'path'
import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { CliResult, CliStarted } from '.'
import { CliReader } from './reader'
import { createProcess } from '../processExecution'
import { getFailingMockedProcess, getMockedProcess } from '../test/util/jest'
import { getProcessEnv } from '../env'
import expShowFixture from '../test/fixtures/expShow/output'
import plotsDiffFixture from '../test/fixtures/plotsDiff/output/minimal'
import { Config } from '../config'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('fs')
jest.mock('../processExecution')
jest.mock('../env')
jest.mock('../common/logger')

const mockedDisposable = jest.mocked(Disposable)

const mockedCreateProcess = jest.mocked(createProcess)
const mockedGetProcessEnv = jest.mocked(getProcessEnv)
const mockedEnv = {
  DVCLIVE_OPEN: 'false',
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

  describe('experimentShow', () => {
    it('should match the expected output', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(expShowFixture))
      )

      const cliOutput = await cliReader.expShow(cwd)
      expect(cliOutput).toStrictEqual(expShowFixture)
      expect(mockedCreateProcess).toBeCalledWith({
        args: ['exp', 'show', SHOW_JSON],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
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
      const statusOutput = await cliReader.dataStatus(cwd)

      expect(statusOutput).toStrictEqual(cliOutput)

      expect(mockedCreateProcess).toBeCalledWith({
        args: [
          'data',
          'status',
          '--with-dirs',
          '--granular',
          '--unchanged',
          SHOW_JSON
        ],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('plotsDiff', () => {
    it('should handle empty output being returned', async () => {
      const cwd = __dirname
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(''))

      const plots = await cliReader.plotsDiff(cwd, 'HEAD')
      expect(plots).toStrictEqual({})
    })

    it('should match the expected output', async () => {
      const cwd = __dirname

      mockedCreateProcess.mockReturnValueOnce(
        getMockedProcess(JSON.stringify(plotsDiffFixture))
      )

      const plots = await cliReader.plotsDiff(cwd, 'HEAD')
      expect(plots).toStrictEqual(plotsDiffFixture)
      expect(mockedCreateProcess).toBeCalledWith({
        args: [
          'plots',
          'diff',
          'HEAD',
          '-o',
          join('.dvc', 'tmp', 'plots'),
          '--split',
          SHOW_JSON
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
      const relativeRoot = await cliReader.root(cwd)
      expect(relativeRoot).toStrictEqual(stdout)
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

  describe('version', () => {
    it('should call execute process with the correct parameters', async () => {
      const cwd = __dirname
      const stdout = '3.9.11'
      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))
      const output = await cliReader.version(cwd)

      expect(output).toStrictEqual(stdout)
      expect(mockedCreateProcess).toBeCalledWith({
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

      await expect(cliReader.version(cwd)).rejects.toBeTruthy()
    })
  })
})
