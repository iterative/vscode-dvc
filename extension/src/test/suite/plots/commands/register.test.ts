import { expect } from 'chai'
import { afterEach, before, beforeEach, describe, it, suite } from 'mocha'
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
  const disposable = getTimeSafeDisposer()

  describe('showPlots', () => {
    before(() => {
      restore()

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
    })
    beforeEach(() => {
      restore()
    })

    afterEach(() => {
      disposable.dispose()
      return closeAllEditors()
    })
    it('should show the setup if it should be shown', async () => {
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(Setup.prototype, 'shouldBeShown').returns(true)

      await commands.executeCommand(RegisteredCommands.PLOTS_SHOW)

      expect(executeCommandSpy).to.have.been.calledWithMatch(
        RegisteredCommands.SETUP_SHOW
      )
    })

    it('should not show the plots webview if the setup should be shown', async () => {
      const showPlotsWebviewSpy = stub(WorkspacePlots.prototype, 'showWebview')
      stub(Setup.prototype, 'shouldBeShown').returns(true)

      await commands.executeCommand(RegisteredCommands.PLOTS_SHOW)

      expect(showPlotsWebviewSpy).not.to.be.called
    })

    it('should not show the setup if it should not be shown', async () => {
      stub(WorkspacePlots.prototype, 'showWebview').resolves()
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.PLOTS_SHOW)

      expect(executeCommandSpy).not.to.be.calledWith(
        RegisteredCommands.SETUP_SHOW
      )
    })

    it('should show the plots webview if the setup should not be shown', async () => {
      const showPlotsWebviewSpy = stub(
        WorkspacePlots.prototype,
        'showWebview'
      ).resolves()
      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.PLOTS_SHOW)

      expect(showPlotsWebviewSpy).to.be.called
    })
  })
})
