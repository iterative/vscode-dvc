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

  const collectedColoredStatus = (experiments: Experiment[]) =>
    collectColoredStatus(
      experiments,
      new Map(),
      new Map(),
      {},
      copyOriginalColors(),
      {}
    )

  it('should set new experiments to selected if there are less than 7', () => {
    const experiments = buildMockExperiments(4)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } =
      collectedColoredStatus(experiments)

    expect(availableColors).toStrictEqual(colors.slice(4))
    expect(coloredStatus).toStrictEqual({
      exp1: colors[0],
      exp2: colors[1],
      exp3: colors[2],
      exp4: colors[3]
    })
  })

  it('should not push queued experiments into the returned object', () => {
    const experiments = [
      { id: 'exp1' },
      { id: 'exp2', status: ExperimentStatus.QUEUED }
    ] as Experiment[]
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } =
      collectedColoredStatus(experiments)

    expect(availableColors).toStrictEqual(colors.slice(1))
    expect(coloredStatus).toStrictEqual({
      exp1: colors[0]
    })
  })

  it('should not set more than 7 experiments to selected', () => {
    const experiments = buildMockExperiments(8)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } =
      collectedColoredStatus(experiments)

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[0],
      exp2: colors[1],
      exp3: colors[2],
      exp4: colors[3],
      exp5: colors[4],
      exp6: colors[5],
      exp7: colors[6],
      exp8: 0
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
        exp2: 0,
        exp3: colors[2],
        exp4: 0,
        exp5: colors[1],
        exp6: 0,
        exp7: colors[0],
        exp8: 0
      },
      copyOriginalColors().slice(3),
      {}
    )

    expect(coloredStatus).toStrictEqual({ exp1: colors[0] })
    expect(availableColors).toStrictEqual(colors.slice(1))
  })

  it('should respect existing experiment colors', () => {
    const experiments = buildMockExperiments(10)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      new Map(),
      {
        exp1: 0,
        exp10: colors[0],
        exp2: 0,
        exp9: colors[1]
      },
      copyOriginalColors().slice(2),
      {}
    )

    expect(coloredStatus).toStrictEqual({
      exp1: 0,
      exp10: colors[0],
      exp2: 0,
      exp3: colors[2],
      exp4: colors[3],
      exp5: colors[4],
      exp6: colors[5],
      exp7: colors[6],
      exp8: 0,
      exp9: colors[1]
    })
    expect(availableColors).toStrictEqual([])
  })

  it('should not unselect an experiment that is existing and selected', () => {
    const experiments = buildMockExperiments(9)
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      new Map(),
      { exp9: colors[0] },
      copyOriginalColors().slice(1),
      {}
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[1],
      exp2: colors[2],
      exp3: colors[3],
      exp4: colors[4],
      exp5: colors[5],
      exp6: colors[6],
      exp7: 0,
      exp8: 0,
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
      {}
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      exp1: colors[6],
      exp2: 0,
      exp3: 0,
      exp4: colors[0],
      exp5: colors[1],
      exp6: colors[2],
      exp7: colors[3],
      exp8: colors[4],
      exp9: colors[5]
    })
  })

  it('should default checkpoints to unselected', () => {
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
      {}
    )

    expect(availableColors).toStrictEqual(colors.slice(1))
    expect(coloredStatus).toStrictEqual({
      check1: 0,
      check2: 0,
      check3: 0,
      check4: 0,
      check5: 0,
      exp1: colors[0]
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
      {}
    )

    expect(availableColors).toStrictEqual([])
    expect(coloredStatus).toStrictEqual({
      checkA1: 0,
      checkA2: 0,
      checkA3: 0,
      checkA4: 0,
      checkA5: 0,
      checkB1: 0,
      checkB2: 0,
      checkB3: 0,
      checkB4: 0,
      checkB5: 0,
      checkC1: colors[1],
      checkC2: 0,
      checkC3: 0,
      checkC4: 0,
      checkC5: 0,
      checkD1: 0,
      checkD2: colors[2],
      checkD3: colors[3],
      checkD4: colors[4],
      checkD5: colors[5],
      checkD6: colors[6],
      expA: 0,
      expB: 0,
      expC: 0,
      expD: colors[0]
    })
  })
})

describe('collectFinishedRunningExperiments', () => {
  it('should return an empty object when an experiment is still running', () => {
    const mapping = collectFinishedRunningExperiments(
      {},
      [{ Created: '2022-12-02T07:48:24', id: 'exp-1234' }] as Experiment[],
      [{ executor: 'workspace', id: 'exp-1234' }],
      [{ executor: 'workspace', id: 'exp-1234' }]
    )
    expect(mapping).toStrictEqual({})
  })

  it('should return the most recently created experiment if there is no longer an experiment running in the workspace', () => {
    const latestCreatedId = 'exp-123'
    const mapping = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: 'workspace', id: 'workspace' }],
      []
    )
    expect(mapping).toStrictEqual({ [latestCreatedId]: 'workspace' })
  })

  it('should return the most recently created experiment if there is no longer a checkpoint experiment running in the workspace', () => {
    const latestCreatedId = 'exp-123'
    const mapping = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: 'workspace', id: latestCreatedId }],
      []
    )
    expect(mapping).toStrictEqual({ [latestCreatedId]: 'workspace' })
  })

  it('should return the most recently created experiment if there is no longer an experiment running in queue', () => {
    const latestCreatedId = 'exp-123'
    const mapping = collectFinishedRunningExperiments(
      {},
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: 'dvc-task', id: latestCreatedId }],
      []
    )
    expect(mapping).toStrictEqual({ [latestCreatedId]: latestCreatedId })
  })

  it('should remove the id that was run in the workspace if a new one is found', () => {
    const latestCreatedId = 'exp-123'
    const mapping = collectFinishedRunningExperiments(
      { 'exp-previous': 'workspace' },
      [
        { Created: '2022-12-02T07:48:24', id: 'exp-456' },
        { Created: '2022-10-02T07:48:24', id: 'exp-789' },
        { Created: '2022-12-02T07:48:25', id: latestCreatedId },
        { Created: null, id: 'exp-null' }
      ] as Experiment[],
      [{ executor: 'workspace', id: latestCreatedId }],
      []
    )
    expect(mapping).toStrictEqual({ [latestCreatedId]: 'workspace' })
  })
})
