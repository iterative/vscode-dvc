import { splitExperimentsByFilters, Operator } from '.'
import { buildMetricOrParamPath } from '../../columns/paths'
import { Experiment, ColumnType } from '../../webview/contract'

describe('splitExperimentsByFilters', () => {
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
    const {
      unfiltered: unfilteredQueuedExperiments,
      filtered: filteredQueuedExperiments
    } = splitExperimentsByFilters(
      [
        {
          operator: Operator.IS_FALSE,
          path: buildMetricOrParamPath(
            ColumnType.METRICS,
            'metrics.json',
            'acc'
          ),
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
    expect(
      filteredQueuedExperiments.map(experiment => experiment.id)
    ).toStrictEqual([])
  })

  it('should mark the original experiments as unfiltered if no filters are provided', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters([], experiments)
    expect(unfiltered).toStrictEqual(experiments)
    expect(filtered).toStrictEqual([])
  })

  it('should split the experiments by a given filter', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.GREATER_THAN,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([1, 2])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([3])
  })

  it('should split the experiments by an equals filter', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.EQUAL,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([1, 3])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([2])
  })

  it('should split the experiments by a not equals filter', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.NOT_EQUAL,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([2])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1, 3])
  })

  it('should split the experiments by multiple filters', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.GREATER_THAN,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN_OR_EQUAL,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([3])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1, 2])
  })

  it('should split the experiments by multiple filters on multiple params', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.GREATER_THAN_OR_EQUAL,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '10'
        },
        {
          operator: Operator.EQUAL,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'sort'),
          value: '10'
        }
      ],
      experiments
    )
    expect(filtered).toStrictEqual(experiments)
    expect(unfiltered).toStrictEqual([])
  })

  it('should split the experiments using string contains', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.CONTAINS,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'text'),
          value: 'def'
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([2, 3])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1])
  })

  it('should split all experiments if given a numeric column to filter with string contains', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.CONTAINS,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '1'
        }
      ],
      experiments
    )
    expect(filtered).toStrictEqual(experiments)
    expect(unfiltered).toStrictEqual([])
  })

  it('should split the experiments when given a numeric column to filter with string does not contain', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.NOT_CONTAINS,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
          value: '1'
        }
      ],
      experiments
    )
    expect(filtered).toStrictEqual([])
    expect(unfiltered).toStrictEqual(experiments)
  })

  it('should split the experiments using string does not contain', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.NOT_CONTAINS,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'text'),
          value: 'def'
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([1])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([2, 3])
  })

  it('should split the experiments using boolean is true', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.IS_TRUE,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'bool'),
          value: undefined
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([2, 3])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1])
  })

  it('should split the experiments using boolean is false', () => {
    const { filtered, unfiltered } = splitExperimentsByFilters(
      [
        {
          operator: Operator.IS_FALSE,
          path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'bool'),
          value: undefined
        }
      ],
      experiments
    )
    expect(filtered.map(experiment => experiment.id)).toStrictEqual([1, 3])
    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([2])
  })
})
