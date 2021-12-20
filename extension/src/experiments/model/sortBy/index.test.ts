import get from 'lodash.get'
import { sortExperiments } from '.'
import { joinMetricOrParamPath } from '../../metricsAndParams/paths'
import { Experiment } from '../../webview/contract'

describe('sortExperiments', () => {
  const testId = 'f0778b3eb6a390d6f6731c735a2a4561d1792c3a'
  const testDisplayName = 'f0778b3'
  const testTimestamp = '2021-01-14T10:57:59'
  const irrelevantExperimentData = {
    checkpoint_parent: 'f81f1b5a1248b9d9f595fb53136298c69f908e66',
    checkpoint_tip: 'd3f4a0d3661c5977540d2205d819470cf0d2145a',
    displayName: testDisplayName,
    id: testId,
    queued: false,
    timestamp: testTimestamp
  }
  const testPathArray = ['params', 'params.yaml', 'test']
  const testPath = joinMetricOrParamPath(...testPathArray)
  const getTestParam = (experiment: Experiment) =>
    get(experiment, testPathArray)

  it('Returns unsorted rows if sort definition argument is undefined', () => {
    const unsortedRows = [{ id: 1 }, { id: 2 }] as unknown as Experiment[]
    expect(
      sortExperiments([{ descending: false, path: testPath }], unsortedRows)
    ).toEqual(unsortedRows)
  })

  it('Maintains the same order if all items are equal with a single sort', () => {
    const testData = [
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            sort: 1,
            test: 1
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            sort: 1,
            test: 2
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            sort: 1,
            test: 3
          }
        }
      }
    ]

    const testSortPath = joinMetricOrParamPath('params', 'params.yaml', 'sort')
    expect(
      (
        sortExperiments(
          [{ descending: true, path: testSortPath }],
          testData
        ) as Experiment[]
      ).map(getTestParam)
    ).toEqual([1, 2, 3])

    expect(
      (
        sortExperiments(
          [{ descending: false, path: testSortPath }],
          testData
        ) as Experiment[]
      ).map(getTestParam)
    ).toEqual([1, 2, 3])
  })

  it('Should maintain the same order if all items are equal in a multi-sort', () => {
    const testData = [
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            sort: 1,
            sort2: 1,
            test: 1
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            sort: 1,
            sort2: 1,
            test: 2
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            sort: 1,
            sort2: 1,
            test: 3
          }
        }
      }
    ]

    const testSortPath = joinMetricOrParamPath('params', 'params.yaml', 'sort')
    const testSortPath2 = joinMetricOrParamPath(
      'params',
      'params.yaml',
      'sort2'
    )
    expect(
      (
        sortExperiments(
          [
            { descending: false, path: testSortPath },
            { descending: true, path: testSortPath2 }
          ],
          testData
        ) as Experiment[]
      ).map(getTestParam)
    ).toEqual([1, 2, 3])

    expect(
      (
        sortExperiments(
          [{ descending: false, path: testSortPath }],
          testData
        ) as Experiment[]
      ).map(getTestParam)
    ).toEqual([1, 2, 3])
  })

  describe('Should sort both ascending and descending', () => {
    const testData = [
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            test: 2
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            test: 3
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            test: 1
          }
        }
      }
    ]

    it('Should sort ascending', () => {
      expect(
        (
          sortExperiments(
            [{ descending: false, path: testPath }],
            testData
          ) as Experiment[]
        ).map(getTestParam)
      ).toEqual([1, 2, 3])
    })

    it('Should sort descending', () => {
      expect(
        (
          sortExperiments(
            [{ descending: true, path: testPath }],
            testData
          ) as Experiment[]
        ).map(getTestParam)
      ).toEqual([3, 2, 1])
    })
  })

  describe('Should use multiple sort definitions', () => {
    const otherTestPathArray = ['params', 'params.yaml', 'othertest']
    const otherTestPath = joinMetricOrParamPath(...otherTestPathArray)
    const testData = [
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            othertest: 2,
            test: 2
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            othertest: 1,
            test: 3
          }
        }
      },
      {
        ...irrelevantExperimentData,
        params: {
          'params.yaml': {
            othertest: 2,
            test: 1
          }
        }
      }
    ]

    it('Should sort with first definition given priority', () => {
      const result = sortExperiments(
        [
          { descending: false, path: otherTestPath },
          { descending: false, path: testPath }
        ],
        testData
      ) as Experiment[]
      expect(result.map(getTestParam)).toEqual([3, 1, 2])
      expect(result.map(item => get(item, otherTestPathArray))).toEqual([
        1, 2, 2
      ])
    })

    it('Should sort with two different directions', () => {
      const result = sortExperiments(
        [
          { descending: false, path: otherTestPath },
          { descending: true, path: testPath }
        ],
        testData
      ) as Experiment[]
      expect(result.map(getTestParam)).toEqual([3, 2, 1])
      expect(result.map(item => get(item, otherTestPathArray))).toEqual([
        1, 2, 2
      ])
    })
  })
})
