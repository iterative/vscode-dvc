import { expect } from 'chai'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { restore, spy, stub } from 'sinon'
import { commands } from 'vscode'
import { RegisteredCommands } from '../../../../commands/external'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { Setup } from '../../../../setup'
import { closeAllEditors, getTimeSafeDisposer } from '../../util'
import { registerExperimentCommands } from '../../../../experiments/commands/register'
import { buildSingleRepoExperiments } from '../util'
import { buildSetup } from '../../setup/util'

suite('Experiments commands', () => {
  describe('showExperiments', () => {
    const disposable = getTimeSafeDisposer()

    const {
      workspaceExperiments,
      internalCommands,
      config,
      messageSpy,
      resourceLocator
    } = buildSingleRepoExperiments(disposable)
    const { setup } = buildSetup(disposable, {
      config,
      messageSpy,
      resourceLocator
    })
    registerExperimentCommands(workspaceExperiments, internalCommands, setup)

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

    it('should not show the experiments webview if the setup should be shown', async () => {
      const showExperimentsWebviewSpy = stub(
        WorkspaceExperiments.prototype,
        'showWebview'
      )
      stub(Setup.prototype, 'shouldBeShown').returns(true)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showExperimentsWebviewSpy).not.to.be.called
    })

    it('should not show the setup if it should not be shown', async () => {
      stub(WorkspaceExperiments.prototype, 'showWebview').resolves()
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(executeCommandSpy).not.to.be.calledWith('dvc.showSetup')
    })

    it('should show the experiments webview if the setup should not be shown', async () => {
      const showExperimentsWebviewSpy = stub(
        WorkspaceExperiments.prototype,
        'showWebview'
      ).resolves()
      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showExperimentsWebviewSpy).to.be.called
    })
  })
})
