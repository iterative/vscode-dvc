import { join } from 'path'
import isEmpty from 'lodash.isempty'
import {
  collectData,
  collectTemplates,
  collectCustomPlots,
  collectOrderedRevisions,
  collectImageUrl
} from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import customPlotsFixture, {
  customPlotsOrderFixture,
  experimentsWithCommits
} from '../../test/fixtures/expShow/base/customPlots'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { sameContents } from '../../util/array'
import {
  CustomPlotData,
  DEFAULT_NB_ITEMS_PER_ROW,
  DEFAULT_PLOT_HEIGHT,
  ImagePlot,
  TemplatePlot
} from '../webview/contract'
import { exists } from '../../fileSystem'
import { REVISIONS } from '../../test/fixtures/plotsDiff'

const mockedExists = jest.mocked(exists)

jest.mock('../../fileSystem')

beforeEach(() => {
  jest.resetAllMocks()
})

const logsLossPath = join('logs', 'loss.tsv')

const logsLossPlot = (plotsDiffFixture.data[logsLossPath][0] ||
  {}) as TemplatePlot

describe('collectCustomPlots', () => {
  it('should return the expected data from the test fixture', () => {
    const expectedOutput: CustomPlotData[] = customPlotsFixture.plots
    const data = collectCustomPlots({
      experiments: experimentsWithCommits,
      height: DEFAULT_PLOT_HEIGHT,
      nbItemsPerRow: DEFAULT_NB_ITEMS_PER_ROW,
      plotsOrderValues: customPlotsOrderFixture
    })
    expect(data).toStrictEqual(expectedOutput)
  })
})

describe('collectData', () => {
  it('should return the expected output from the test fixture', () => {
    const { revisionData, comparisonData } = collectData(plotsDiffFixture)

    const values =
      (logsLossPlot?.datapoints as {
        [revision: string]: Record<string, unknown>[]
      }) || {}

    expect(isEmpty(values)).toBeFalsy()

    for (const revision of REVISIONS) {
      const expectedValues = values[revision]?.map(value => ({
        ...value,
        rev: revision
      }))
      expect(revisionData[revision][logsLossPath]).toStrictEqual(expectedValues)
    }

    expect(Object.keys(revisionData).sort()).toStrictEqual(
      [...REVISIONS].sort()
    )

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

    const testBranchHeatmap = comparisonData['test-branch'][heatmapPlot]

    expect(testBranchHeatmap).toBeDefined()
    expect(testBranchHeatmap).toStrictEqual(
      plotsDiffFixture.data[heatmapPlot].find(({ revisions }) =>
        sameContents(revisions as string[], ['test-branch'])
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
