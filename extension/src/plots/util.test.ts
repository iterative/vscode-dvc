import { sep } from 'path'
import { standardisePlotsDataPaths } from './util'
import { PlotsType } from './webview/contract'
import { FIELD_SEPARATOR } from '../cli/dvc/constants'
import { PlotsOutput } from '../cli/dvc/contract'

const join = (pathArr: string[], slash = sep) => pathArr.join(slash)

const getOutput = (slash = sep): PlotsOutput => {
  return {
    data: {
      [join(['plots', 'heatmap.png'], slash)]: [
        {
          revisions: ['main'],
          type: PlotsType.IMAGE,
          url: join(['plots', 'heatmap.png'])
        }
      ],
      [join([`dvc.yaml${FIELD_SEPARATOR}logs`, 'acc.tsv'], slash)]: [
        {
          content: {},
          datapoints: { main: [{}] },
          revisions: ['main'],
          type: PlotsType.VEGA
        }
      ]
    },
    errors: [
      {
        msg: 'No such file or directory',
        name: join(['plots', 'heatmap.png'], slash),
        rev: 'main',
        type: 'FileNotFoundError'
      }
    ]
  }
}

const windowsStyleOutput = getOutput('\\')
const unixStyleOutput = getOutput('/')
const osStyleOutput = getOutput()

describe('standardisePlotsDataPaths', () => {
  it('should update windows and unix style data paths to style based by os', () => {
    expect(standardisePlotsDataPaths(windowsStyleOutput)).toStrictEqual(
      osStyleOutput
    )
    expect(standardisePlotsDataPaths(unixStyleOutput)).toStrictEqual(
      osStyleOutput
    )
  })
  it('should return early if there is a cli error', () => {
    const cliError = {
      error: { msg: 'something has gone wrong', type: 'clierror' }
    }
    expect(standardisePlotsDataPaths(cliError)).toStrictEqual(cliError)
  })
})
