import { join } from 'path'
import omit from 'lodash.omit'
import isEmpty from 'lodash.isempty'
import {
  collectData,
  collectCheckpointPlotsData,
  collectTemplates,
  collectMetricOrder,
  collectOverrideRevisionDetails,
  collectCustomPlotsData
} from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import expShowFixture from '../../test/fixtures/expShow/base/output'
import modifiedFixture from '../../test/fixtures/expShow/modified/output'
import checkpointPlotsFixture from '../../test/fixtures/expShow/base/checkpointPlots'
import customPlotsFixture from '../../test/fixtures/expShow/base/customPlots'
import {
  ExperimentsOutput,
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'
import { definedAndNonEmpty, sameContents } from '../../util/array'
import { TemplatePlot } from '../webview/contract'
import { SelectedExperimentWithColor } from '../../experiments/model'
import { Experiment } from '../../experiments/webview/contract'

const logsLossPath = join('logs', 'loss.tsv')

const logsLossPlot = (plotsDiffFixture[logsLossPath][0] || {}) as TemplatePlot

describe('collectCustomPlotsData', () => {
  it('should return the expected data from the text fixture', () => {
    const data = collectCustomPlotsData(
      [
        {
          metric: 'metrics:summary.json:loss',
          param: 'params:params.yaml:dropout'
        },
        {
          metric: 'metrics:summary.json:accuracy',
          param: 'params:params.yaml:epochs'
        }
      ],
      [
        {
          id: '12345',
          label: '123',
          metrics: {
            'summary.json': {
              accuracy: 0.4668000042438507,
              loss: 2.0205044746398926
            }
          },
          name: 'exp-e7a67',
          params: { 'params.yaml': { dropout: 0.15, epochs: 16 } }
        },
        {
          id: '12345',
          label: '123',
          metrics: {
            'summary.json': {
              accuracy: 0.3484833240509033,
              loss: 1.9293040037155151
            }
          },
          name: 'exp-83425',
          params: { 'params.yaml': { dropout: 0.25, epochs: 10 } }
        },
        {
          id: '12345',
          label: '123',
          metrics: {
            'summary.json': {
              accuracy: 0.6768440509033,
              loss: 2.298503875732422
            }
          },
          name: 'exp-f13bca',
          params: { 'params.yaml': { dropout: 0.32, epochs: 20 } }
        }
      ]
    )
    expect(data).toStrictEqual(customPlotsFixture.plots)
  })
})

describe('collectCheckpointPlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectCheckpointPlotsData(expShowFixture)
    expect(data).toStrictEqual(
      checkpointPlotsFixture.plots.map(({ id, values }) => ({ id, values }))
    )
  })

  it('should provide a continuous series for a modified experiment', () => {
    const data = collectCheckpointPlotsData(modifiedFixture)

    expect(definedAndNonEmpty(data)).toBeTruthy()

    for (const { values } of data || []) {
      const initialExperiment = values.filter(
        point => point.group === 'exp-908bd'
      )
      const modifiedExperiment = values.find(
        point => point.group === 'exp-01b3a'
      )

      const lastIterationInitial = initialExperiment?.slice(-1)[0]
      const firstIterationModified = modifiedExperiment

      expect(lastIterationInitial).not.toStrictEqual(firstIterationModified)
      expect(omit(lastIterationInitial, 'group')).toStrictEqual(
        omit(firstIterationModified, 'group')
      )

      const baseExperiment = values.filter(point => point.group === 'exp-920fc')
      const restartedExperiment = values.find(
        point => point.group === 'exp-9bc1b'
      )

      const iterationRestartedFrom = baseExperiment?.slice(5)[0]
      const firstIterationAfterRestart = restartedExperiment

      expect(iterationRestartedFrom).not.toStrictEqual(
        firstIterationAfterRestart
      )
      expect(omit(iterationRestartedFrom, 'group')).toStrictEqual(
        omit(firstIterationAfterRestart, 'group')
      )
    }
  })

  it('should return undefined given no input', () => {
    const data = collectCheckpointPlotsData({} as ExperimentsOutput)
    expect(data).toBeUndefined()
  })
})

