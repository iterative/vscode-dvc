import { join } from 'path'
import { filterExperiments, Operator } from './filtering'
import { Experiment } from '../webview/contract'

describe('filterExperiments', () => {
  const paramsFile = 'params.yaml'
  const experiments = [
    {
      id: 1,
      params: {
        'params.yaml': {
          filter: 1,
          sort: 1
        }
      }
    },
    {
      id: 2,
      params: {
        'params.yaml': {
          filter: 2,
          sort: 1
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
          path: join('params', paramsFile, 'filter'),
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
          path: join('params', paramsFile, 'filter'),
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
          path: join('params', paramsFile, 'filter'),
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
          path: join('params', paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN_OR_EQUAL,
          path: join('params', paramsFile, 'filter'),
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
          path: join('params', paramsFile, 'filter'),
          value: '0'
        },
        {
          operator: Operator.LESS_THAN,
          path: join('params', paramsFile, 'filter'),
          value: '10'
        },
        {
          operator: Operator.EQUAL,
          path: join('params', paramsFile, 'sort'),
          value: '10'
        }
      ],
      experiments
    )
    expect(filteredExperiments).toEqual([])
  })
})
