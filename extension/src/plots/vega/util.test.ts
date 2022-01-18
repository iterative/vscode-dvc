import { isMultiViewPlot, isMultiViewByCommitPlot } from './util'
import confusionTemplate from '../../test/fixtures/plotsDiff/templates/confusion'
import confusionNormalizedTemplate from '../../test/fixtures/plotsDiff/templates/confusionNormalized'
import defaultTemplate from '../../test/fixtures/plotsDiff/templates/default'
import linearTemplate from '../../test/fixtures/plotsDiff/templates/linear'
import scatterTemplate from '../../test/fixtures/plotsDiff/templates/scatter'
import smoothTemplate from '../../test/fixtures/plotsDiff/templates/smooth'

describe('isMultiViewPlot', () => {
  it('should recognize the confusion matrix template as a multi view plot', () => {
    expect(isMultiViewPlot(confusionTemplate)).toBe(true)
  })
  it('should recognize the normalized confusion matrix template as a multi view plot', () => {
    expect(isMultiViewPlot(confusionNormalizedTemplate)).toBe(true)
  })
  it('should not recognize the default plot template as a multi view plot', () => {
    expect(isMultiViewPlot(defaultTemplate)).toBe(false)
  })
  it('should not recognize the linear plot template as a multi view plot', () => {
    expect(isMultiViewPlot(linearTemplate)).toBe(false)
  })
  it('should not recognize the scatter plot template as a multi view plot', () => {
    expect(isMultiViewPlot(scatterTemplate)).toBe(false)
  })
  it('should not recognize the smooth plot template as a multi view plot', () => {
    expect(isMultiViewPlot(smoothTemplate)).toBe(false)
  })
})

describe('isMultiViewByCommitPlot', () => {
  it('should recognize the confusion matrix template as a multi view plot', () => {
    expect(isMultiViewByCommitPlot(confusionTemplate)).toBe(true)
  })
  it('should recognize the normalized confusion matrix template as a multi view plot', () => {
    expect(isMultiViewByCommitPlot(confusionNormalizedTemplate)).toBe(true)
  })
  it('should not recognize the default plot template as a multi view plot', () => {
    expect(isMultiViewByCommitPlot(defaultTemplate)).toBe(false)
  })
  it('should not recognize the linear plot template as a multi view plot', () => {
    expect(isMultiViewByCommitPlot(linearTemplate)).toBe(false)
  })
  it('should not recognize the scatter plot template as a multi view plot', () => {
    expect(isMultiViewByCommitPlot(scatterTemplate)).toBe(false)
  })
  it('should not recognize the smooth plot template as a multi view plot', () => {
    expect(isMultiViewByCommitPlot(smoothTemplate)).toBe(false)
  })
})
