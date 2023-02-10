import { expect } from 'chai'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { restore, spy, stub } from 'sinon'
import { commands } from 'vscode'
import { RegisteredCommands } from '../../../../commands/external'
import { Setup } from '../../../../setup'
import { closeAllEditors, getTimeSafeDisposer } from '../../util'
import { buildSetup } from '../../setup/util'
import { registerPlotsCommands } from '../../../../plots/commands/register'
import { buildWorkspacePlots } from '../util'
import { WorkspacePlots } from '../../../../plots/workspace'

suite('Plots commands', () => {
  describe('showPlots', () => {
    const disposable = getTimeSafeDisposer()
    const {
      internalCommands,
      config,
      messageSpy,
      resourceLocator,
      workspacePlots
    } = buildWorkspacePlots(disposable)
    const { setup } = buildSetup(disposable, {
      config,
      messageSpy,
      resourceLocator
    })
    registerPlotsCommands(workspacePlots, internalCommands, setup)

    beforeEach(() => {
      restore()
    })

    afterEach(() => {
      restore()

      disposable.dispose()
      return closeAllEditors()
    })

    it('should show the setup if it should be shown', async () => {
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(Setup.prototype, 'shouldBeShown').returns(true)

      await commands.executeCommand('dvc.showExperiments')

      expect(executeCommandSpy).to.have.been.calledWithMatch('dvc.showSetup')
    })

    it('should not show the plots webview if the setup should be shown', async () => {
      const showPlotsWebviewSpy = stub(WorkspacePlots.prototype, 'showWebview')
      stub(Setup.prototype, 'shouldBeShown').returns(true)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showPlotsWebviewSpy).not.to.be.called
    })

    it('should not show the setup if it should not be shown', async () => {
      stub(WorkspacePlots.prototype, 'showWebview').resolves()
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(executeCommandSpy).not.to.be.calledWith('dvc.showSetup')
    })

    it('should show the plots webview if the setup should not be shown', async () => {
      const showPlotsWebviewSpy = stub(
        WorkspacePlots.prototype,
        'showWebview'
      ).resolves()
      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showPlotsWebviewSpy).to.be.called
    })
  })
})
