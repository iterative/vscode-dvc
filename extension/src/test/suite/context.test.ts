import { resolve } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { commands, EventEmitter } from 'vscode'
import { DvcRunner } from '../../cli/dvc/runner'
import { WorkspaceExperiments } from '../../experiments/workspace'
import { Context } from '../../context'
import { FilterDefinition } from '../../experiments/model/filterBy'
import { SortDefinition } from '../../experiments/model/sortBy'

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

    const mockdvcRunner = {
      isExperimentRunning: () => runnerRunning,
      onDidCompleteProcess,
      onDidStartProcess
    } as unknown as DvcRunner
    const mockExperiments = {
      getDvcRoots: mockGetDvcRoots,
      getRepository: mockGetRepository,
      onDidChangeExperiments
    } as unknown as WorkspaceExperiments

    const context = disposable.track(
      new Context(mockExperiments, mockdvcRunner)
    )

    return {
      context,
      executeCommandSpy,
      experimentsChanged,
      mockExperiments,
      mockGetDvcRoots,
      mockGetRepository,
      mockdvcRunner,
      onDidChangeExperiments,
      onDidCompleteProcess,
      onDidStartProcess,
      processCompleted,
      processStarted
    }
  }

  const buildMockExperiments = (
    filters: FilterDefinition[] = [],
    sorts: SortDefinition[] = [],
    experimentRunning = false
  ) => {
    return {
      getFilters: () => filters,
      getSorts: () => sorts,
      hasRunningExperiment: () => experimentRunning
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
          return buildMockExperiments([], [], true)
        }
        if (dvcRoot === mockOtherDvcRoot) {
          return buildMockExperiments()
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
      mockGetRepository.callsFake(() => buildMockExperiments())

      experimentsChanged.fire()
      await experimentsChangedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiment.running',
        false
      )
    })

    it('should set the dvc.experiments.filtered context correctly depending on whether there are filters applied', async () => {
      const {
        executeCommandSpy,
        experimentsChanged,
        mockGetDvcRoots,
        mockGetRepository,
        onDidChangeExperiments
      } = buildContext(false)

      const firstExperimentsChangedEvent = new Promise(resolve =>
        disposable.track(onDidChangeExperiments(() => resolve(undefined)))
      )

      const mockDvcRoot = resolve('mock', 'root')
      mockGetDvcRoots.returns([mockDvcRoot])
      mockGetRepository.callsFake(() => buildMockExperiments())

      experimentsChanged.fire()
      await firstExperimentsChangedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiments.filtered',
        false
      )

      executeCommandSpy.resetHistory()
      mockGetRepository.resetBehavior()
      mockGetRepository.callsFake(() =>
        buildMockExperiments([{} as FilterDefinition])
      )

      const secondExperimentsChangedEvent = new Promise(resolve =>
        disposable.track(onDidChangeExperiments(() => resolve(undefined)))
      )

      experimentsChanged.fire()
      await secondExperimentsChangedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiments.filtered',
        true
      )
    })

    it('should set the dvc.experiments.sorted context correctly depending on whether there are sorts applied', async () => {
      const {
        executeCommandSpy,
        experimentsChanged,
        mockGetDvcRoots,
        mockGetRepository,
        onDidChangeExperiments
      } = buildContext(false)

      const firstExperimentsChangedEvent = new Promise(resolve =>
        disposable.track(onDidChangeExperiments(() => resolve(undefined)))
      )

      const mockDvcRoot = resolve('mock', 'root')
      mockGetDvcRoots.returns([mockDvcRoot])
      mockGetRepository.callsFake(() => buildMockExperiments())

      experimentsChanged.fire()
      await firstExperimentsChangedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiments.sorted',
        false
      )

      executeCommandSpy.resetHistory()
      mockGetRepository.resetBehavior()
      mockGetRepository.callsFake(() =>
        buildMockExperiments([], [{} as SortDefinition])
      )

      const secondExperimentsChangedEvent = new Promise(resolve =>
        disposable.track(onDidChangeExperiments(() => resolve(undefined)))
      )

      experimentsChanged.fire()
      await secondExperimentsChangedEvent

      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.experiments.sorted',
        true
      )
    })
  })
})
