import { UNSELECTED } from '.'
import { collectColoredStatus } from './collect'
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

  it('should set unseen experiments to unselected', () => {
    const experiments = [{ id: 'exp1' }] as Experiment[]
    const colors = copyOriginalColors()

    const { availableColors, coloredStatus } = collectColoredStatus(
      experiments,
      new Map(),
      {},
      copyOriginalColors(),
      new Set()
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
      new Set()
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
      new Set(['exp8'])
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
      new Set(['exp1'])
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
      new Set()
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
      new Set()
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
      new Set(['exp1', 'exp2', 'exp3'])
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
})
