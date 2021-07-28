import { join, relative, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, Uri, QuickPickItem } from 'vscode'
import { Disposable } from '../../../../../extension'
import { CliReader } from '../../../../../cli/reader'
import complexExperimentsOutput from '../../../../../experiments/webview/complex-output-example.json'
import complexColumnData from '../../../../../experiments/webview/complex-column-example.json'
import complexRowData from '../../../../../experiments/webview/complex-row-example.json'
import { Experiments } from '../../../../../experiments'
import { ExperimentsRepository } from '../../../../../experiments/repository'
import { Config } from '../../../../../config'
import { ResourceLocator } from '../../../../../resourceLocator'
import { CliRunner } from '../../../../../cli/runner'
import { InternalCommands } from '../../../../../internalCommands'
import { ExperimentsFilterByTree } from '../../../../../experiments/model/filterBy/tree'
import {
  getFilterId,
  Operator
} from '../../../../../experiments/model/filterBy'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments filter by tree tests.')

  const dvcDemoPath = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'demo'
  )
  const resourcePath = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'resources'
  )
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('experimentsFilterByTree', () => {
    it('should be able to update the table data by adding and removing a filter', async () => {
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

      const lossFilter = {
        operator: Operator.LESS_THAN_OR_EQUAL,
        path: lossPath,
        value: '1.6170'
      }

      const loss = complexColumnData.find(
        paramOrMetric => paramOrMetric.path === lossPath
      )
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: lossFilter.operator } as unknown as QuickPickItem)
      mockShowInputBox.resolves(lossFilter.value)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Experiments as any).prototype,
        'getFocusedOrDefaultOrPickProject'
      ).returns(dvcDemoPath)

      const tableFilterAdded = new Promise(resolve => {
        experimentsRepository.onDidChangeExperiments(resolve)
      })

      // eslint-disable-next-line sonarjs/no-duplicate-string
      await commands.executeCommand('dvc.addExperimentsTableFilter')

      await tableFilterAdded

      const [workspace, testBranch, master] = complexRowData

      const filteredRows = [
        workspace,
        {
          ...testBranch,
          subRows: testBranch.subRows?.map(experiment => ({
            ...experiment,
            subRows: experiment.subRows?.filter(checkpoint => {
              const loss = checkpoint.metrics?.['summary.json']?.loss
              return loss && loss <= 1.617
            })
          }))
        },
        { ...master, subRows: [] }
      ]

      expect(messageSpy).to.be.calledWith({
        tableData: {
          columns: complexColumnData,
          rows: filteredRows
        }
      })

      const tableFilterRemoved = new Promise(resolve => {
        experimentsRepository.onDidChangeExperiments(resolve)
      })

      messageSpy.resetHistory()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((ExperimentsFilterByTree as any).prototype, 'getDetails').callsFake(
        (id: string) => [dvcDemoPath, relative(dvcDemoPath, id)]
      )

      await commands.executeCommand(
        'dvc.views.experimentsFilterByTree.removeFilter',
        join(dvcDemoPath, getFilterId(lossFilter))
      )
      await tableFilterRemoved

      expect(messageSpy).to.be.calledWith({
        tableData: {
          columns: complexColumnData,
          rows: complexRowData
        }
      })
    })

    it('should be able to remove all filters with dvc.views.experimentsFilterByTree.removeAllFilters', async () => {
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

      const lossPath = 'metrics/summary.json/loss'

      const loss = complexColumnData.find(
        paramOrMetric => paramOrMetric.path === lossPath
      )
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: '<' } as unknown as QuickPickItem)
      mockShowInputBox.resolves('2')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Experiments as any).prototype,
        'getFocusedOrDefaultOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand('dvc.addExperimentsTableFilter')

      mockShowQuickPick.resetHistory()
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: '>' } as unknown as QuickPickItem)
      mockShowInputBox.resolves('0')

      await commands.executeCommand('dvc.addExperimentsTableFilter')

      mockShowQuickPick.resetHistory()
      mockShowQuickPick.onFirstCall().resolves(undefined)

      await commands.executeCommand('dvc.removeExperimentsTableFilters')

      expect(mockShowQuickPick).to.be.calledWith(
        [
          {
            description: '< 2',
            label: lossPath,
            value: { operator: '<', path: lossPath, value: '2' }
          },
          {
            description: '> 0',
            label: lossPath,
            value: { operator: '>', path: lossPath, value: '0' }
          }
        ],
        { canPickMany: true, title: 'Select filter(s) to remove' }
      )

      mockShowInputBox.resetHistory()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDvcRoots').returns([dvcDemoPath])
      stub(Experiments.prototype, 'isReady').resolves(undefined)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((ExperimentsFilterByTree as any).prototype, 'getDetails').callsFake(
        (id: string) => [dvcDemoPath, relative(dvcDemoPath, id)]
      )

      await commands.executeCommand(
        'dvc.views.experimentsFilterByTree.removeAllFilters'
      )

      await commands.executeCommand('dvc.removeExperimentsTableFilters')

      expect(mockShowInputBox).not.to.be.called
    })
  })
})
