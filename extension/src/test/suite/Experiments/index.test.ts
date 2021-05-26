import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, spy, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { resolve } from 'path'
import { window, commands, workspace, Uri } from 'vscode'
import { Disposable } from '../../../extension'
import * as CliReader from '../../../cli/reader'
import complexExperimentsOutput from '../../../Experiments/Webview/complex-output-example.json'
import { ExperimentsTable, Experiments } from '../../../Experiments'
import { Config } from '../../../Config'
import { ResourceLocator } from '../../../ResourceLocator'
import * as QuickPick from '../../../vscode/quickPick'
import { setConfigValue } from '../../../vscode/config'

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
      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      await setConfigValue('dvc.defaultProject', dvcDemoPath)

      const config = disposable.track(new Config())
      const configSpy = spy(config, 'getDefaultProject')

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsTable = {
        'other/dvc/root': {} as ExperimentsTable
      } as Record<string, ExperimentsTable>

      const experiments = new Experiments(config, mockExperimentsTable)
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

      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const config = disposable.track(new Config())

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsTable = {
        'other/dvc/root': {} as ExperimentsTable
      } as Record<string, ExperimentsTable>

      const experiments = new Experiments(config, mockExperimentsTable)
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

      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const config = disposable.track(new Config())

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )

      const experiments = new Experiments(config)
      experiments.create([dvcDemoPath], resourceLocator)

      await experiments.isReady()

      await experiments.showExperimentsTable()

      expect(mockQuickPickOne).to.not.be.called
    })
  })

  describe('getExperimentsTableForCommand', () => {
    it('should return an experiments table if its webview is focused', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )
      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const config = disposable.track(new Config())

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsTable = {
        'other/dvc/root': {} as ExperimentsTable
      } as Record<string, ExperimentsTable>

      const experiments = new Experiments(config, mockExperimentsTable)
      const [experimentsTable] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsTable)

      await experiments.getExperimentsTableForCommand()

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(experiments.getFocused()).to.equal(experimentsTable)

      mockQuickPickOne.resetHistory()

      const focusedExperimentsTable = await experiments.getExperimentsTableForCommand()

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

  describe('showWebview', () => {
    it('should be able to make the experiment webview visible', async () => {
      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const config = disposable.track(new Config())

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsTable = disposable.track(
        new ExperimentsTable(dvcDemoPath, config, resourceLocator)
      )

      const webview = await experimentsTable.showWebview()

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    })

    it('should only be able to open a single experiments webview', async () => {
      const mockReader = stub(CliReader, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const config = disposable.track(new Config())
      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsTable = disposable.track(
        new ExperimentsTable(dvcDemoPath, config, resourceLocator)
      )

      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const webview = await experimentsTable.showWebview()

      expect(windowSpy).to.have.been.calledOnce
      expect(mockReader).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockReader.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const sameWebview = await experimentsTable.showWebview()

      expect(webview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
      expect(mockReader).not.to.have.been.called
    })
  })
})
