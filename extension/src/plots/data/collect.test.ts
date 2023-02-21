import { collectMetricsFiles } from './collect'
import expShowFixture from '../../test/fixtures/expShow/base/output'
import { ExperimentsOutput } from '../../cli/dvc/contract'

describe('collectMetricsFiles', () => {
  it('should return the expected metrics files from the test fixture', () => {
    expect(collectMetricsFiles(expShowFixture, [])).toStrictEqual([
      'summary.json'
    ])
  })

  it('should persist existing files', () => {
    const existingFiles = ['file.json', 'file.py', 'file.tsv', 'file.txt']

    expect(
      collectMetricsFiles({ workspace: { baseline: {} } }, existingFiles)
    ).toStrictEqual(existingFiles)
  })

  it('should not fail when given an error', () => {
    const existingFile = ['metrics.json']

    expect(
      collectMetricsFiles(
        {
          workspace: {
            baseline: { error: { msg: 'I broke', type: 'not important' } }
          }
        },
        existingFile
      )
    ).toStrictEqual(existingFile)
  })

  it('should not fail when given empty output', () => {
    const existingFiles: string[] = []

    expect(
      collectMetricsFiles({} as ExperimentsOutput, existingFiles)
    ).toStrictEqual(existingFiles)
  })
})