describe('collectMetricOrder', () => {
  it('should return an empty array if there is no checkpoints data', () => {
    const metricOrder = collectMetricOrder(
      undefined,
      ['metric:A', 'metric:B'],
      []
    )
    expect(metricOrder).toStrictEqual([])
  })

  it('should return an empty array if the checkpoints data is an empty array', () => {
    const metricOrder = collectMetricOrder([], ['metric:A', 'metric:B'], [])
    expect(metricOrder).toStrictEqual([])
  })

  it('should maintain the existing order if all metrics are selected', () => {
    const expectedOrder = [
      'metric:F',
      'metric:A',
      'metric:B',
      'metric:E',
      'metric:D',
      'metric:C'
    ]

    const metricOrder = collectMetricOrder(
      [
        { id: 'metric:A', values: [] },
        { id: 'metric:B', values: [] },
        { id: 'metric:C', values: [] },
        { id: 'metric:D', values: [] },
        { id: 'metric:E', values: [] },
        { id: 'metric:F', values: [] }
      ],
      expectedOrder,
      expectedOrder
    )
    expect(metricOrder).toStrictEqual(expectedOrder)
  })

  it('should push unselected metrics to the end', () => {
    const existingOrder = [
      'metric:F',
      'metric:A',
      'metric:B',
      'metric:E',
      'metric:D',
      'metric:C'
    ]

    const metricOrder = collectMetricOrder(
      [
        { id: 'metric:A', values: [] },
        { id: 'metric:B', values: [] },
        { id: 'metric:C', values: [] },
        { id: 'metric:D', values: [] },
        { id: 'metric:E', values: [] },
        { id: 'metric:F', values: [] }
      ],
      existingOrder,
      existingOrder.filter(metric => !['metric:A', 'metric:B'].includes(metric))
    )
    expect(metricOrder).toStrictEqual([
      'metric:F',
      'metric:E',
      'metric:D',
      'metric:C',
      'metric:A',
      'metric:B'
    ])
  })

  it('should add new metrics in the given order', () => {
    const metricOrder = collectMetricOrder(
      [
        { id: 'metric:C', values: [] },
        { id: 'metric:D', values: [] },
        { id: 'metric:A', values: [] },
        { id: 'metric:B', values: [] },
        { id: 'metric:E', values: [] },
        { id: 'metric:F', values: [] }
      ],
      ['metric:B', 'metric:A'],
      ['metric:B', 'metric:A']
    )
    expect(metricOrder).toStrictEqual([
      'metric:B',
      'metric:A',
      'metric:C',
      'metric:D',
      'metric:E',
      'metric:F'
    ])
  })

  it('should give selected metrics precedence', () => {
    const metricOrder = collectMetricOrder(
      [
        { id: 'metric:C', values: [] },
        { id: 'metric:D', values: [] },
        { id: 'metric:A', values: [] },
        { id: 'metric:B', values: [] },
        { id: 'metric:E', values: [] },
        { id: 'metric:F', values: [] }
      ],
      ['metric:B', 'metric:A'],
      ['metric:B', 'metric:A', 'metric:F']
    )
    expect(metricOrder).toStrictEqual([
      'metric:B',
      'metric:A',
      'metric:F',
      'metric:C',
      'metric:D',
      'metric:E'
    ])
  })
})

describe('collectData', () => {
  it('should return the expected output from the test fixture', () => {
    const mapping = {
      '1ba7bcd': '1ba7bcd',
      '42b8736': '42b8736',
      '4fb124a': '4fb124a',
      '53c3851': 'main',
      workspace: EXPERIMENT_WORKSPACE_ID
    }
    const { revisionData, comparisonData } = collectData(
      plotsDiffFixture,
      mapping
    )
    const revisions = [
      EXPERIMENT_WORKSPACE_ID,
      'main',
      '42b8736',
      '1ba7bcd',
      '4fb124a'
    ]

    const values =
      (logsLossPlot?.datapoints as {
        [revision: string]: Record<string, unknown>[]
      }) || {}

    expect(isEmpty(values)).toBeFalsy()

    // for (const revision of revisions) {
    //   const expectedValues = values[getCLICommitId(revision)].map(value => ({
    //     ...value,
    //     rev: revision
    //   }))
    //   expect(revisionData[revision][logsLossPath]).toStrictEqual(expectedValues)
    // }

    expect(Object.keys(revisionData)).toStrictEqual(revisions)

    expect(Object.keys(revisionData.main)).toStrictEqual([
      logsLossPath,
      join('logs', 'acc.tsv'),
      'predictions.json'
    ])

    const heatmapPlot = join('plots', 'heatmap.png')

    expect(Object.keys(comparisonData.main)).toStrictEqual([
      join('plots', 'acc.png'),
      heatmapPlot,
      join('plots', 'loss.png')
    ])

    const _1ba7bcd_heatmap = comparisonData['1ba7bcd'][heatmapPlot]

    expect(_1ba7bcd_heatmap).toBeDefined()
    expect(_1ba7bcd_heatmap).toStrictEqual(
      plotsDiffFixture[heatmapPlot].find(({ revisions }) =>
        sameContents(revisions as string[], ['1ba7bcd'])
      )
    )
  })
})

