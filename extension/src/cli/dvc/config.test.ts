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
      getPYTHONPATH: () => undefined,
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

  describe('remoteAdd', () => {
    it('should call createProcess with the correct parameters to add a remote to the config', async () => {
      const cwd = __dirname
      const stdout = ''

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const storage = 'storage'
      const url = 'url.com'
      const output = await dvcConfig.remoteAdd(cwd, Flag.PROJECT, storage, url)
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['remote', 'add', '--project', storage, url],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('remoteRename', () => {
    it('should call createProcess with the correct parameters to rename a remote in the config', async () => {
      const cwd = __dirname
      const stdout = ''

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const oldName = 'storagge'
      const newName = 'storage'
      const output = await dvcConfig.remoteRename(
        cwd,
        Flag.LOCAL,
        oldName,
        newName
      )
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['remote', 'rename', '--local', oldName, newName],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })

  describe('remoteModifyUrl', () => {
    it('should call createProcess with the correct parameters to modify a remote in the config', async () => {
      const cwd = __dirname
      const stdout = ''

      mockedCreateProcess.mockReturnValueOnce(getMockedProcess(stdout))

      const name = 'storage'
      const newUrl = 'url.com'
      const output = await dvcConfig.remoteModify(
        cwd,
        Flag.PROJECT,
        name,
        'url',
        newUrl
      )
      expect(output).toStrictEqual(stdout)

      expect(mockedCreateProcess).toHaveBeenCalledWith({
        args: ['remote', 'modify', '--project', name, 'url', newUrl],
        cwd,
        env: mockedEnv,
        executable: 'dvc'
      })
    })
  })
})
