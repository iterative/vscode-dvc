import { filterExperiments, Operator } from '.'
import { joinMetricOrParamPath } from '../../metricsAndParams/paths'
import { Experiment } from '../../webview/contract'

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
          filter: 3,
          sort: 1
        }
      }
    }
  ] as unknown as Experiment[]

  it('should return the original experiments if no filters are provided', () => {
    const unFilteredExperiments = filterExperiments([], experiments)
    expect(unFilteredExperiments).toEqual(experiments)
  })

  it('should filter the experiments by a given filter', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.GREATER_THAN,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toEqual([3])
  })

  it('should filter the experiments by an equals filter', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.EQUAL,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toEqual([2])
  })

  it('should filter the experiments by a not equals filter', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.NOT_EQUAL,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toEqual([1, 3])
  })

  it('should filter the experiments by multiple filters', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.GREATER_THAN,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN_OR_EQUAL,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '2'
        }
      ],
      experiments
    )
    expect(filteredExperiments.map(experiment => experiment.id)).toEqual([1, 2])
  })

  it('should filter the experiments by multiple filters on multiple params', () => {
    const filteredExperiments = filterExperiments(
      [
        {
          operator: Operator.GREATER_THAN_OR_EQUAL,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '10'
        },
        {
          operator: Operator.EQUAL,
          path: joinMetricOrParamPath('params', paramsFile, 'sort'),
          value: '10'
        }
      ],
      experiments
    )
    expect(filteredExperiments).toEqual([])
  })

  it('should filter the experiments using string contains', () => {
    const experimentsWithText = filterExperiments(
      [
        {
          operator: Operator.CONTAINS,
          path: joinMetricOrParamPath('params', paramsFile, 'text'),
          value: 'def'
        }
      ],
      experiments
    )
    expect(experimentsWithText.map(experiment => experiment.id)).toEqual([1])
  })

  it('should filter all experiments if given a numeric column to filter with string contains', () => {
    const noExperiments = filterExperiments(
      [
        {
          operator: Operator.CONTAINS,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '1'
        }
      ],
      experiments
    )
    expect(noExperiments).toEqual([])
  })

  it('should not filter any experiments if given a numeric column to filter with string does not contain', () => {
    const unfilteredExperiments = filterExperiments(
      [
        {
          operator: Operator.NOT_CONTAINS,
          path: joinMetricOrParamPath('params', paramsFile, 'filter'),
          value: '1'
        }
      ],
      experiments
    )
    expect(unfilteredExperiments).toEqual(experiments)
  })

  it('should filter the experiments using string does not contain', () => {
    const experimentsWithoutText = filterExperiments(
      [
        {
          operator: Operator.NOT_CONTAINS,
          path: joinMetricOrParamPath('params', paramsFile, 'text'),
          value: 'def'
        }
      ],
      experiments
    )
    expect(experimentsWithoutText.map(experiment => experiment.id)).toEqual([
      2, 3
    ])
  })

  it('should filter the experiments using boolean is true', () => {
    const experimentsWithTrueBool = filterExperiments(
      [
        {
          operator: Operator.IS_TRUE,
          path: joinMetricOrParamPath('params', paramsFile, 'bool'),
          value: undefined
        }
      ],
      experiments
    )
    expect(experimentsWithTrueBool.map(experiment => experiment.id)).toEqual([
      1
    ])
  })

  it('should filter the experiments using boolean is false', () => {
    const experimentsWithFalseBool = filterExperiments(
      [
        {
          operator: Operator.IS_FALSE,
          path: joinMetricOrParamPath('params', paramsFile, 'bool'),
          value: undefined
        }
      ],
      experiments
    )
    expect(experimentsWithFalseBool.map(experiment => experiment.id)).toEqual([
      2
    ])
  })
})
