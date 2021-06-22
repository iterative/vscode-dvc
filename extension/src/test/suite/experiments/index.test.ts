import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, spy, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, workspace, Uri } from 'vscode'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import complexExperimentsOutput from '../../../experiments/webview/complex-output-example.json'
import { Experiments } from '../../../experiments'
import { ExperimentsTable } from '../../../experiments/table'
import { Config } from '../../../config'
import { ResourceLocator } from '../../../resourceLocator'
import * as QuickPick from '../../../vscode/quickPick'
import { setConfigValue } from '../../../vscode/config'
import { CliRunner } from '../../../cli/runner'
import { runQueued } from '../../../experiments/runner'
import { InternalCommands } from '../../../internalCommands'
import { CliExecutor } from '../../../cli/executor'

chai.use(sinonChai)
const { expect } = chai

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')
  const resourcePath = resolve(__dirname, '..', '..', '..', '..', 'resources')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
    return setConfigValue('dvc.defaultProject', undefined)
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  const onDidChangeIsWebviewFocused = (
    experimentsTable: ExperimentsTable
  ): Promise<string | undefined> =>
    new Promise(resolve => {
      const listener: Disposable = experimentsTable.onDidChangeIsWebviewFocused(
        (event: string | undefined) => {
          listener.dispose()
          return resolve(event)
        }
      )
    })

  describe('showExperimentsTable', () => {
    it("should take the config's default even if an experiments webview is focused", async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne')
      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      await setConfigValue('dvc.defaultProject', dvcDemoPath)

      const config = disposable.track(new Config())
      const cliExecutor = disposable.track(new CliExecutor(config))
      const cliReader = disposable.track(new CliReader(config))
      const internalCommands = disposable.track(
        new InternalCommands(config, cliExecutor, cliReader)
      )
      const configSpy = spy(config, 'getDefaultProject')

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsTable = {
        'other/dvc/root': {} as ExperimentsTable
      } as Record<string, ExperimentsTable>

      const experiments = new Experiments(
        config,
        internalCommands,
        mockExperimentsTable
      )
      const [experimentsTable] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsTable)

      await experiments.showExperimentsTable()

      expect(await focused).to.equal(dvcDemoPath)
      expect(configSpy).to.be.calledOnce
      expect(mockQuickPickOne).not.to.be.called
      expect(experiments.getFocused()).to.equal(experimentsTable)

      configSpy.resetHistory()
      mockQuickPickOne.resetHistory()

      const focusedExperimentsTable = await experiments.showExperimentsTable()

      expect(focusedExperimentsTable).to.equal(experimentsTable)
      expect(mockQuickPickOne).not.to.be.called
      expect(configSpy).to.be.calledOnce
    })

    it('should prompt to pick a project even if a webview is focused (if no default)', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const config = disposable.track(new Config())
      const cliExecutor = disposable.track(new CliExecutor(config))
      const cliReader = disposable.track(new CliReader(config))
      const internalCommands = disposable.track(
        new InternalCommands(config, cliExecutor, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsTable = {
        'other/dvc/root': {} as ExperimentsTable
      } as Record<string, ExperimentsTable>

      const experiments = new Experiments(
        config,
        internalCommands,
        mockExperimentsTable
      )
      const [experimentsTable] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsTable)

      await experiments.showExperimentsTable()

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(experiments.getFocused()).to.equal(experimentsTable)

      mockQuickPickOne.resetHistory()

      const focusedExperimentsTable = await experiments.showExperimentsTable()

      expect(focusedExperimentsTable).to.equal(experimentsTable)
      expect(mockQuickPickOne).to.be.calledOnce
    })

    it('should not prompt to pick a project if there is only one project', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const config = disposable.track(new Config())
      const cliExecutor = disposable.track(new CliExecutor(config))
      const cliReader = disposable.track(new CliReader(config))
      const internalCommands = disposable.track(
        new InternalCommands(config, cliExecutor, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )

      const experiments = new Experiments(config, internalCommands)
      experiments.create([dvcDemoPath], resourceLocator)

      await experiments.isReady()

      await experiments.showExperimentsTable()

      expect(mockQuickPickOne).to.not.be.called
    })
  })

  describe('showExperimentsTableThenRun', () => {
    it('should run against an experiments table if webview is focused', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )
      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const config = disposable.track(new Config())
      const cliExecutor = disposable.track(new CliExecutor(config))
      const cliReader = disposable.track(new CliReader(config))
      const internalCommands = disposable.track(
        new InternalCommands(config, cliExecutor, cliReader)
      )
      const cliRunner = disposable.track(new CliRunner(config))
      const mockRun = stub(cliRunner, 'run').resolves()

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsTable = {
        'other/dvc/root': { cliReader } as unknown as ExperimentsTable
      } as Record<string, ExperimentsTable>

      const experiments = new Experiments(
        config,
        internalCommands,
        mockExperimentsTable
      )
      const [experimentsTable] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsTable)

      await experiments.showExperimentsTableThenRun(cliRunner, runQueued)

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(mockRun).to.be.calledWith(dvcDemoPath, 'exp', 'run', '--run-all')
      expect(experiments.getFocused()).to.equal(experimentsTable)

      mockQuickPickOne.resetHistory()

      const focusedExperimentsTable =
        await experiments.showExperimentsTableThenRun(cliRunner, runQueued)

      expect(focusedExperimentsTable).to.equal(experimentsTable)
      expect(mockQuickPickOne).not.to.be.called

      const unfocused = onDidChangeIsWebviewFocused(experimentsTable)
      const uri = Uri.file(resolve(dvcDemoPath, 'params.yaml'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(await unfocused).to.be.undefined
      expect(experiments.getFocused()).to.be.undefined

      const focusedAgain = onDidChangeIsWebviewFocused(experimentsTable)
      await commands.executeCommand('workbench.action.previousEditor')
      expect(await focusedAgain).to.equal(dvcDemoPath)
    })
  })
})
