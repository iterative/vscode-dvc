import { EventEmitter } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { ConfigKey, Flag, SubCommand } from './constants'
import { DvcConfig } from './config'
import { CliResult, CliStarted } from '..'
import { createProcess } from '../../process/execution'
import { getMockedProcess } from '../../test/util/jest'
import { getProcessEnv } from '../../env'
import { Config } from '../../config'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../../env')
jest.mock('../../process/execution')

const mockedDisposable = jest.mocked(Disposable)

const mockedCreateProcess = jest.mocked(createProcess)
const mockedGetProcessEnv = jest.mocked(getProcessEnv)
const mockedEnv = {
  DVCLIVE_OPEN: 'false',
  DVC_NO_ANALYTICS: 'true',
  GIT_TERMINAL_PROMPT: '0',
  PATH: '/some/special/path'
}

beforeEach(() => {
  jest.resetAllMocks()
  mockedGetProcessEnv.mockReturnValueOnce(mockedEnv)
})

describe('DvcConfig', () => {
  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    },
    untrack: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)

  const dvcConfig = new DvcConfig(
    {
      getCliPath: () => undefined,
      getPythonBinPath: () => undefined
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

  describe('config', () => {
    it('should call createProcess with the correct parameters to access the config', async () => {
      const cwd = __dirname
      const stdout = ''

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await dvcConfig.config(cwd, ConfigKey.STUDIO_OFFLINE)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['config', 'studio.offline'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })

    it('should return undefined if the underlying process throws', async () => {
      const cwd = __dirname

      mockedCreateProcess.mockImplementationOnce(() => {
        throw new Error('unable to access DVC')
      })

      const output = await dvcConfig.config(cwd, ConfigKey.STUDIO_OFFLINE)
      expect(output).toStrictEqual(undefined)
    })
  })

  describe('remote', () => {
    it('should call createProcess with the correct parameters to access the remote section of the config', async () => {
      const cwd = __dirname
      const stdout = ''

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const output = await dvcConfig.remote(cwd, SubCommand.LIST, Flag.LOCAL)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['remote', 'list', '--local'],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })
})
