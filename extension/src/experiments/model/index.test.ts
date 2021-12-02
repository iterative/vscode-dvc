import { ExperimentsModel, MementoPrefixes } from '.'
import { buildMockMemento } from '../../test/util'

describe('experimentsModel', () => {
  let model: ExperimentsModel
  const exampleDvcRoot = 'test'
  const persistedSelectedMetrics = ['loss', 'accuracy']
  const memento = buildMockMemento({
    [MementoPrefixes.SELECTED_METRICS + exampleDvcRoot]:
      persistedSelectedMetrics
  })

  beforeEach(() => {
    model = new ExperimentsModel(exampleDvcRoot, memento)
  })

  it('should change the selectedMetrics when calling setSelectedMetrics', () => {
    expect(model.getSelectedMetrics()).toEqual(persistedSelectedMetrics)

    const newSelectedMetrics = ['one', 'two', 'four', 'hundred']
    model.setSelectedMetrics(newSelectedMetrics)

    expect(model.getSelectedMetrics()).toEqual(newSelectedMetrics)
  })

  it('should update the persisted selected metrics when calling setSelectedMetrics', () => {
    const mementoUpdateSpy = jest.spyOn(memento, 'update')
    const newSelectedMetrics = ['one', 'two', 'four', 'hundred']

    model.setSelectedMetrics(newSelectedMetrics)

    expect(mementoUpdateSpy).toHaveBeenCalledTimes(1)
    expect(mementoUpdateSpy).toHaveBeenCalledWith(
      MementoPrefixes.SELECTED_METRICS + exampleDvcRoot,
      newSelectedMetrics
    )
  })
})
