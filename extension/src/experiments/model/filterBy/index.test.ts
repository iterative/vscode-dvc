import { filterExperiments, Operator } from '.'
import { joinColumnPath } from '../../columns/paths'
import { Experiment, ColumnType } from '../../webview/contract'

describe('filterExperiments', () => {
  const paramsFile = 'params.yaml'
  const experiments = [
    {
      id: 1,
      params: {
        'params.yaml': {
          bool: true,
          filter: 1,
          sort: 1,
          text: 'abcdefghijklmnop'
        }
      }
    },
    {
      id: 2,
      params: {
        'params.yaml': {
          bool: false,
          filter: 2,
          sort: 1,
          text: 'fun'
        }
      }
    },
    {
      id: 3,
      params: {
        'params.yaml': {
          bool: null,
          filter: 3,
          sort: 1,
          text: 'not missing'
        }
      }
    }
  ] as unknown as Experiment[]

  it('should not filter experiments if they do not have the provided value (for queued experiments)', () => {
    const unfilteredQueuedExperiments = filterExperiments(
      [
        {
          operator: Operator.IS_FALSE,
          path: joinColumnPath(ColumnType.METRICS, 'metrics.json', 'acc'),
          value: undefined
        }
      ],
      experiments
    )

    expect(
      experiments
        .map(
          experiment => experiment[ColumnType.METRICS]?.['metrics.json']?.acc
        )
        .filter(Boolean)
    ).toHaveLength(0)

    expect(
      unfilteredQueuedExperiments.map(experiment => experiment.id)
    ).toStrictEqual([1, 2, 3])
  })

  it('should return the original experiments if no filters are provided', () => {
    const unFilteredExperiments = filterExperiments([], experiments)
    expect(unFilteredExperiments).toStrictEqual(experiments)
  })

  it('should filter the experiments by a given filter', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.GREATER_THAN,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toStrictEqual([
      3
    ])
  })

  it('should filter the experiments by an equals filter', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.EQUAL,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toStrictEqual([
      2
    ])
  })

  it('should filter the experiments by a not equals filter', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.NOT_EQUAL,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toStrictEqual([
      1, 3
    ])
  })

  it('should filter the experiments by multiple filters', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.GREATER_THAN,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN_OR_EQUAL,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toStrictEqual([
      1, 2
    ])
  })

  it('should filter the experiments by multiple filters on multiple params', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.GREATER_THAN_OR_EQUAL,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '10'
        },
        {
          operator: Operator.EQUAL,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'sort'),
          value: '10'
        }
      ],
      experiments
    )
    expect(filteredExperiments).toStrictEqual([])
  })

  it('should filter the experiments using string contains', () => {
    const experimentsWithText = filterExperiments(
      [
        {
          operator: Operator.CONTAINS,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'text'),
          value: 'def'
        }
      ],
      experiments
    )
    expect(experimentsWithText.map(experiment => experiment.id)).toStrictEqual([
      1
    ])
  })

  it('should filter all experiments if given a numeric column to filter with string contains', () => {
    const noExperiments = filterExperiments(
      [
        {
          operator: Operator.CONTAINS,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '1'
        }
      ],
      experiments
    )
    expect(noExperiments).toStrictEqual([])
  })

  it('should not filter any experiments if given a numeric column to filter with string does not contain', () => {
    const unfilteredExperiments = filterExperiments(
      [
        {
          operator: Operator.NOT_CONTAINS,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '1'
        }
      ],
      experiments
    )
    expect(unfilteredExperiments).toStrictEqual(experiments)
  })

  it('should filter the experiments using string does not contain', () => {
    const experimentsWithoutText = filterExperiments(
      [
        {
          operator: Operator.NOT_CONTAINS,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'text'),
          value: 'def'
        }
      ],
      experiments
    )
    expect(
      experimentsWithoutText.map(experiment => experiment.id)
    ).toStrictEqual([2, 3])
  })

  it('should filter the experiments using boolean is true', () => {
    const experimentsWithTrueBool = filterExperiments(
      [
        {
          operator: Operator.IS_TRUE,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'bool'),
          value: undefined
        }
      ],
      experiments
    )
    expect(
      experimentsWithTrueBool.map(experiment => experiment.id)
    ).toStrictEqual([1])
  })

  it('should filter the experiments using boolean is false', () => {
    const experimentsWithFalseBool = filterExperiments(
      [
        {
          operator: Operator.IS_FALSE,
          path: joinColumnPath(ColumnType.PARAMS, paramsFile, 'bool'),
          value: undefined
        }
      ],
      experiments
    )
    expect(
      experimentsWithFalseBool.map(experiment => experiment.id)
    ).toStrictEqual([2])
  })
})
