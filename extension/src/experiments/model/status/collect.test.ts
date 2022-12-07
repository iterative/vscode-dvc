import { UNSELECTED } from '.'
import {
  collectColoredStatus,
  collectFinishedRunningExperiments
} from './collect'
import { copyOriginalColors } from './colors'
import { Experiment } from '../../webview/contract'
import { ExperimentStatus } from '../../../cli/dvc/contract'

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

  it('should set unseen checkpoints and experiments to unselected', () => {
    const experiments = [{ id: 'exp1' }] as Experiment[]
    const checkpointsByTip = new Map<string, Experiment[]>([
      ['exp1', buildMockExperiments(5, 'check')]
    ])
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      checkpointsByTip,
      new Map(),
      {},
      copyOriginalColors(),
      new Set(),
      {}
    )

    expect(availableColors).toStrictEqual(colors)
    expect(coloredStatus).toStrictEqual({
      check1: UNSELECTED,
      check2: UNSELECTED,
      check3: UNSELECTED,
      check4: UNSELECTED,
      check5: UNSELECTED,
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

  it('should respect existing checkpoint statuses', () => {
    const experiments = [
      { id: 'expA' },
      { id: 'expB' },
      { id: 'expC' },
      { id: 'expD' }
    ] as Experiment[]
    const checkpointsByTip = new Map<string, Experiment[]>([
      ['expA', buildMockExperiments(5, 'checkA')],
      ['expB', buildMockExperiments(5, 'checkB')],
      ['expC', buildMockExperiments(5, 'checkC')],
      ['expD', buildMockExperiments(6, 'checkD')]
    ])
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      checkpointsByTip,
      new Map(),
      {
        checkC1: colors[1],
        checkD2: colors[2],
        checkD3: colors[3],
        checkD4: colors[4],
        checkD5: colors[5],
        checkD6: colors[6],
        expD: colors[0]
      },
      [],
      new Set(),
      {}
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      checkA1: UNSELECTED,
      checkA2: UNSELECTED,
      checkA3: UNSELECTED,
      checkA4: UNSELECTED,
      checkA5: UNSELECTED,
      checkB1: UNSELECTED,
      checkB2: UNSELECTED,
      checkB3: UNSELECTED,
      checkB4: UNSELECTED,
      checkB5: UNSELECTED,
      checkC1: colors[1],
      checkC2: UNSELECTED,
      checkC3: UNSELECTED,
      checkC4: UNSELECTED,
      checkC5: UNSELECTED,
      checkD1: UNSELECTED,
      checkD2: colors[2],
      checkD3: colors[3],
      checkD4: colors[4],
      checkD5: colors[5],
      checkD6: colors[6],
      expA: UNSELECTED,
      expB: UNSELECTED,
      expC: UNSELECTED,
      expD: colors[0]
    })
  })

  it('should remove the unselected status of experiments running in the workspace (for getMostRecentExperiment)', () => {
    const colors = copyOriginalColors()
    const { availableColors, coloredStatus } = collectColoredStatus(
      [
        {
          executor: 'workspace',
          id: 'exp-1',
          status: ExperimentStatus.RUNNING
        },
        {
          executor: 'workspace',
          id: 'exp-2',
          status: ExperimentStatus.RUNNING
        }
      ] as Experiment[],
      new Map(),
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

  it("should reassign the workspace's color when an experiment finishes running in the workspace", () => {
    const colors = copyOriginalColors()
    const { availableColors, coloredStatus } = collectColoredStatus(
      [
        {
          executor: null,
          id: 'exp-1',
          status: ExperimentStatus.SUCCESS
        },
        {
          id: 'workspace'
        }
      ] as Experiment[],
      new Map(),
      new Map(),
      {
        workspace: colors[0]
      },
      colors.slice(1),
      new Set(),
      { 'exp-1': 'workspace' }
    )
    expect(coloredStatus).toStrictEqual({
      'exp-1': colors[0],
      workspace: UNSELECTED
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
          id: 'workspace'
        }
      ] as Experiment[],
      new Map(),
      new Map(),
      {
        'exp-1': colors[2],
        workspace: colors[0]
      },
      colors.slice(1),
      new Set(),
      { 'exp-1': 'workspace' }
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
      [{ executor: 'workspace', id: 'exp-1234' }],
      [{ executor: 'workspace', id: 'exp-1234' }],
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
      [{ executor: 'workspace', id: 'workspace' }],
      [],
      { 'exp-456': UNSELECTED }
    )
    expect(finishedRunning).toStrictEqual({ [latestCreatedId]: 'workspace' })
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
      [{ executor: 'workspace', id: latestCreatedId }],
      [],
      {}
    )
    expect(finishedRunning).toStrictEqual({ [latestCreatedId]: 'workspace' })
  })

  it('should not return an experiment if all of the experiments can be found in the status object', () => {
    const previouslyCreatedId = 'exp-123'
    const finishedRunning = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T07:48:25', id: previouslyCreatedId }
      ] as Experiment[],
      [{ executor: 'workspace', id: previouslyCreatedId }],
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
      [{ executor: 'dvc-task', id: latestCreatedId }],
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
      { 'exp-previous': 'workspace' },
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: 'workspace', id: latestCreatedId }],
      [],
      {}
    )
    expect(finishedRunning).toStrictEqual({ [latestCreatedId]: 'workspace' })
  })
})
