/* eslint-disable sort-keys-fix/sort-keys-fix */
import omit from 'lodash.omit'
import isEmpty from 'lodash.isempty'
import {
  collectBranchRevision,
  collectData,
  collectLivePlotsData,
  collectMutableRevisions,
  collectPaths,
  collectRevisions,
  collectTemplates
} from './collect'
import plotsDiffFixture from '../../test/fixtures/plotsDiff/output'
import expShowFixture from '../../test/fixtures/expShow/output'
import modifiedFixture from '../../test/fixtures/expShow/modified'
import livePlotsFixture from '../../test/fixtures/expShow/livePlots'
import { ExperimentsOutput } from '../../cli/reader'
import { definedAndNonEmpty } from '../../util/array'
import { PlotsType, StaticPlot, VegaPlot } from '../webview/contract'

const LogsLossTsv = (plotsDiffFixture['logs/loss.tsv'][0] || {}) as VegaPlot

describe('collectLivePlotsData', () => {
  it('should return the expected data from the test fixture', () => {
    const data = collectLivePlotsData(expShowFixture)
    expect(data).toEqual(livePlotsFixture.plots)
  })

  it('should provide a continuous series for a modified experiment', () => {
    const data = collectLivePlotsData(modifiedFixture)

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

      expect(lastIterationInitial).not.toEqual(firstIterationModified)
      expect(omit(lastIterationInitial, 'group')).toEqual(
        omit(firstIterationModified, 'group')
      )
    })
  })

  it('should return undefined given no input', () => {
    const data = collectLivePlotsData({} as ExperimentsOutput)
    expect(data).toBeUndefined()
  })
})

describe('collectRevisions', () => {
  it('should return the expected revisions from the test fixture', () => {
    const { branchNames, revisionsByTip, revisionsByBranch } =
      collectRevisions(expShowFixture)
    expect(branchNames).toEqual(['main'])
    expect(revisionsByBranch).toEqual(
      new Map([['main', ['4fb124a', '42b8736', '1ba7bcd']]])
    )
    expect(revisionsByTip).toEqual(
      new Map([
        ['4fb124a', ['d1343a8', '1ee5f2e']],
        ['42b8736', ['2173124', '9523bde']],
        ['1ba7bcd', ['22e40e1', '91116c1', 'e821416', 'c658f8b', '23250b3']]
      ])
    )
  })
})

describe('collectBranchRevision', () => {
  it('should return the expected revision from the test fixture', () => {
    const revision = collectBranchRevision(expShowFixture)
    expect(revision).toEqual('53c3851')
  })
})

describe('collectMutableRevisions', () => {
  it('should always return an empty array when checkpoints are present', () => {
    const mutable = collectMutableRevisions(expShowFixture, true)
    expect(mutable).toEqual([])
  })

  it('should return all running experiments when there are no checkpoints', () => {
    const experimentsRunningInTemp = {
      workspace: {
        baseline: {
          data: {
            queued: false,
            running: false,
            executor: null
          }
        }
      },
      f5f308f5afc019de72823106d568248cd8270da4: {
        baseline: {
          data: {
            queued: false,
            running: false,
            executor: null,
            name: 'main'
          }
        },
        b2880aefbeb48a51be5c832f7a9fd7577b97acd3: {
          data: {
            queued: false,
            running: false,
            executor: null,
            name: 'exp-c3e8a'
          }
        },
        '6ee95de8dd28fbaf9fe280a71cf254928d3fa830': {
          data: {
            queued: false,
            running: true,
            executor: 'temp'
          }
        },
        ebaa07e67a983fe0b695312809e7798ac339d0f9: {
          data: {
            queued: false,
            running: true,
            executor: 'temp'
          }
        }
      }
    }

    const mutable = collectMutableRevisions(experimentsRunningInTemp, false)
    expect(mutable).toEqual(['6ee95de', 'ebaa07e'])
  })
})

describe('collectData', () => {
  it('should return the expected output from the test fixture', () => {
    const { revisionData, comparisonData } = collectData(plotsDiffFixture)
    const revisions = ['main', '42b8736', '1ba7bcd', '4fb124a']

    const values =
      (LogsLossTsv?.content?.data as { values: { rev: string }[] }).values || []

    expect(isEmpty(values)).toBeFalsy()

    revisions.forEach(revision => {
      const expectedValues = values.filter(value => value.rev === revision)
      expect(revisionData[revision]['logs/loss.tsv']).toEqual(expectedValues)
    })

    expect(Object.keys(revisionData)).toEqual(revisions)

    expect(Object.keys(revisionData.main)).toEqual([
      'logs/loss.tsv',
      'logs/acc.tsv',
      'predictions.json'
    ])

    expect(Object.keys(comparisonData.main)).toEqual([
      'plots/acc.png',
      'plots/heatmap.png',
      'plots/loss.png'
    ])

    expect(comparisonData['1ba7bcd']['plots/heatmap.png']).toEqual(
      plotsDiffFixture['plots/heatmap.png'][1]
    )
  })
})

describe('collectTemplates', () => {
  it('should return the expected output from the test fixture', () => {
    const { content } = LogsLossTsv
    const expectedTemplate = omit(content, 'data')

    const templates = collectTemplates(plotsDiffFixture)
    expect(Object.keys(templates)).toEqual([
      'logs/loss.tsv',
      'logs/acc.tsv',
      'predictions.json'
    ])

    expect(templates['logs/loss.tsv']).not.toEqual(content)

    expect(templates['logs/loss.tsv']).toEqual(expectedTemplate)
  })
})

describe('collectPaths', () => {
  it('should always return the paths in order', () => {
    const { comparison, plots } = collectPaths({
      z: [{ type: PlotsType.IMAGE } as StaticPlot],
      b: [{ type: PlotsType.IMAGE } as StaticPlot],
      a: [{ type: PlotsType.IMAGE } as StaticPlot],
      y: [{ type: PlotsType.VEGA } as StaticPlot],
      c: [{ type: PlotsType.VEGA } as StaticPlot],
      f: [{ type: PlotsType.VEGA } as StaticPlot]
    })

    expect(comparison).toEqual(['a', 'b', 'z'])
    expect(plots).toEqual(['c', 'f', 'y'])
  })
})
