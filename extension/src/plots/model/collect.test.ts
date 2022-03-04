/* eslint-disable sort-keys-fix/sort-keys-fix */
import omit from 'lodash.omit'
import isEmpty from 'lodash.isempty'
import {
  collectData,
  collectCheckpointPlotsData,
  collectPaths,
  collectTemplates
} from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import expShowFixture from '../../test/fixtures/expShow/output'
import modifiedFixture from '../../test/fixtures/expShow/modified'
import checkpointPlotsFixture from '../../test/fixtures/expShow/checkpointPlots'
import { ExperimentsOutput } from '../../cli/reader'
import { definedAndNonEmpty, sameContents } from '../../util/array'
import { PlotsType, Plot, VegaPlot } from '../webview/contract'

const LogsLossTsv = (plotsDiffFixture['logs/loss.tsv'][0] || {}) as VegaPlot

describe('collectCheckpointPlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectCheckpointPlotsData(expShowFixture)
    expect(data).toStrictEqual(checkpointPlotsFixture.plots)
  })

  it('should provide a continuous series for a modified experiment', () => {
    const data = collectCheckpointPlotsData(modifiedFixture)

    expect(definedAndNonEmpty(data)).toBeTruthy()

    data?.forEach(({ values }) => {
      const initialExperiment = values.filter(
        point => point.group === 'exp-908bd'
      )
      const modifiedExperiment = values.filter(
        point => point.group === 'exp-01b3a'
      )

      const lastIterationInitial = initialExperiment?.slice(-1)[0]
      const firstIterationModified = modifiedExperiment[0]

      expect(lastIterationInitial).not.toStrictEqual(firstIterationModified)
      expect(omit(lastIterationInitial, 'group')).toStrictEqual(
        omit(firstIterationModified, 'group')
      )

      const baseExperiment = values.filter(point => point.group === 'exp-920fc')
      const restartedExperiment = values.filter(
        point => point.group === 'exp-9bc1b'
      )

      const iterationRestartedFrom = baseExperiment?.slice(5)[0]
      const firstIterationAfterRestart = restartedExperiment[0]

      expect(iterationRestartedFrom).not.toStrictEqual(
        firstIterationAfterRestart
      )
      expect(omit(iterationRestartedFrom, 'group')).toStrictEqual(
        omit(firstIterationAfterRestart, 'group')
      )
    })
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
      (LogsLossTsv?.content?.data as { values: { rev: string }[] }).values || []

    expect(isEmpty(values)).toBeFalsy()

    revisions.forEach(revision => {
      const expectedValues = values.filter(value => value.rev === revision)
      expect(revisionData[revision]['logs/loss.tsv']).toStrictEqual(
        expectedValues
      )
    })

    expect(Object.keys(revisionData)).toStrictEqual(revisions)

    expect(Object.keys(revisionData.main)).toStrictEqual([
      'logs/loss.tsv',
      'logs/acc.tsv',
      'predictions.json'
    ])

    expect(Object.keys(comparisonData.main)).toStrictEqual([
      'plots/acc.png',
      'plots/heatmap.png',
      'plots/loss.png'
    ])

    const _1ba7bcd_heatmap = comparisonData['1ba7bcd']['plots/heatmap.png']

    expect(_1ba7bcd_heatmap).toBeDefined()
    expect(_1ba7bcd_heatmap).toStrictEqual(
      plotsDiffFixture['plots/heatmap.png'].find(({ revisions }) =>
        sameContents(revisions as string[], ['1ba7bcd'])
      )
    )
  })
})

describe('collectTemplates', () => {
  it('should return the expected output from the test fixture', () => {
    const { content } = LogsLossTsv
    const expectedTemplate = omit(content, 'data')

    const templates = collectTemplates(plotsDiffFixture)
    expect(Object.keys(templates)).toStrictEqual([
      'logs/loss.tsv',
      'logs/acc.tsv',
      'predictions.json'
    ])

    expect(templates['logs/loss.tsv']).not.toStrictEqual(content)

    expect(templates['logs/loss.tsv']).toStrictEqual(expectedTemplate)
  })
})

describe('collectPaths', () => {
  it('should always return the paths in order', () => {
    const { comparison, plots } = collectPaths({
      z: [{ type: PlotsType.IMAGE } as Plot],
      b: [{ type: PlotsType.IMAGE } as Plot],
      a: [{ type: PlotsType.IMAGE } as Plot],
      y: [{ type: PlotsType.VEGA } as Plot],
      c: [{ type: PlotsType.VEGA } as Plot],
      f: [{ type: PlotsType.VEGA } as Plot]
    })

    expect(comparison).toStrictEqual(['a', 'b', 'z'])
    expect(plots).toStrictEqual(['c', 'f', 'y'])
  })
})
