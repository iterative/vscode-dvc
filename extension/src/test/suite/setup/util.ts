import { EventEmitter, commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { fake, stub } from 'sinon'
import { Setup } from '../../../setup/index'
import { buildDependencies, mockDisposable } from '../util'
import * as AutoInstall from '../../../setup/autoInstall'
import { DvcReader } from '../../../cli/dvc/reader'
import { DvcExecutor } from '../../../cli/dvc/executor'
import { GitReader } from '../../../cli/git/reader'
import { GitExecutor } from '../../../cli/git/executor'
import { InternalCommands } from '../../../commands/internal'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { DvcRunner } from '../../../cli/dvc/runner'
import { StopWatch } from '../../../util/time'
import { WorkspaceScale } from '../../../telemetry/collect'

export const buildSetup = (disposer: Disposer, hasData = false) => {
  const { config, messageSpy, resourceLocator } = buildDependencies(disposer)

  const mockEmitter = disposer.track(new EventEmitter())
  const mockEvent = mockEmitter.event

  const mockInitializeDvc = fake()
  const mockInitializeGit = fake()
  const mockOpenExperiments = fake()

  const mockExecuteCommand = stub(commands, 'executeCommand')

  const mockAutoInstallDvc = stub(AutoInstall, 'autoInstallDvc')
  stub(commands, 'registerCommand').returns(mockDisposable)

  const setup = disposer.track(
    new Setup(
      new StopWatch(),
      config,
      {
        init: mockInitializeDvc,
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as unknown as DvcExecutor,
      {
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as DvcReader,
      {
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as DvcRunner,
      {
        init: mockInitializeGit,
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as unknown as GitExecutor,
      {
        onDidCompleteProcess: mockEvent,
        onDidStartProcess: mockEvent
      } as GitReader,
      () => Promise.resolve([undefined]),
      () => Promise.resolve(undefined),
      {
        columnsChanged: mockEmitter,
        getHasData: () => hasData,
        showWebview: mockOpenExperiments
      } as unknown as WorkspaceExperiments,
      {
        registerExternalCliCommand: stub(),
        registerExternalCommand: stub()
      } as unknown as InternalCommands,
      resourceLocator.dvcIcon,
      () => Promise.resolve({} as WorkspaceScale)
    )
  )

  return {
    messageSpy,
    mockAutoInstallDvc,
    mockExecuteCommand,
    mockInitializeDvc,
    mockInitializeGit,
    mockOpenExperiments,
    resourceLocator,
    setup
  }
}
