import { join } from 'path'
import isEmpty from 'lodash.isempty'
import {
  collectData,
  collectTemplates,
  collectOverrideRevisionDetails,
  collectCustomPlots
} from './collect'
import { isCheckpointPlot } from './custom'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import customPlotsFixture, {
  customPlotsOrderFixture,
  experimentsWithCheckpoints
} from '../../test/fixtures/expShow/base/customPlots'
import {
  ExperimentStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'
import { sameContents } from '../../util/array'
import {
  CustomPlotData,
  CustomPlotType,
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_PLOT_HEIGHT,
  TemplatePlot
} from '../webview/contract'
import { getCLICommitId } from '../../test/fixtures/plotsDiff/util'
import { SelectedExperimentWithColor } from '../../experiments/model'
import { Experiment } from '../../experiments/webview/contract'

const logsLossPath = join('logs', 'loss.tsv')

const logsLossPlot = (plotsDiffFixture[logsLossPath][0] || {}) as TemplatePlot

describe('collectCustomPlots', () => {
  const defaultFuncArgs = {
    experiments: experimentsWithCheckpoints,
    hasCheckpoints: true,
    height: DEFAULT_PLOT_HEIGHT,
    nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
    plotsOrderValues: customPlotsOrderFixture,
    selectedRevisions: customPlotsFixture.colors?.domain
  }

  it('should return the expected data from the test fixture', () => {
    const expectedOutput: CustomPlotData[] = customPlotsFixture.plots
    const data = collectCustomPlots(defaultFuncArgs)
    expect(data).toStrictEqual(expectedOutput)
  })

  it('should return only custom plots if there no selected revisions', () => {
    const expectedOutput: CustomPlotData[] = customPlotsFixture.plots.filter(
      plot => plot.type !== CustomPlotType.CHECKPOINT
    )
    const data = collectCustomPlots({
      ...defaultFuncArgs,
      selectedRevisions: undefined
    })

    expect(data).toStrictEqual(expectedOutput)
  })

  it('should return only custom plots if checkpoints are not enabled', () => {
    const expectedOutput: CustomPlotData[] = customPlotsFixture.plots.filter(
      plot => plot.type !== CustomPlotType.CHECKPOINT
    )
    const data = collectCustomPlots({
      ...defaultFuncArgs,
      hasCheckpoints: false
    })

    expect(data).toStrictEqual(expectedOutput)
  })

  it('should return checkpoint plots with values only containing selected experiments data', () => {
    const domain = customPlotsFixture.colors?.domain.slice(1) as string[]

    const expectedOutput = customPlotsFixture.plots.map(plot => ({
      ...plot,
      values: isCheckpointPlot(plot)
        ? plot.values.filter(value => domain.includes(value.group))
        : plot.values
    }))

    const data = collectCustomPlots({
      ...defaultFuncArgs,
      selectedRevisions: domain
    })

    expect(data).toStrictEqual(expectedOutput)
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

    for (const revision of revisions) {
      const expectedValues = values[getCLICommitId(revision)].map(value => ({
        ...value,
        rev: revision
      }))
      expect(revisionData[revision][logsLossPath]).toStrictEqual(expectedValues)
    }

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