describe('collectTemplates', () => {
  it('should return the expected output from the test fixture', () => {
    const { content } = logsLossPlot

    const templates = collectTemplates(plotsDiffFixture)
    expect(Object.keys(templates)).toStrictEqual([
      logsLossPath,
      join('logs', 'acc.tsv'),
      'predictions.json'
    ])

    expect(JSON.parse(templates[logsLossPath])).toStrictEqual(content)
  })
})

describe('collectOverrideRevisionDetails', () => {
  it('should override the revision details for running checkpoint tips', () => {
    const runningId = 'b'
    const runningGroup = `[${runningId}]`

    const { overrideComparison, overrideRevisions } =
      collectOverrideRevisionDetails(
        ['a', 'b', 'c', 'd'],
        [
          {
            checkpoint_tip: 'b',
            displayColor: '#4299e1',
            id: 'a',
            label: 'a',
            logicalGroupName: 'a',
            sha: 'a',
            status: ExperimentStatus.SUCCESS
          },
          {
            checkpoint_tip: 'b',
            displayColor: '#13adc7',
            id: runningId,
            label: 'b',
            logicalGroupName: runningGroup,
            sha: 'b',
            status: ExperimentStatus.RUNNING
          },
          {
            checkpoint_tip: 'c',
            displayColor: '#48bb78',
            id: 'c',
            label: 'c',
            logicalGroupName: 'c',
            sha: 'c',
            status: ExperimentStatus.SUCCESS
          },
          {
            checkpoint_tip: 'd',
            commit: {
              author: 'John Smith',
              date: '3 days ago',
              message: 'Upgrade dependencies\n* upgrade dvc\n* upgrade dvclive',
              tags: []
            },
            displayColor: '#f56565',
            displayNameOrParent: 'Upgrade dependencies ...',
            id: 'd',
            label: 'd',
            logicalGroupName: 'd',
            sha: 'd',
            status: ExperimentStatus.SUCCESS
          }
        ] as SelectedExperimentWithColor[],
        new Set(['a', 'c', 'd', 'e']),
        {},
        (id: string) =>
          ({
            [runningId]: [
              {
                checkpoint_tip: 'f',
                id: 'f',
                label: 'f',
                logicalGroupName: runningGroup,
                sha: 'f',
                status: ExperimentStatus.SUCCESS
              },
              {
                checkpoint_tip: 'e',
                id: 'e',
                label: 'e',
                logicalGroupName: runningGroup,
                sha: 'e',
                status: ExperimentStatus.SUCCESS
              }
            ] as Experiment[]
          }[id]),
        []
      )
    expect(overrideComparison.map(({ revision }) => revision)).toStrictEqual([
      'a',
      'e',
      'c',
      'd'
    ])
    expect(overrideRevisions).toStrictEqual([
      {
        displayColor: '#4299e1',
        fetched: true,
        firstThreeColumns: [],
        group: 'a',
        id: 'a',
        revision: 'a'
      },
      {
        displayColor: '#13adc7',
        fetched: true,
        firstThreeColumns: [],
        group: runningGroup,
        id: 'e',
        revision: 'e'
      },
      {
        displayColor: '#48bb78',
        fetched: true,
        firstThreeColumns: [],
        group: 'c',
        id: 'c',
        revision: 'c'
      },
      {
        commit: 'Upgrade dependencies ...',
        displayColor: '#f56565',
        fetched: true,
        firstThreeColumns: [],
        group: 'd',
        id: 'd',
        revision: 'd'
      }
    ])
  })

  it('should override the revision details for checkpoint experiments which have finished running in the workspace', () => {
    const runningId = 'b'
    const runningGroup = `[${runningId}]`

    const { overrideComparison, overrideRevisions } =
      collectOverrideRevisionDetails(
        ['a', 'b', 'c', 'd'],
        [
          {
            checkpoint_tip: 'b',
            displayColor: '#4299e1',
            id: 'a',
            label: 'a',
            logicalGroupName: 'a',
            sha: 'a',
            status: ExperimentStatus.SUCCESS
          },
          {
            checkpoint_tip: 'b',
            displayColor: '#13adc7',
            id: runningId,
            label: 'b',
            logicalGroupName: runningGroup,
            sha: 'b',
            status: ExperimentStatus.RUNNING
          },
          {
            checkpoint_tip: 'c',
            displayColor: '#48bb78',
            id: 'c',
            label: 'c',
            logicalGroupName: 'c',
            sha: 'c',
            status: ExperimentStatus.SUCCESS
          },
          {
            checkpoint_tip: 'd',
            displayColor: '#f56565',
            id: 'd',
            label: 'd',
            logicalGroupName: 'd',
            sha: 'd',
            status: ExperimentStatus.SUCCESS
          }
        ] as SelectedExperimentWithColor[],
        new Set(['a', 'c', 'd', 'e']),
        { [runningId]: EXPERIMENT_WORKSPACE_ID },
        (id: string) =>
          ({
            [runningId]: [
              {
                checkpoint_tip: 'f',
                id: 'f',
                label: 'f',
                logicalGroupName: runningGroup,
                sha: 'f',
                status: ExperimentStatus.SUCCESS
              },
              {
                checkpoint_tip: 'e',
                id: 'e',
                label: 'e',
                logicalGroupName: runningGroup,
                sha: 'e',
                status: ExperimentStatus.SUCCESS
              }
            ] as Experiment[]
          }[id]),
        []
      )
    expect(overrideComparison.map(({ revision }) => revision)).toStrictEqual([
      'a',
      EXPERIMENT_WORKSPACE_ID,
      'c',
      'd'
    ])
    expect(overrideRevisions).toStrictEqual([
      {
        displayColor: '#4299e1',
        fetched: true,
        firstThreeColumns: [],
        group: 'a',
        id: 'a',
        revision: 'a'
      },
      {
        displayColor: '#13adc7',
        fetched: true,
        firstThreeColumns: [],
        group: undefined,
        id: EXPERIMENT_WORKSPACE_ID,
        revision: EXPERIMENT_WORKSPACE_ID
      },
      {
        displayColor: '#48bb78',
        fetched: true,
        firstThreeColumns: [],
        group: 'c',
        id: 'c',
        revision: 'c'
      },
      {
        displayColor: '#f56565',
        fetched: true,
        firstThreeColumns: [],
        group: 'd',
        id: 'd',
        revision: 'd'
      }
    ])
  })

  it('should order the comparison revisions according to the provided', () => {
    const runningId = 'b'
    const runningGroup = `[${runningId}]`

    const { overrideComparison, overrideRevisions } =
      collectOverrideRevisionDetails(
        ['a', 'b', 'c', 'd'].reverse(),
        [
          {
            checkpoint_tip: 'b',
            displayColor: '#4299e1',
            id: 'a',
            label: 'a',
            logicalGroupName: 'a',
            sha: 'a',
            status: ExperimentStatus.SUCCESS
          },
          {
            checkpoint_tip: 'b',
            displayColor: '#13adc7',
            id: runningId,
            label: 'b',
            logicalGroupName: runningGroup,
            sha: 'b',
            status: ExperimentStatus.RUNNING
          },
          {
            checkpoint_tip: 'c',
            displayColor: '#48bb78',
            id: 'c',
            label: 'c',
            logicalGroupName: 'c',
            sha: 'c',
            status: ExperimentStatus.SUCCESS
          },
          {
            checkpoint_tip: 'd',
            displayColor: '#f56565',
            id: 'd',
            label: 'd',
            logicalGroupName: 'd',
            sha: 'd',
            status: ExperimentStatus.SUCCESS
          }
        ] as SelectedExperimentWithColor[],
        new Set(['a', 'c', 'd', 'e']),
        {},
        (id: string) =>
          ({
            [runningId]: [
              {
                checkpoint_tip: 'f',
                id: 'f',
                label: 'f',
                logicalGroupName: runningGroup,
                sha: 'f',
                status: ExperimentStatus.SUCCESS
              },
              {
                checkpoint_tip: 'e',
                id: 'e',
                label: 'e',
                logicalGroupName: runningGroup,
                sha: 'e',
                status: ExperimentStatus.SUCCESS
              }
            ] as Experiment[]
          }[id]),
        []
      )
    expect(overrideComparison.map(({ revision }) => revision)).toStrictEqual([
      'd',
      'c',
      'e',
      'a'
    ])
    expect(overrideRevisions.map(({ revision }) => revision)).toStrictEqual([
      'a',
      'e',
      'c',
      'd'
    ])
  })

  it('should override the revision details for finished but unfetched checkpoint tips', () => {
    const justFinishedRunningId = 'exp-was-running'
    const { overrideComparison, overrideRevisions } =
      collectOverrideRevisionDetails(
        ['a', 'b', 'c', 'd'],
        [
          { label: 'a' },
          {
            checkpoint_tip: 'b',
            displayColor: '#13adc7',
            id: justFinishedRunningId,
            label: 'b',
            sha: 'b',
            status: ExperimentStatus.SUCCESS
          },
          { label: 'c' },
          { label: 'd' }
        ] as SelectedExperimentWithColor[],
        new Set(['a', 'c', 'd', 'e']),
        { [justFinishedRunningId]: justFinishedRunningId },
        (id: string) =>
          ({ [justFinishedRunningId]: [{ label: 'e' }] as Experiment[] }[id]),
        []
      )
    expect(overrideComparison.map(({ revision }) => revision)).toStrictEqual([
      'a',
      'e',
      'c',
      'd'
    ])
    expect(overrideRevisions.map(({ revision }) => revision)).toStrictEqual([
      'a',
      'e',
      'c',
      'd'
    ])
  })
})
