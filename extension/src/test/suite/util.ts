/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { DvcReader } from '../../cli/dvc/reader'
import { DvcRunner } from '../../cli/dvc/runner'
import { InternalCommands } from '../../commands/internal'
import { Config } from '../../config'
import { Experiments } from '../../experiments'
import { Disposable, Disposer } from '../../extension'
import { definedAndNonEmpty } from '../../util/array'
import * as Time from '../../util/time'
import { OutputChannel } from '../../vscode/outputChannel'
import expShowFixture from '../fixtures/expShow/base/output'
import plotsDiffFixture from '../fixtures/plotsDiff/output'
import { BaseWebview } from '../../webview'
import { ExperimentsData } from '../../experiments/data'
import { ResourceLocator } from '../../resourceLocator'
import { DEFAULT_DEBOUNCE_WINDOW_MS } from '../../processManager'
import { FileSystemData } from '../../fileSystem/data'
import * as Watcher from '../../fileSystem/watcher'
import { MessageFromWebview } from '../../webview/contract'
import { PlotsData } from '../../plots/webview/contract'
import { TableData } from '../../experiments/webview/contract'
import { DvcExecutor } from '../../cli/dvc/executor'
import { GitReader } from '../../cli/git/reader'
import { GetStartedData } from '../../getStarted/webview/contract'

export const mockDisposable = {
  dispose: stub()
} as Disposable

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
          if (options?.onDidSelectItem) {
            options.onDidSelectItem(item)
          }
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

export const FIRST_TRUTHY_TIME = 1

export const getMockNow = () =>
  stub(Time, 'getCurrentEpoch').returns(FIRST_TRUTHY_TIME)

export const bypassProcessManagerDebounce = (
  mockNow: SinonStub<[], number>,
  call = 1
) => {
  mockNow.resetBehavior()
  mockNow.returns(DEFAULT_DEBOUNCE_WINDOW_MS * call + FIRST_TRUTHY_TIME)
}

export const buildInternalCommands = (disposer: Disposer) => {
  const config = disposer.track(new Config())
  const dvcReader = disposer.track(new DvcReader(config))
  const dvcRunner = disposer.track(new DvcRunner(config))
  const dvcExecutor = disposer.track(new DvcExecutor(config))
  const gitReader = disposer.track(new GitReader())

  const outputChannel = disposer.track(
    new OutputChannel([dvcReader], '1', 'test output')
  )

  const internalCommands = disposer.track(
    new InternalCommands(
      outputChannel,
      dvcExecutor,
      dvcReader,
      dvcRunner,
      gitReader
    )
  )

  return { dvcExecutor, dvcReader, dvcRunner, gitReader, internalCommands }
}

export const buildMockData = <T extends ExperimentsData | FileSystemData>() =>
  ({
    dispose: stub(),
    onDidUpdate: stub()
  } as unknown as T)

export const buildDependencies = (
  disposer: Disposer,
  expShow = expShowFixture,
  plotsDiff = plotsDiffFixture
) => {
  const { dvcExecutor, dvcReader, dvcRunner, gitReader, internalCommands } =
    buildInternalCommands(disposer)

  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(mockDisposable)

  const mockPlotsDiff = stub(dvcReader, 'plotsDiff').resolves(plotsDiff)

  const mockExperimentShow = stub(dvcReader, 'expShow').resolves(expShow)

  const updatesPaused = disposer.track(new EventEmitter<boolean>())

  const resourceLocator = disposer.track(new ResourceLocator(extensionUri))

  const messageSpy = spy(BaseWebview.prototype, 'show')

  return {
    dvcExecutor,
    dvcReader,
    dvcRunner,
    gitReader,
    internalCommands,
    messageSpy,
    mockCreateFileSystemWatcher,
    mockExperimentShow,
    mockPlotsDiff,
    resourceLocator,
    updatesPaused
  }
}

export const getMessageReceivedEmitter = (
  webview: BaseWebview<PlotsData | TableData | GetStartedData>
): EventEmitter<MessageFromWebview> => (webview as any).messageReceived

export const getInputBoxEvent = (mockInputValue: string) => {
  const mockInput = stub(window, 'showInputBox')
  return new Promise(resolve =>
    mockInput.callsFake(() => {
      resolve(mockInputValue)
      return Promise.resolve(mockInputValue)
    })
  )
}

export const stubPrivateMethod = <T>(
  classWithPrivateMethod: T,
  method: string
) => stub(classWithPrivateMethod as any, method)

export const stubPrivatePrototypeMethod = <T extends { prototype: unknown }>(
  classWithPrivateMethod: T,
  method: string
) => stubPrivateMethod(classWithPrivateMethod.prototype, method)

export const stubPrivateMemberMethod = <T>(
  classWithPrivateMember: T,
  memberName: string,
  method: string
) => stubPrivateMethod((classWithPrivateMember as any)[memberName], method)

export const spyOnPrivateMethod = <T>(
  classWithPrivateMember: T,
  method: string
) => spy(classWithPrivateMember as any, method)

export const spyOnPrivateMemberMethod = <T>(
  classWithPrivateMember: T,
  memberName: string,
  method: string
) => spy((classWithPrivateMember as any)[memberName], method)
