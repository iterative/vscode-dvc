import { UNSELECTED } from '.'
import {
  collectColoredStatus,
  collectFinishedRunningExperiments
} from './collect'
import { copyOriginalColors } from './colors'
import { Experiment } from '../../webview/contract'
import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID,
  Executor
} from '../../../cli/dvc/contract'

describe('collectColoredStatus', () => {
  const buildMockExperiments = (n: number, prefix = 'exp') => {
    const mockExperiments: Experiment[] = []
    for (let id = 0; id < n; id++) {
      mockExperiments.push({
        id: `${prefix}${id + 1}`
      } as Experiment)
    }
    return mockExperiments
  }

  it('should set unseen experiments to unselected', () => {
    const experiments = [{ id: 'exp1' }] as Experiment[]
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {},
      copyOriginalColors(),
      new Set(),
      {}
    )

    expect(availableColors).toStrictEqual(colors)
    expect(coloredStatus).toStrictEqual({
      exp1: UNSELECTED
    })
  })

  it('should not push queued experiments into the returned object', () => {
    const experiments = [
      { id: 'exp1' },
      { id: 'exp2', status: ExperimentStatus.QUEUED }
    ] as Experiment[]
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {},
      copyOriginalColors(),
      new Set(),
      {}
    )

    expect(availableColors).toStrictEqual(colors)
    expect(coloredStatus).toStrictEqual({
      exp1: UNSELECTED
    })
  })

  it('should not set more than 7 experiments to selected', () => {
    const experiments = buildMockExperiments(8)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {
        exp1: colors[0],
        exp2: colors[1],
        exp3: colors[2],
        exp4: colors[3],
        exp5: colors[4],
        exp6: colors[5],
        exp7: colors[6]
      },
      [],
      new Set(['exp8']),
      {}
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[0],
      exp2: colors[1],
      exp3: colors[2],
      exp4: colors[3],
      exp5: colors[4],
      exp6: colors[5],
      exp7: colors[6],
      exp8: UNSELECTED
    })
  })

  it('should drop colors when the experiment is no longer present', () => {
    const experiments = buildMockExperiments(1)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {
        exp2: UNSELECTED,
        exp3: colors[2],
        exp4: UNSELECTED,
        exp5: colors[1],
        exp6: UNSELECTED,
        exp7: colors[0],
        exp8: UNSELECTED
      },
      copyOriginalColors().slice(3),
      new Set(['exp1']),
      {}
    )

    expect(coloredStatus).toStrictEqual({ exp1: colors[0] })
    expect(availableColors).toStrictEqual(colors.slice(1))
  })

  it('should respect existing experiment colors', () => {
    const experiments = buildMockExperiments(10)
    const colors = copyOriginalColors()
    const unassignedColors = copyOriginalColors().slice(2)

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {
        exp1: UNSELECTED,
        exp10: colors[0],
        exp2: UNSELECTED,
        exp9: colors[1]
      },
      unassignedColors,
      new Set(),
      {}
    )

    expect(coloredStatus).toStrictEqual({
      exp1: UNSELECTED,
      exp10: colors[0],
      exp2: UNSELECTED,
      exp3: UNSELECTED,
      exp4: UNSELECTED,
      exp5: UNSELECTED,
      exp6: UNSELECTED,
      exp7: UNSELECTED,
      exp8: UNSELECTED,
      exp9: colors[1]
    })
    expect(availableColors).toStrictEqual(unassignedColors)
  })

  it('should not unselect an experiment that is existing and selected', () => {
    const experiments = buildMockExperiments(9)
    const colors = copyOriginalColors()
    const unassignColors = copyOriginalColors().slice(1)

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      { exp9: colors[0] },
      unassignColors,
      new Set(),
      {}
    )

    expect(availableColors).toStrictEqual(unassignColors)
    expect(coloredStatus).toStrictEqual({
      exp1: UNSELECTED,
      exp2: UNSELECTED,
      exp3: UNSELECTED,
      exp4: UNSELECTED,
      exp5: UNSELECTED,
      exp6: UNSELECTED,
      exp7: UNSELECTED,
      exp8: UNSELECTED,
      exp9: colors[0]
    })
  })

  it('should set the first new experiment to selected when there are already 6 selected', () => {
    const experiments = buildMockExperiments(9)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {
        exp4: colors[0],
        exp5: colors[1],
        exp6: colors[2],
        exp7: colors[3],
        exp8: colors[4],
        exp9: colors[5]
      },
      copyOriginalColors().slice(6),
      new Set(['exp1', 'exp2', 'exp3']),
      {}
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[6],
      exp2: UNSELECTED,
      exp3: UNSELECTED,
      exp4: colors[0],
      exp5: colors[1],
      exp6: colors[2],
      exp7: colors[3],
      exp8: colors[4],
      exp9: colors[5]
    })
  })

  it('should remove the unselected status of experiments running in the workspace (for getMostRecentExperiment)', () => {
    const colors = copyOriginalColors()
    const { availableColors, coloredStatus } = collectColoredStatus(
      [
        {
          executor: Executor.WORKSPACE,
          id: 'exp-1',
          status: ExperimentStatus.RUNNING
        },
        {
          executor: Executor.WORKSPACE,
          id: 'exp-2',
          status: ExperimentStatus.RUNNING
        }
      ] as Experiment[],
      new Map(),
      {
        'exp-1': UNSELECTED,
        'exp-2': colors[0]
      },
      colors.slice(1),
      new Set(),
      {}
    )
    expect(coloredStatus['exp-1']).toBeUndefined()
    expect(coloredStatus['exp-2']).toStrictEqual(colors[0])
    expect(availableColors).toStrictEqual(colors.slice(1))
  })

  it("should duplicate the workspace's color when an experiment finishes running in the workspace", () => {
    const colors = copyOriginalColors()
    const { availableColors, coloredStatus } = collectColoredStatus(
      [
        {
          executor: null,
          id: 'exp-1',
          status: ExperimentStatus.SUCCESS
        },
        {
          id: EXPERIMENT_WORKSPACE_ID
        }
      ] as Experiment[],
      new Map(),
      {
        workspace: colors[0]
      },
      colors.slice(1),
      new Set(),
      { 'exp-1': EXPERIMENT_WORKSPACE_ID }
    )
    expect(coloredStatus).toStrictEqual({
      'exp-1': colors[0],
      workspace: colors[0]
    })

    expect(availableColors).toStrictEqual(colors.slice(1))
  })

  it('should not overwrite an experiments color if it has one and finishes running in the workspace', () => {
    const colors = copyOriginalColors()
    const { availableColors, coloredStatus } = collectColoredStatus(
      [
        {
          executor: null,
          id: 'exp-1',
          status: ExperimentStatus.SUCCESS
        },
        {
          id: EXPERIMENT_WORKSPACE_ID
        }
      ] as Experiment[],
      new Map(),
      {
        'exp-1': colors[2],
        workspace: colors[0]
      },
      colors.slice(1),
      new Set(),
      { 'exp-1': EXPERIMENT_WORKSPACE_ID }
    )
    expect(coloredStatus).toStrictEqual({
      'exp-1': colors[2],
      workspace: colors[0]
    })

    expect(availableColors).toStrictEqual(colors.slice(1))
  })
})

