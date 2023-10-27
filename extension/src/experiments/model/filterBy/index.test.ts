import { join } from 'path'
import { FilterDefinition, filterExperiment, Operator } from '.'
import rowsFixture from '../../../test/fixtures/expShow/base/rows'
import { buildDepPath, buildMetricOrParamPath } from '../../columns/paths'
import { Experiment, ColumnType } from '../../webview/contract'
import { tagsColumnLike } from '../../columns/like'

describe('filterExperiment', () => {
  const paramsFile = 'params.yaml'
  const experiments = [
    {
      Created: '2020-12-29T12:00:01',
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
      Created: '2020-12-30T12:00:01',
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
      Created: '2021-01-01T00:00:01',
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

  const filterExperiments = (filters: FilterDefinition[]): Experiment[] =>
    experiments
      .map(experiment => filterExperiment(filters, experiment))
      .filter(Boolean) as Experiment[]

  it('should not filter experiments if they do not have the provided value (for queued experiments)', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.IS_FALSE,
        path: buildMetricOrParamPath(ColumnType.METRICS, 'metrics.json', 'acc'),
        value: undefined
      }
    ])

    expect(
      unfiltered
        .map(
          experiment => experiment[ColumnType.METRICS]?.['metrics.json']?.acc
        )
        .filter(Boolean)
    ).toHaveLength(0)

    expect(unfiltered).toStrictEqual(experiments)
  })

  it('should filter experiments if they do not have the provided value and not missing is used', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.NOT_MISSING,
        path: buildMetricOrParamPath(ColumnType.METRICS, 'metrics.json', 'acc'),
        value: undefined
      }
    ])

    expect(unfiltered).toStrictEqual([])
  })

  it('should not filter the experiments if no filters are provided', () => {
    const unfiltered = filterExperiments([])

    expect(unfiltered).toStrictEqual(experiments)
  })

  it('should filter the experiments with a greater than filter', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.GREATER_THAN,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
        value: '2'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([3])
  })

  it('should filter experiments by an equals filter', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.EQUAL,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
        value: '2'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([2])
  })

  it('should filter experiments by a not equals filter', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.NOT_EQUAL,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
        value: '2'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1, 3])
  })

  it('should filter experiments by multiple filters', () => {
    const unfiltered = filterExperiments([
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
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1, 2])
  })

  it('should filter experiments by multiple filters on multiple params', () => {
    const unfiltered = filterExperiments([
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
    ])

    expect(unfiltered).toStrictEqual([])
  })

  it('should filter experiments using string contains', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.CONTAINS,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'text'),
        value: 'def'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1])
  })

  it('should filter experiments if given a numeric column to filter with string contains', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.CONTAINS,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
        value: '1'
      }
    ])

    expect(unfiltered).toStrictEqual([])
  })

  it('should filter experiments when given a numeric column to filter with string does not contain', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.NOT_CONTAINS,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'filter'),
        value: '1'
      }
    ])

    expect(unfiltered).toStrictEqual(experiments)
  })

  it('should filter experiments using string does not contain', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.NOT_CONTAINS,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'text'),
        value: 'def'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([2, 3])
  })

  it('should split the experiments using boolean is true', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.IS_TRUE,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'bool'),
        value: undefined
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1])
  })

  it('should split the experiments using boolean is false', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.IS_FALSE,
        path: buildMetricOrParamPath(ColumnType.PARAMS, paramsFile, 'bool'),
        value: undefined
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([2])
  })

  it('should split the experiments using after Created date', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.AFTER_DATE,
        path: 'Created',
        value: '2020-12-31T15:40:00'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([3])
  })

  it('should split the experiments using before Created date', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.BEFORE_DATE,
        path: 'Created',
        value: '2020-12-31T15:40:00'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([1, 2])
  })

  it('should split the experiments using on Created date', () => {
    const unfiltered = filterExperiments([
      {
        operator: Operator.ON_DATE,
        path: 'Created',
        value: '2020-12-31T15:40:00'
      }
    ])

    expect(unfiltered.map(experiment => experiment.id)).toStrictEqual([])
  })

  it('should correctly filter using a dep', () => {
    const path = join('data', 'data.xml')
    const depPath = buildDepPath(path)

    const experiment = rowsFixture[0]
    const value = experiment.deps?.[join('data', 'data.xml')]?.value
    expect(value).toBeDefined()

    const unfiltered = filterExperiment(
      [{ operator: Operator.EQUAL, path: depPath, value }],
      experiment
    )
    expect(unfiltered).toStrictEqual(experiment)

    expect(
      filterExperiment(
        [{ operator: Operator.NOT_EQUAL, path: depPath, value }],
        experiment
      )
    ).toBeUndefined()
  })

  it('should correctly filter by tags using the equal operator', () => {
    const main = { ...rowsFixture[1] }
    ;(main.commit as { tags: string[] }).tags = ['0.9.3', 'model@v1']
    const tagFilter = [
      {
        operator: Operator.EQUAL,
        path: tagsColumnLike.path,
        value: '0.9.3'
      }
    ]
    const unfiltered = filterExperiment(tagFilter, main)
    expect(unfiltered).toStrictEqual(main)

    expect((main?.subRows || []).length > 0).toBe(true)

    for (const experiment of main.subRows || []) {
      expect(filterExperiment(tagFilter, experiment)).toBeUndefined()
    }

    expect(
      filterExperiment(
        [
          {
            operator: Operator.EQUAL,
            path: tagsColumnLike.path,
            value: '0.9'
          }
        ],
        main
      )
    ).toBeUndefined()
  })

  it('should correctly filter by tags using the contains operator', () => {
    const main = { ...rowsFixture[1] }
    ;(main.commit as { tags: string[] }).tags = ['0.9.3', 'model@v1', 'a-tag']
    const tagFilter = [
      {
        operator: Operator.CONTAINS,
        path: tagsColumnLike.path,
        value: '0.9'
      }
    ]
    const unfiltered = filterExperiment(tagFilter, main)
    expect(unfiltered).toStrictEqual(main)

    expect((main?.subRows || []).length > 0).toBe(true)

    for (const experiment of main.subRows || []) {
      expect(filterExperiment(tagFilter, experiment)).toBeUndefined()
    }

    expect(
      filterExperiment(
        [
          {
            operator: Operator.CONTAINS,
            path: tagsColumnLike.path,
            value: '0.9.4'
          }
        ],
        main
      )
    ).toBeUndefined()
  })
})
