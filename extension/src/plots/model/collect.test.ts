import { join } from 'path'
import isEmpty from 'lodash.isempty'
import {
  collectData,
  collectTemplates,
  collectOverrideRevisionDetails,
  collectCustomPlots,
  collectOrderedRevisions,
  collectImageUrl
} from './collect'
import { isCheckpointPlot } from './custom'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import customPlotsFixture, {
  customPlotsOrderFixture,
  experimentsWithCommits
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
  ImagePlot,
  TemplatePlot
} from '../webview/contract'
import { getCLICommitId } from '../../test/fixtures/plotsDiff/util'
import { SelectedExperimentWithColor } from '../../experiments/model'
import { Experiment } from '../../experiments/webview/contract'
import { exists } from '../../fileSystem'

const mockedExists = jest.mocked(exists)

jest.mock('../../fileSystem')

beforeEach(() => {
  jest.resetAllMocks()
})

const logsLossPath = join('logs', 'loss.tsv')

const logsLossPlot = (plotsDiffFixture.data[logsLossPath][0] ||
  {}) as TemplatePlot

describe('collectCustomPlots', () => {
  const defaultFuncArgs = {
    experiments: experimentsWithCommits,
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
      plotsDiffFixture.data[heatmapPlot].find(({ revisions }) =>
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
        new Set([]),
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
        fetched: false,
        firstThreeColumns: [],
        group: 'a',
        id: 'a',
        revision: 'a'
      },
      {
        displayColor: '#13adc7',
        fetched: false,
        firstThreeColumns: [],
        group: undefined,
        id: EXPERIMENT_WORKSPACE_ID,
        revision: EXPERIMENT_WORKSPACE_ID
      },
      {
        displayColor: '#48bb78',
        fetched: false,
        firstThreeColumns: [],
        group: 'c',
        id: 'c',
        revision: 'c'
      },
      {
        displayColor: '#f56565',
        fetched: false,
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
        new Set([]),
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

  it('should override the revision details for finished but unfetched checkpoint tips (based on available data)', () => {
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
        new Set([]),
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

describe('collectOrderedRevisions', () => {
  it('should return the expected value from the test fixture', () => {
    const main = { Created: '2020-11-21T19:58:22', id: 'main', label: 'main' }
    const workspace = {
      id: EXPERIMENT_WORKSPACE_ID,
      label: EXPERIMENT_WORKSPACE_ID
    }
    const _4fb124a = {
      Created: '2020-12-29T15:31:52',
      id: 'exp-e7a67',
      label: '4fb124a'
    }
    const _42b8736 = {
      Created: '2020-12-29T15:28:59',
      id: 'test-branch',
      label: '42b8736'
    }
    const _1ba7bcd = {
      Created: '2020-12-29T15:27:02',
      id: 'exp-83425',
      label: '1ba7bcd'
    }
    const orderedRevisions = collectOrderedRevisions([
      _1ba7bcd,
      _42b8736,
      _4fb124a,
      main,
      workspace
    ])
    expect(orderedRevisions).toStrictEqual([
      workspace,
      _4fb124a,
      _42b8736,
      _1ba7bcd,
      main
    ])
  })

  it('should order the provided revisions by workspace and then Created', () => {
    const a = { Created: '2023-03-23T16:27:20', id: 'a', label: 'a' }
    const b = { Created: '2023-03-23T15:27:20', id: 'b', label: 'b' }
    const c = { Created: '2023-03-23T12:10:13', id: 'c', label: 'c' }
    const d = { Created: '2020-11-21T19:58:22', id: 'd', label: 'd' }
    const workspace = {
      id: EXPERIMENT_WORKSPACE_ID,
      label: EXPERIMENT_WORKSPACE_ID
    }
    const orderedRevisions = collectOrderedRevisions([b, c, workspace, d, a])

    expect(orderedRevisions).toStrictEqual([workspace, a, b, c, d])
  })
})

describe('collectImageUrl', () => {
  it('should return undefined if the image is missing', () => {
    const url = collectImageUrl(undefined, false)
    expect(url).toBeUndefined()
  })

  it("should return undefined if the image's url is missing", () => {
    const url = collectImageUrl({} as ImagePlot, false)
    expect(url).toBeUndefined()
  })

  it('should return the url if the plot is fetched', () => {
    mockedExists.mockReturnValueOnce(false)
    const imageUrl = join('some', 'path', 'to', 'image')
    const url = collectImageUrl({ url: imageUrl } as ImagePlot, true)
    expect(url).toStrictEqual(imageUrl)
  })

  it('should omit the url if the plot is not fetched and does not exist', () => {
    mockedExists.mockReturnValueOnce(false)
    const imageUrl = join('some', 'path', 'to', 'missing', 'image')
    const url = collectImageUrl({ url: imageUrl } as ImagePlot, false)
    expect(url).toStrictEqual(undefined)
  })
})
