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
import { DEFAULT_DEBOUNCE_WINDOW_MS } from '../../process/manager'
import { FileSystemData } from '../../fileSystem/data'
import * as FileSystem from '../../fileSystem'
import * as Watcher from '../../fileSystem/watcher'
import { MessageFromWebview } from '../../webview/contract'
import { PlotsData } from '../../plots/webview/contract'
import { TableData } from '../../experiments/webview/contract'
import { DvcExecutor } from '../../cli/dvc/executor'
import { GitReader } from '../../cli/git/reader'
import { SetupData } from '../../setup/webview/contract'

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

export const getArgOfCall = (spy: SinonSpy, call: number, arg: number) =>
  spy.getCall(call).args[arg - 1]

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

export const closeAllTerminals = () =>
  commands.executeCommand('workbench.action.terminal.killAll')

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

  return {
    config,
    dvcExecutor,
    dvcReader,
    dvcRunner,
    gitReader,
    internalCommands
  }
}

export const buildMockData = <T extends ExperimentsData | FileSystemData>(
  update = stub()
) =>
  ({
    dispose: stub(),
    onDidUpdate: stub(),
    update
  } as unknown as T)

export const buildResourceLocator = (disposer: Disposer): ResourceLocator =>
  disposer.track(new ResourceLocator(extensionUri))

export const buildDependencies = (
  disposer: Disposer,
  expShow = expShowFixture,
  plotsDiff = plotsDiffFixture
) => {
  const {
    config,
    dvcExecutor,
    dvcReader,
    dvcRunner,
    gitReader,
    internalCommands
  } = buildInternalCommands(disposer)

  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(undefined)

  const mockCheckSignalFile = stub(FileSystem, 'checkSignalFile').resolves(
    false
  )

  const mockDataStatus = stub(dvcReader, 'dataStatus').resolves({})

  const mockPlotsDiff = stub(dvcReader, 'plotsDiff').resolves(plotsDiff)

  const mockExperimentShow = stub(dvcReader, 'expShow').resolves(expShow)

  const mockGetCommitMessages = stub(gitReader, 'getCommitMessages').resolves(
    ''
  )

  const updatesPaused = disposer.track(new EventEmitter<boolean>())

  const resourceLocator = buildResourceLocator(disposer)

  const messageSpy = spy(BaseWebview.prototype, 'show')

  return {
    config,
    dvcExecutor,
    dvcReader,
    dvcRunner,
    gitReader,
    internalCommands,
    messageSpy,
    mockCheckSignalFile,
    mockCreateFileSystemWatcher,
    mockDataStatus,
    mockExperimentShow,
    mockGetCommitMessages,
    mockPlotsDiff,
    resourceLocator,
    updatesPaused
  }
}

export const getMessageReceivedEmitter = (
  webview: BaseWebview<PlotsData | TableData | SetupData>
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

export type SafeWatcherDisposer = Disposer & {
  disposeAndFlush: () => Promise<unknown>
}

export const getTimeSafeDisposer = (): Disposer & {
  disposeAndFlush: () => Promise<unknown>
} => {
  const disposer = Disposable.fn()
  return Object.assign(disposer, {
    disposeAndFlush: () => {
      disposer.dispose()
      return Time.delay(500)
    }
  })
}
