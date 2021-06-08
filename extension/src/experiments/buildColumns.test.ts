import { buildColumns } from './buildColumns'
import schemaExample from './webview/experimentsShowSchemaExample.json'
import complexExample from './webview/complex-output-example.json'

describe('buildColumns', () => {
  it('parses minimal exp show output with all schema types', () => {
    expect(buildColumns(schemaExample)).toMatchSnapshot()
  })
  it('parses the complex exp show properly', () => {
    expect(buildColumns(complexExample)).toMatchSnapshot()
  })
})
