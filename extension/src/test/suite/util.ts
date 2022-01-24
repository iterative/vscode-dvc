import { resolve } from 'path'
import { SinonSpy, SinonStub, spy, stub } from 'sinon'
import {
  commands,
  ConfigurationChangeEvent,
  EventEmitter,
  TextEditor,
  Uri,
  window,
  workspace
} from 'vscode'
import { CliReader } from '../../cli/reader'
import { InternalCommands } from '../../commands/internal'
import { Config } from '../../config'
import { Experiments } from '../../experiments'
import { Disposable, Disposer } from '../../extension'
import { definedAndNonEmpty } from '../../util/array'
import * as Time from '../../util/time'
import { OutputChannel } from '../../vscode/outputChannel'
import expShowFixture from '../fixtures/expShow/output'
import plotsDiffFixture from '../fixtures/plotsDiff/output'
import { BaseWebview } from '../../webview'
import { ExperimentsData } from '../../experiments/data'
import { ResourceLocator } from '../../resourceLocator'

export const extensionUri = Uri.file(resolve(__dirname, '..', '..', '..'))

export const configurationChangeEvent = (
  option: string,
  disposable: Disposer
) =>
  new Promise(resolve => {
    const listener: Disposable = workspace.onDidChangeConfiguration(
      (event: ConfigurationChangeEvent) => {
        if (event.affectsConfiguration(option)) {
          resolve(event)
        }
      }
    )
    disposable.track(listener)
  })

export const quickPickInitialized = (
  mockShowQuickPick: SinonStub,
  call: number
) =>
  new Promise(resolve => {
    mockShowQuickPick.onCall(call).callsFake((items, options) =>
      mockShowQuickPick.wrappedMethod(items, {
        ...options,
        onDidSelectItem: (item: unknown) => {
          resolve(item)
          options?.onDidSelectItem
        }
      })
    )
  })

export const selectQuickPickItem = async (number: number) => {
  for (let i = 1; i < number; i++) {
    await commands.executeCommand('workbench.action.quickOpenSelectNext')
  }
  return commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem')
}

export const experimentsUpdatedEvent = (experiments: Experiments) =>
  new Promise(resolve => {
    experiments.dispose.track(experiments.onDidChangeExperiments(resolve))
  })

export const getFirstArgOfCall = (spy: SinonSpy, call: number) =>
  spy.getCall(call).firstArg

export const getFirstArgOfLastCall = (spy: SinonSpy) =>
  getFirstArgOfCall(spy, -1)

export const activeTextEditorChangedEvent = (
  disposable: Disposer
): Promise<TextEditor | undefined> =>
  new Promise(resolve =>
    disposable.track(
      window.onDidChangeActiveTextEditor(editor => resolve(editor))
    )
  )

export const getActiveTextEditorFilename = (): string | undefined =>
  window.activeTextEditor?.document.fileName

export const closeAllEditors = async () => {
  if (definedAndNonEmpty(window.visibleTextEditors)) {
    await commands.executeCommand('workbench.action.closeAllEditors')
  }
}

export const mockDuration = (duration: number) =>
  stub(Time, 'getCurrentEpoch')
    .onFirstCall()
    .returns(0)
    .onSecondCall()
    .returns(duration)

export const buildInternalCommands = (disposer: Disposer) => {
  const config = disposer.track(new Config())
  const cliReader = disposer.track(new CliReader(config))

  const outputChannel = disposer.track(
    new OutputChannel([cliReader], '1', 'test output')
  )

  const internalCommands = disposer.track(
    new InternalCommands(outputChannel, cliReader)
  )

  return { cliReader, internalCommands }
}

export const buildMockData = <T = ExperimentsData>() =>
  ({
    dispose: stub(),
    onDidUpdate: stub()
  } as unknown as T)

export const buildDependencies = (
  disposer: Disposer,
  expShow = expShowFixture,
  plotsDiff = plotsDiffFixture
) => {
  const { cliReader, internalCommands } = buildInternalCommands(disposer)

  const mockPlotsDiff = stub(cliReader, 'plotsDiff').resolves(plotsDiff)

  const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(expShow)

  const updatesPaused = disposer.track(new EventEmitter<boolean>())

  const resourceLocator = disposer.track(new ResourceLocator(extensionUri))

  const messageSpy = spy(BaseWebview.prototype, 'show')

  return {
    cliReader,
    internalCommands,
    messageSpy,
    mockExperimentShow,
    mockPlotsDiff,
    resourceLocator,
    updatesPaused
  }
}
