import { resolve } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { commands, EventEmitter } from 'vscode'
import { CliRunner } from '../../cli/runner'
import { WorkspaceExperiments } from '../../experiments/workspace'
import { Context } from '../../context'

suite('Context Test Suite', () => {
  const disposable = Disposable.fn()

  const buildContext = (runnerRunning: boolean) => {
    const executeCommandSpy = spy(commands, 'executeCommand')

    const processStarted = disposable.track(new EventEmitter<void>())
    const processCompleted = disposable.track(new EventEmitter<void>())
    const onDidStartProcess = processStarted.event
    const onDidCompleteProcess = processCompleted.event

    const experimentsChanged = disposable.track(new EventEmitter<void>())
    const onDidChangeExperiments = experimentsChanged.event

    const mockGetDvcRoots = stub().returns([])
    const mockGetRepository = stub().returns({
      update: stub()
    })

    const mockCliRunner = {
      isExperimentRunning: () => runnerRunning,
      onDidCompleteProcess,
      onDidStartProcess
    } as unknown as CliRunner
    const mockExperiments = {
      getDvcRoots: mockGetDvcRoots,
      getRepository: mockGetRepository,
      onDidChangeExperiments
    } as unknown as WorkspaceExperiments

    const context = disposable.track(
      new Context(mockExperiments, mockCliRunner)
    )

    return {
      context,
      executeCommandSpy,
      experimentsChanged,
      mockCliRunner,
      mockExperiments,
      mockGetDvcRoots,
      mockGetRepository,
      onDidChangeExperiments,
      onDidCompleteProcess,
      onDidStartProcess,
      processCompleted,
      processStarted
    }
  }

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Context', () => {
    it('should set the dvc.experiment.running context to true whenever an experiment is running in the runner', async () => {
      const { executeCommandSpy, onDidStartProcess, processStarted } =
        buildContext(true)

      const processStartedEvent = new Promise(resolve =>
        disposable.track(onDidStartProcess(() => resolve(undefined)))
      )

      processStarted.fire()
      await processStartedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiment.running',
        true
      )
    })

    it('should set the dvc.experiment.running context to true whenever the data shows an experiment is running', async () => {
      const {
        executeCommandSpy,
        experimentsChanged,
        mockGetDvcRoots,
        mockGetRepository,
        onDidChangeExperiments
      } = buildContext(false)

      const experimentsChangedEvent = new Promise(resolve =>
        disposable.track(onDidChangeExperiments(() => resolve(undefined)))
      )

      const mockDvcRoot = resolve('first', 'root')
      const mockOtherDvcRoot = resolve('second', 'root')

      mockGetDvcRoots.returns([mockDvcRoot, mockOtherDvcRoot])
      mockGetRepository.callsFake(dvcRoot => {
        if (dvcRoot === mockDvcRoot) {
          return { hasRunningExperiment: () => true }
        }
        if (dvcRoot === mockOtherDvcRoot) {
          return { hasRunningExperiment: () => false }
        }
      })

      experimentsChanged.fire()
      await experimentsChangedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiment.running',
        true
      )
    })

    it('should set the dvc.experiment.running context to false whenever the runner is not running and the data shows no experiment is running', async () => {
      const {
        executeCommandSpy,
        experimentsChanged,
        mockGetDvcRoots,
        mockGetRepository,
        onDidChangeExperiments
      } = buildContext(false)

      const experimentsChangedEvent = new Promise(resolve =>
        disposable.track(onDidChangeExperiments(() => resolve(undefined)))
      )

      const mockDvcRoot = resolve('first', 'root')
      mockGetDvcRoots.returns([mockDvcRoot])
      mockGetRepository.callsFake(() => {
        return { hasRunningExperiment: () => false }
      })

      experimentsChanged.fire()
      await experimentsChangedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiment.running',
        false
      )
    })
  })
})
