import { join, relative, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, Uri, QuickPickItem } from 'vscode'
import { Disposable } from '../../../../extension'
import { CliReader } from '../../../../cli/reader'
import complexExperimentsOutput from '../../../../experiments/webview/complex-output-example.json'
import complexColumnData from '../../../../experiments/webview/complex-column-example.json'
import complexRowData from '../../../../experiments/webview/complex-row-example.json'
import { Experiments } from '../../../../experiments'
import { ExperimentsRepository } from '../../../../experiments/repository'
import { Config } from '../../../../config'
import { ResourceLocator } from '../../../../resourceLocator'
import { CliRunner } from '../../../../cli/runner'
import { InternalCommands } from '../../../../internalCommands'
import { ExperimentsFilterByTree } from '../../../../experiments/views/filterByTree'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')
  const resourcePath = resolve(__dirname, '..', '..', '..', '..', 'resources')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('experimentsFilterByTree', () => {
    it('should be able to add and remove a given filter', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockShowInputBox = stub(window, 'showInputBox')

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)
      const cliRunner = disposable.track(new CliRunner(config))

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader, cliRunner)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )

      const experimentsRepository = new ExperimentsRepository(
        dvcDemoPath,
        internalCommands,
        resourceLocator
      )

      await experimentsRepository.isReady()
      const experimentsWebview = await experimentsRepository.showWebview()
      await experimentsWebview.isReady()
      const messageSpy = spy(experimentsWebview, 'showExperiments')

      const lossPath = 'metrics/summary.json/loss'

      const loss = complexColumnData.find(column => column.path === lossPath)
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: '>' } as unknown as QuickPickItem)
      mockShowInputBox.resolves('10')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Experiments as any).prototype,
        'getFocusedOrDefaultOrPickProject'
      ).returns(dvcDemoPath)

      const tableFilteredPromise = new Promise(resolve => {
        experimentsRepository.onDidChangeExperimentsRows(resolve)
      })

      await commands.executeCommand('dvc.addExperimentsTableFilter')

      await tableFilteredPromise

      expect(messageSpy).to.be.calledWith({
        tableData: {
          columns: complexColumnData,
          rows: []
        }
      })

      const tableUnfilteredPromise = new Promise(resolve => {
        experimentsRepository.onDidChangeExperimentsRows(resolve)
      })

      messageSpy.resetHistory()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((ExperimentsFilterByTree as any).prototype, 'getDetails').callsFake(
        (path: string) => [dvcDemoPath, relative(dvcDemoPath, path)]
      )

      await commands.executeCommand(
        'dvc.views.experimentsFilterByTree.removeFilter',
        [join(dvcDemoPath, lossPath), '>10'].join('')
      )
      await tableUnfilteredPromise

      expect(messageSpy).to.be.calledWith({
        tableData: {
          columns: complexColumnData,
          rows: complexRowData
        }
      })
    })
  })
})
