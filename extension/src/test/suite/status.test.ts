import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { fake, restore, stub } from 'sinon'
import sinonChai from 'sinon-chai'
import {
  window,
  commands,
  workspace,
  EventEmitter,
  StatusBarItem
} from 'vscode'
import { Disposable } from '../../extension'
import { Status } from '../../status'
import { Cli, CliResult } from '../../cli'
import { Config } from '../../config'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all status tests.')

  const dvcPathOption = 'dvc.dvcPath'

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(async () => {
    disposable.dispose()
    await workspace.getConfiguration().update(dvcPathOption, undefined, false)
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('Status', () => {
    it('should show a spinner if the cli is running', () => {
      const processCompleted = new EventEmitter<CliResult>()
      const processStarted = new EventEmitter<void>()

      const loadingText = '$(loading~spin) DVC'
      const waitingText = 'DVC'

      const cli = new Cli({} as Config, { processCompleted, processStarted })
      const mockStatusBarItem = ({
        dispose: fake(),
        text: ''
      } as unknown) as StatusBarItem
      const mockCreateStatusBarItem = stub(
        window,
        'createStatusBarItem'
      ).returns(mockStatusBarItem)

      disposable.track(new Status([cli]))

      expect(mockCreateStatusBarItem).to.be.calledOnce
      expect(mockStatusBarItem.text).to.equal(waitingText)

      processStarted.fire()

      expect(mockStatusBarItem.text).to.equal(loadingText)

      processStarted.fire()

      expect(mockStatusBarItem.text).to.equal(loadingText)

      processCompleted.fire({ command: 'one is still running' })

      expect(mockStatusBarItem.text).to.equal(loadingText)

      processCompleted.fire({ command: 'all stopped' })

      expect(mockStatusBarItem.text).to.equal(waitingText)
    })

    it('should floor the number of workers at 0', () => {
      const processCompleted = new EventEmitter<CliResult>()
      const processStarted = new EventEmitter<void>()

      const loadingText = '$(loading~spin) DVC'
      const waitingText = 'DVC'

      const cli = new Cli({} as Config, { processCompleted, processStarted })
      const mockStatusBarItem = ({
        dispose: fake(),
        text: ''
      } as unknown) as StatusBarItem
      stub(window, 'createStatusBarItem').returns(mockStatusBarItem)

      disposable.track(new Status([cli]))

      const mockCliResult = { command: 'there is nothing currently running' }

      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)
      processCompleted.fire(mockCliResult)

      expect(mockStatusBarItem.text).to.equal(waitingText)

      processStarted.fire()
      expect(mockStatusBarItem.text).to.equal(loadingText)
    })
  })
})
