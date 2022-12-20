import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { fake, restore, stub } from 'sinon'
import { window, workspace, EventEmitter, StatusBarItem } from 'vscode'
import { closeAllEditors } from './util'
import { Disposable } from '../../extension'
import { Status } from '../../status'
import { CliResult, CliStarted } from '../../cli'
import { DvcCli } from '../../cli/dvc'
import { Config } from '../../config'
import { RegisteredCommands } from '../../commands/external'
import { Title } from '../../vscode/title'
import { ConfigKey } from '../../vscode/config'

suite('Status Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(async () => {
    disposable.dispose()
    await workspace
      .getConfiguration()
      .update(ConfigKey.DVC_PATH, undefined, false)
    return closeAllEditors()
  })

  describe('Status', () => {
    const preReadyDisabledText = '$(circle-slash) DVC'
    const disabledText = `${preReadyDisabledText} (Global)`
    const loadingText = '$(loading~spin) DVC (Global)'
    const waitingText = '$(circle-large-outline) DVC (Global)'

    it('should show the correct status of the cli', async () => {
      const cwd = __dirname
      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processStarted = disposable.track(new EventEmitter<CliStarted>())

      const cli = disposable.track(
        new DvcCli({} as Config, { processCompleted, processStarted })
      )
      const mockStatusBarItem = {
        command: undefined,
        dispose: fake(),
        show: fake(),
        text: ''
      } as unknown as StatusBarItem
      const mockCreateStatusBarItem = stub(
        window,
        'createStatusBarItem'
      ).returns(mockStatusBarItem)

      const status = disposable.track(
        new Status(
          {
            getCliPath: () => undefined,
            getPythonBinPath: () => undefined,
            isPythonExtensionUsed: () => false,
            isReady: () => Promise.resolve()
          } as unknown as Config,
          cli
        )
      )

      const firstFinishedCommand = {
        command: 'one is still running',
        cwd,
        pid: 2
      }
      const secondFinishedCommand = {
        command: 'all stopped',
        cwd,
        pid: 23452345
      }

      expect(mockCreateStatusBarItem).to.be.calledOnce
      expect(mockStatusBarItem.text).to.equal(preReadyDisabledText)
      expect(mockStatusBarItem.command).to.equal(undefined)

      await status.setAvailability(true)

      expect(mockStatusBarItem.text).to.equal(waitingText)
      expect(mockStatusBarItem.command).to.equal(undefined)

      processStarted.fire(firstFinishedCommand)

      expect(mockStatusBarItem.text).to.equal(loadingText)
      expect(mockStatusBarItem.command).to.equal(undefined)

      processStarted.fire(secondFinishedCommand)

      expect(mockStatusBarItem.text).to.equal(loadingText)
      expect(mockStatusBarItem.command).to.equal(undefined)

      processCompleted.fire({
        ...firstFinishedCommand,
        cwd,
        duration: 100,
        exitCode: 0
      })

      expect(mockStatusBarItem.text).to.equal(loadingText)
      expect(mockStatusBarItem.command).to.equal(undefined)

      processCompleted.fire({
        ...secondFinishedCommand,
        cwd,
        duration: 150,
        exitCode: 0
      })

      expect(mockStatusBarItem.text).to.equal(waitingText)
      expect(mockStatusBarItem.command).to.equal(undefined)

      await status.setAvailability(false)

      expect(mockStatusBarItem.text).to.equal(disabledText)
      expect(mockStatusBarItem.command).to.deep.equal({
        command: RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        title: Title.SETUP_WORKSPACE
      })
    })

    it('should floor the number of workers at 0', async () => {
      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processStarted = disposable.track(new EventEmitter<CliStarted>())

      const cwd = __dirname

      const cli = disposable.track(
        new DvcCli({} as Config, { processCompleted, processStarted })
      )
      const mockStatusBarItem = {
        dispose: fake(),
        show: fake(),
        text: ''
      } as unknown as StatusBarItem
      stub(window, 'createStatusBarItem').returns(mockStatusBarItem)

      const status = disposable.track(
        new Status(
          {
            getCliPath: () => undefined,
            getPythonBinPath: () => undefined,
            isPythonExtensionUsed: () => false,
            isReady: () => Promise.resolve()
          } as unknown as Config,
          cli
        )
      )

      const mockCliResult = {
        command: 'there is nothing currently running',
        cwd,
        duration: 2000,
        exitCode: 0,
        pid: 200
      }

      await status.setAvailability(true)

      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)

      expect(mockStatusBarItem.text).to.equal(waitingText)

      processStarted.fire({
        command: 'something is running now',
        cwd,
        pid: 32213423
      })
      expect(mockStatusBarItem.text).to.equal(loadingText)
    })

    it('should return the correct values dependent on the current settings', async () => {
      const mockedIsPythonExtensionUsed = stub()
      const mockGetCliPath = stub()
      const mockGetPythonBinPath = stub()

      const mockStatusBarItem = {
        dispose: fake(),
        show: fake(),
        text: ''
      } as unknown as StatusBarItem
      stub(window, 'createStatusBarItem').returns(mockStatusBarItem)

      const status = disposable.track(
        new Status({
          getCliPath: mockGetCliPath,
          getPythonBinPath: mockGetPythonBinPath,
          isPythonExtensionUsed: mockedIsPythonExtensionUsed,
          isReady: () => Promise.resolve()
        } as unknown as Config)
      )

      const setupMocks = (
        isPythonExtensionUsed: boolean,
        cliPath: string | undefined,
        pythonBinPath: string | undefined
      ) => {
        mockedIsPythonExtensionUsed.resetBehavior()
        mockGetCliPath.resetBehavior()
        mockGetPythonBinPath.resetBehavior()

        mockedIsPythonExtensionUsed.returns(isPythonExtensionUsed)
        mockGetCliPath.returns(cliPath)
        mockGetPythonBinPath.returns(pythonBinPath)
      }

      setupMocks(false, undefined, undefined)

      await status.setAvailability(true)

      expect(mockStatusBarItem.text).to.equal(waitingText)
      expect(mockStatusBarItem.tooltip).to.equal('dvc')

      const mockPythonPath = resolve('a', 'virtual', 'environment')

      setupMocks(true, undefined, mockPythonPath)

      await status.setAvailability(true)

      expect(mockStatusBarItem.text).to.equal(
        '$(circle-large-outline) DVC (Auto)'
      )
      expect(mockStatusBarItem.tooltip).to.equal(
        'Interpreter set by Python extension'
      )

      setupMocks(false, undefined, mockPythonPath)

      await status.setAvailability(true)

      expect(mockStatusBarItem.text).to.equal(
        '$(circle-large-outline) DVC (Manual)'
      )
      expect(mockStatusBarItem.tooltip).to.equal(mockPythonPath)

      const mockDvcPath = resolve('path', 'to', 'dvc')

      setupMocks(false, mockDvcPath, mockPythonPath)

      await status.setAvailability(true)

      expect(mockStatusBarItem.text).to.equal(
        '$(circle-large-outline) DVC (Global)'
      )
      expect(mockStatusBarItem.tooltip).to.equal(mockDvcPath)

      setupMocks(false, 'dvc', mockPythonPath)

      await status.setAvailability(true)

      expect(mockStatusBarItem.text).to.equal(
        '$(circle-large-outline) DVC (Global)'
      )
      expect(mockStatusBarItem.tooltip).to.equal('dvc')
    })
  })
})
