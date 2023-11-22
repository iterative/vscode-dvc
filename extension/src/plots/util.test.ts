import { sep } from 'path'
import type { TopLevelSpec } from 'vega-lite'
import { ensurePlotsDataPathsOsSep } from './util'
import { FIELD_SEPARATOR } from '../cli/dvc/constants'
import { PLOT_DATA_ANCHOR, PlotsOutput, PlotsType } from '../cli/dvc/contract'

const joinWithSep = (pathArr: string[], slash = sep) => pathArr.join(slash)

const getOutput = (slash = sep): PlotsOutput => {
  return {
    data: {
      [joinWithSep(['plots', 'heatmap.png'], slash)]: [
        {
          revisions: ['main'],
          type: PlotsType.IMAGE,
          url: joinWithSep(['plots', 'heatmap.png'])
        }
      ],
      [joinWithSep([`dvc.yaml${FIELD_SEPARATOR}logs`, 'acc.tsv'], slash)]: [
        {
          anchor_definitions: { [PLOT_DATA_ANCHOR]: [] },
          content: {} as TopLevelSpec,
          revisions: ['main'],
          type: PlotsType.VEGA
        }
      ]
    },
    errors: [
      {
        msg: 'No such file or directory',
        name: joinWithSep(['plots', 'heatmap.png'], slash),
        rev: 'main',
        type: 'FileNotFoundError'
      }
    ]
  }
}

const windowsStyleOutput = getOutput('\\')
const unixStyleOutput = getOutput('/')
const osStyleOutput = getOutput()

describe('ensurePlotsDataPathsOsSep', () => {
  it('should update windows and unix style data paths to style based by os', () => {
    expect(ensurePlotsDataPathsOsSep(windowsStyleOutput)).toStrictEqual(
      osStyleOutput
    )
    expect(ensurePlotsDataPathsOsSep(unixStyleOutput)).toStrictEqual(
      osStyleOutput
    )
  })
  it('should return early if there is a cli error', () => {
    const cliError = {
      error: { msg: 'something has gone wrong', type: 'clierror' }
    }
    expect(ensurePlotsDataPathsOsSep(cliError)).toStrictEqual(cliError)
  })
})
