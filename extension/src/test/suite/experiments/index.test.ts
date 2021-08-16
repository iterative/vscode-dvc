import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, workspace, Uri } from 'vscode'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import complexExperimentsOutput from '../../../experiments/webview/complex-output-example.json'
import { Experiments } from '../../../experiments'
import { ExperimentsRepository } from '../../../experiments/repository'
import { Config } from '../../../config'
import { ResourceLocator } from '../../../resourceLocator'
import * as QuickPick from '../../../vscode/quickPick'
import { setConfigValue } from '../../../vscode/config'
import { CliRunner } from '../../../cli/runner'
import { AvailableCommands, InternalCommands } from '../../../internalCommands'
import { CliExecutor } from '../../../cli/executor'
import { dvcDemoPath, resourcePath } from '../util'
import { buildMockMemento } from '../../util'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const disposable = Disposable.fn()
  const mockMemento = buildMockMemento()

  beforeEach(() => {
    restore()
    return setConfigValue('dvc.defaultProject', undefined)
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  const onDidChangeIsWebviewFocused = (
    experimentsRepository: ExperimentsRepository
  ): Promise<string | undefined> =>
    new Promise(resolve => {
      const listener: Disposable =
        experimentsRepository.onDidChangeIsWebviewFocused(
          (event: string | undefined) => {
            listener.dispose()
            return resolve(event)
          }
        )
    })

  describe('showExperimentsTable', () => {
    it("should take the config's default even if an experiments webview is focused", async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne')

      await setConfigValue('dvc.defaultProject', dvcDemoPath)

      const config = disposable.track(new Config())
      const configSpy = spy(config, 'getDefaultProject')
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsRepository = {
        'other/dvc/root': {} as ExperimentsRepository
      } as Record<string, ExperimentsRepository>

      const experiments = new Experiments(
        internalCommands,
        mockMemento,
        mockExperimentsRepository
      )
      const [experimentsRepository] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsRepository)

      await experiments.showExperimentsTable()

      expect(await focused).to.equal(dvcDemoPath)
      expect(configSpy).to.be.calledOnce
      expect(mockQuickPickOne).not.to.be.called
      expect(experiments.getFocusedTable()).to.equal(experimentsRepository)

      configSpy.resetHistory()
      mockQuickPickOne.resetHistory()

      const focusedExperimentsRepository =
        await experiments.showExperimentsTable()

      expect(focusedExperimentsRepository).to.equal(experimentsRepository)
      expect(mockQuickPickOne).not.to.be.called
      expect(configSpy).to.be.calledOnce
    })

    it('should prompt to pick a project even if a webview is focused (if no default)', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsRepository = {
        'other/dvc/root': {} as ExperimentsRepository
      } as Record<string, ExperimentsRepository>

      const experiments = new Experiments(
        internalCommands,
        mockMemento,
        mockExperimentsRepository
      )
      const [experimentsRepository] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsRepository)

      await experiments.showExperimentsTable()

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(experiments.getFocusedTable()).to.equal(experimentsRepository)

      mockQuickPickOne.resetHistory()

      const focusedExperimentsRepository =
        await experiments.showExperimentsTable()

      expect(focusedExperimentsRepository).to.equal(experimentsRepository)
      expect(mockQuickPickOne).to.be.calledOnce
    })

    it('should not prompt to pick a project if there is only one project', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )

      const experiments = new Experiments(internalCommands, mockMemento)
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

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)
      const cliRunner = disposable.track(new CliRunner(config))
      const mockRun = stub(cliRunner, 'run').resolves()

      const internalCommands = disposable.track(
        new InternalCommands(config, cliReader, cliRunner)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsRepository = {
        'other/dvc/root': { cliReader } as unknown as ExperimentsRepository
      } as Record<string, ExperimentsRepository>

      const experiments = new Experiments(
        internalCommands,
        mockMemento,
        mockExperimentsRepository
      )
      const [experimentsRepository] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsRepository)

      await experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_QUEUED
      )

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(mockRun).to.be.calledWith(dvcDemoPath, 'exp', 'run', '--run-all')
      expect(experiments.getFocusedTable()).to.equal(experimentsRepository)

      mockQuickPickOne.resetHistory()

      const focusedExperimentsRepository =
        await experiments.showExperimentsTableThenRun(
          AvailableCommands.EXPERIMENT_RUN_QUEUED
        )

      expect(focusedExperimentsRepository).to.equal(experimentsRepository)
      expect(mockQuickPickOne).not.to.be.called

      const unfocused = onDidChangeIsWebviewFocused(experimentsRepository)
      const uri = Uri.file(resolve(dvcDemoPath, 'params.yaml'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(await unfocused).to.be.undefined
      expect(experiments.getFocusedTable()).to.be.undefined

      const focusedAgain = onDidChangeIsWebviewFocused(experimentsRepository)
      await commands.executeCommand('workbench.action.previousEditor')
      expect(await focusedAgain).to.equal(dvcDemoPath)
    })
  })

  describe('dvc.queueExperiment', () => {
    it('should be able to queue an experiment', async () => {
      const mockExperimentRunQueue = stub(
        CliExecutor.prototype,
        'experimentRunQueue'
      ).resolves('true')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDefaultOrPickProject').returns(
        dvcDemoPath
      )

      await commands.executeCommand('dvc.queueExperiment')

      expect(mockExperimentRunQueue).to.be.calledOnce
      expect(mockExperimentRunQueue).to.be.calledWith(dvcDemoPath)
    })
  })
})
