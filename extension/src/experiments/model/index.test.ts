import { ExperimentsModel } from '.'
import outputFixture from '../../test/fixtures/expShow/output'
import rowsFixture from '../../test/fixtures/expShow/rows'
import { buildMockMemento } from '../../test/util'

describe('ExperimentsModel', () => {
  it('should return rows that equal the rows fixture when given the output fixture', () => {
    const model = new ExperimentsModel('', buildMockMemento())
    model.transformAndSet(outputFixture)
    expect(model.getRowData()).toEqual(rowsFixture)
  })
})
