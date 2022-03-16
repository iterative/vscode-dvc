import { join } from 'path'
import omit from 'lodash.omit'
import isEmpty from 'lodash.isempty'
import {
  collectData,
  collectCheckpointPlotsData,
  collectTemplates
} from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import expShowFixture from '../../test/fixtures/expShow/output'
import modifiedFixture from '../../test/fixtures/expShow/modified'
import checkpointPlotsFixture from '../../test/fixtures/expShow/checkpointPlots'
import { ExperimentsOutput } from '../../cli/reader'
import { definedAndNonEmpty, sameContents } from '../../util/array'
import { TemplatePlot } from '../webview/contract'

const logsLossPath = join('logs', 'loss.tsv')

const logsLossPlot = (plotsDiffFixture[logsLossPath][0] || {}) as TemplatePlot

describe('collectCheckpointPlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectCheckpointPlotsData(expShowFixture)
    expect(data).toStrictEqual(checkpointPlotsFixture.plots)
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

describe('collectData', () => {
  it('should return the expected output from the test fixture', () => {
    const { revisionData, comparisonData } = collectData(plotsDiffFixture)
    const revisions = ['workspace', 'main', '42b8736', '1ba7bcd', '4fb124a']

    const values =
      (logsLossPlot?.content?.data as { values: { rev: string }[] }).values ||
      []

    expect(isEmpty(values)).toBeFalsy()

    for (const revision of revisions) {
      const expectedValues = values.filter(value => value.rev === revision)
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
    const expectedTemplate = omit(content, 'data')

    const templates = collectTemplates(plotsDiffFixture)
    expect(Object.keys(templates)).toStrictEqual([
      logsLossPath,
      join('logs', 'acc.tsv'),
      'predictions.json'
    ])

    expect(templates[logsLossPath]).not.toStrictEqual(content)

    expect(templates[logsLossPath]).toStrictEqual(expectedTemplate)
  })
})
