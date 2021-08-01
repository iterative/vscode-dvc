import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, workspace, Uri } from 'vscode'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import complexExperimentsOutput from '../../../experiments/webview/complex-output-example.json'
import complexRowData from '../../../experiments/webview/complex-row-example.json'
import complexColumnData from '../../../experiments/webview/complex-column-example.json'
import { ExperimentsRepository } from '../../../experiments/repository'
import { Config } from '../../../config'
import { ResourceLocator } from '../../../resourceLocator'
import { InternalCommands } from '../../../internalCommands'
import { ExperimentsWebview } from '../../../experiments/webview'
import { QuickPickItemWithValue } from '../../../vscode/quickPick'
import { ParamOrMetric } from '../../../experiments/webview/contract'

suite('Experiments Repository Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', '..', 'demo')
  const resourcePath = resolve(__dirname, '..', '..', '..', '..', 'resources')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('refresh', () => {
    it('should queue another update and return early if an update is in progress', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const testTable = disposable.track(
        new ExperimentsRepository(
          'demo',
          internalCommands,
          {} as ResourceLocator
        )
      )
      await testTable.isReady()
      mockExperimentShow.resetHistory()

      await Promise.all([
        testTable.refresh(),
        testTable.refresh(),
        testTable.refresh(),
        testTable.refresh(),
        testTable.refresh(),
        testTable.refresh()
      ])

      expect(mockExperimentShow).to.be.calledTwice
    })
  })

  describe('getExperimentNames', () => {
    it("should return all existing experiments' names", async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          'demo',
          internalCommands,
          {} as ResourceLocator
        )
      )
      await experimentsRepository.isReady()

      const experimentNames = experimentsRepository.getExperimentNames()

      expect(experimentNames).to.deep.equal([
        'workspace',
        'exp-05694',
        'exp-e7a67',
        'test-branch',
        'exp-83425',
        '90aea7f'
      ])
    })
  })

  describe('getExperimentByName', () => {
    it('should return the correct experiments details for the given name', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          'demo',
          internalCommands,
          {} as ResourceLocator
        )
      )
      await experimentsRepository.isReady()

      const notAnExperimentName = ':weeeee:'
      const notAnExperiment =
        experimentsRepository.getExperiment(notAnExperimentName)
      expect(notAnExperiment).to.be.undefined

      const experiment = experimentsRepository.getExperiment('exp-05694')

      expect(experiment?.checkpoint_parent).to.equal(
        'f0778b3eb6a390d6f6731c735a2a4561d1792c3a'
      )
      expect(experiment?.checkpoint_tip).to.equal(
        'd3f4a0d3661c5977540d2205d819470cf0d2145a'
      )
      expect(experiment?.hasChildren).to.equal(true)
      expect(experiment?.name).to.equal('exp-05694')
    })
  })

  describe('getCheckpointNames', () => {
    it('should return the correct checkpoint names for the given experiment name', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          'demo',
          internalCommands,
          {} as ResourceLocator
        )
      )
      await experimentsRepository.isReady()

      const notAnExperimentName = ':cartwheel:'
      const notCheckpoints =
        experimentsRepository.getCheckpointNames(notAnExperimentName)
      expect(notCheckpoints).to.be.undefined

      const checkpoints = experimentsRepository.getCheckpointNames('exp-05694')

      expect(checkpoints).to.deep.equal(['f0778b3', 'f81f1b5'])
    })
  })

  describe('showWebview', () => {
    it('should be able to make the experiment webview visible', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          dvcDemoPath,
          internalCommands,
          resourceLocator
        )
      )

      const messageSpy = spy(ExperimentsWebview.prototype, 'showExperiments')

      const webview = await experimentsRepository.showWebview()
      expect(messageSpy).to.be.calledWith({
        tableData: {
          columns: complexColumnData,
          rows: complexRowData
        }
      })

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    })

    it('should only be able to open a single experiments webview', async () => {
      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )
      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const experimentsRepository = disposable.track(
        new ExperimentsRepository(
          dvcDemoPath,
          internalCommands,
          resourceLocator
        )
      )

      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const webview = await experimentsRepository.showWebview()

      expect(windowSpy).to.have.been.calledOnce
      expect(mockExperimentShow).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockExperimentShow.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const sameWebview = await experimentsRepository.showWebview()

      expect(webview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
      expect(mockExperimentShow).not.to.have.been.called
    })
  })

  it('should be able to sort', async () => {
    const config = disposable.track(new Config())
    const cliReader = disposable.track(new CliReader(config))
    const buildTestExperiment = (testParam: number) => ({
      params: {
        'params.yaml': {
          data: { test: testParam }
        }
      }
    })
    stub(cliReader, 'experimentShow').resolves({
      testBranch: {
        baseline: { data: buildTestExperiment(10) },
        testExp1: { data: buildTestExperiment(2) },
        testExp2: { data: buildTestExperiment(1) },
        testExp3: { data: buildTestExperiment(3) }
      },
      workspace: {
        baseline: { data: buildTestExperiment(10) }
      }
    })

    const messageSpy = spy(ExperimentsWebview.prototype, 'showExperiments')

    const internalCommands = disposable.track(
      new InternalCommands(config, cliReader)
    )
    const resourceLocator = disposable.track(
      new ResourceLocator(Uri.file(resourcePath))
    )
    const experimentsRepository = disposable.track(
      new ExperimentsRepository(dvcDemoPath, internalCommands, resourceLocator)
    )
    await experimentsRepository.isReady()
    await experimentsRepository.showWebview()

    expect(messageSpy.lastCall.args[0].tableData.rows).deep.equals([
      {
        displayName: 'workspace',
        id: 'workspace',
        params: { 'params.yaml': { test: 10 } }
      },
      {
        displayName: 'testBra',
        id: 'testBranch',
        params: { 'params.yaml': { test: 10 } },
        subRows: [
          {
            displayName: 'testExp',
            id: 'testExp1',
            params: { 'params.yaml': { test: 2 } }
          },
          {
            displayName: 'testExp',
            id: 'testExp2',
            params: { 'params.yaml': { test: 1 } }
          },
          {
            displayName: 'testExp',
            id: 'testExp3',
            params: { 'params.yaml': { test: 3 } }
          }
        ]
      }
    ])

    const stubbedShowQuickPick = stub(window, 'showQuickPick')
    stubbedShowQuickPick.onFirstCall().resolves({
      label: 'test',
      value: {
        path: 'params/params.yaml/test'
      }
    } as QuickPickItemWithValue<ParamOrMetric>)

    stubbedShowQuickPick.onSecondCall().resolves({
      label: 'Ascending',
      value: false
    } as QuickPickItemWithValue<boolean>)

    const tableChangePromise = new Promise(resolve => {
      experimentsRepository.onDidChangeExperiments(resolve)
    })

    const pickPromise = experimentsRepository.buildAndAddSort()
    await pickPromise
    await tableChangePromise

    expect(messageSpy.lastCall.args[0].tableData.rows).deep.equals([
      {
        displayName: 'workspace',
        id: 'workspace',
        params: { 'params.yaml': { test: 10 } }
      },
      {
        displayName: 'testBra',
        id: 'testBranch',
        params: { 'params.yaml': { test: 10 } },
        subRows: [
          {
            displayName: 'testExp',
            id: 'testExp2',
            params: { 'params.yaml': { test: 1 } }
          },
          {
            displayName: 'testExp',
            id: 'testExp1',
            params: { 'params.yaml': { test: 2 } }
          },
          {
            displayName: 'testExp',
            id: 'testExp3',
            params: { 'params.yaml': { test: 3 } }
          }
        ]
      }
    ])
  })
})