describe('collectFinishedRunningExperiments', () => {
  it('should return an empty object when an experiment is still running', () => {
    const finishedRunning = collectFinishedRunningExperiments(
      {},
      [{ Created: '2022-12-02T07:48:24', id: 'exp-1234' }] as Experiment[],
      [{ executor: Executor.WORKSPACE, id: 'exp-1234' }],
      [{ executor: Executor.WORKSPACE, id: 'exp-1234' }],
      {}
    )
    expect(finishedRunning).toStrictEqual({})
  })

  it('should return the most recently created and unseen (without a status) experiment if there is no longer an experiment running in the workspace', () => {
    const latestCreatedId = 'exp-123'
    const finishedRunning = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T10:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: Executor.WORKSPACE, id: EXPERIMENT_WORKSPACE_ID }],
      [],
      { 'exp-456': UNSELECTED }
    )
    expect(finishedRunning).toStrictEqual({
      [latestCreatedId]: EXPERIMENT_WORKSPACE_ID
    })
  })

  it('should return the most recently created experiment if there is no longer a checkpoint experiment running in the workspace', () => {
    const latestCreatedId = 'exp-123'
    const finishedRunning = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: Executor.WORKSPACE, id: latestCreatedId }],
      [],
      {}
    )
    expect(finishedRunning).toStrictEqual({
      [latestCreatedId]: EXPERIMENT_WORKSPACE_ID
    })
  })

  it('should not return an experiment if all of the experiments can be found in the status object', () => {
    const previouslyCreatedId = 'exp-123'
    const finishedRunning = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T07:48:25', id: previouslyCreatedId }
      ] as Experiment[],
      [{ executor: Executor.WORKSPACE, id: previouslyCreatedId }],
      [],
      { [previouslyCreatedId]: UNSELECTED }
    )
    expect(finishedRunning).toStrictEqual({})
  })

  it('should return the most recently created experiment if there is no longer an experiment running in the queue', () => {
    const latestCreatedId = 'exp-123'
    const finishedRunning = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: Executor.DVC_TASK, id: latestCreatedId }],
      [],
      {}
    )
    expect(finishedRunning).toStrictEqual({
      [latestCreatedId]: latestCreatedId
    })
  })

  it('should remove the id that was run in the workspace if a new one is found', () => {
    const latestCreatedId = 'exp-123'
    const finishedRunning = collectFinishedRunningExperiments(
      { 'exp-previous': EXPERIMENT_WORKSPACE_ID },
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: Executor.WORKSPACE, id: latestCreatedId }],
      [],
      {}
    )
    expect(finishedRunning).toStrictEqual({
      [latestCreatedId]: EXPERIMENT_WORKSPACE_ID
    })
  })
})
