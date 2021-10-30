import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { fake, restore, stub } from 'sinon'
import { window, workspace, EventEmitter, StatusBarItem } from 'vscode'
import { closeAllEditors } from './util'
import { Disposable } from '../../extension'
import { Status } from '../../status'
import { Cli, CliResult, CliStarted } from '../../cli'
import { Config } from '../../config'
import { RegisteredCommands } from '../../commands/external'

suite('Status Test Suite', () => {
  const dvcPathOption = 'dvc.dvcPath'

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(async () => {
    disposable.dispose()
    await workspace.getConfiguration().update(dvcPathOption, undefined, false)
    return closeAllEditors()
  })

  describe('Status', () => {
    const disabledText = '$(circle-slash) DVC'
    const loadingText = '$(loading~spin) DVC'
    const waitingText = '$(circle-large-outline) DVC'

    it('should show the correct status of the cli', () => {
      const cwd = __dirname
      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processStarted = disposable.track(new EventEmitter<CliStarted>())

      const cli = disposable.track(
        new Cli({} as Config, { processCompleted, processStarted })
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

      const status = disposable.track(new Status([cli]))

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
      expect(mockStatusBarItem.text).to.equal(disabledText)
      expect(mockStatusBarItem.command).to.equal(undefined)

      status.setAvailability(true)

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

      status.setAvailability(false)

      expect(mockStatusBarItem.text).to.equal(disabledText)
      expect(mockStatusBarItem.command).to.deep.equal({
        command: RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
        title: 'Setup the workspace'
      })
    })

    it('should floor the number of workers at 0', () => {
      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processStarted = disposable.track(new EventEmitter<CliStarted>())

      const cwd = __dirname

      const cli = disposable.track(
        new Cli({} as Config, { processCompleted, processStarted })
      )
      const mockStatusBarItem = {
        dispose: fake(),
        show: fake(),
        text: ''
      } as unknown as StatusBarItem
      stub(window, 'createStatusBarItem').returns(mockStatusBarItem)

      const status = disposable.track(new Status([cli]))

      const mockCliResult = {
        command: 'there is nothing currently running',
        cwd,
        duration: 2000,
        exitCode: 0,
        pid: 200
      }

      status.setAvailability(true)

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
  })
})
