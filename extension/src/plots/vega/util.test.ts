import { Text as VegaText, Title as VegaTitle } from 'vega'
import { TopLevelSpec } from 'vega-lite'
import merge from 'lodash.merge'
import {
  isMultiViewPlot,
  isMultiViewByCommitPlot,
  extendVegaSpec,
  getColorScale,
  Encoding,
  reverseOfLegendSuppressionUpdate
} from './util'
import confusionTemplate from '../../test/fixtures/plotsDiff/templates/confusion'
import confusionNormalizedTemplate from '../../test/fixtures/plotsDiff/templates/confusionNormalized'
import defaultTemplate from '../../test/fixtures/plotsDiff/templates/default'
import linearTemplate from '../../test/fixtures/plotsDiff/templates/linear'
import scatterTemplate from '../../test/fixtures/plotsDiff/templates/scatter'
import smoothTemplate from '../../test/fixtures/plotsDiff/templates/smooth'
import { copyOriginalColors } from '../../experiments/model/status/colors'
import { PlotSize } from '../webview/contract'

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

describe('getColorScale', () => {
  it('should return undefined given an empty object', () => {
    expect(getColorScale([])).toBeUndefined()
  })

  it('should convert an object to a vega color scale', () => {
    const [firstColor, secondColor] = copyOriginalColors()
    expect(
      getColorScale([
        { displayColor: firstColor, revision: 'main' },
        { displayColor: secondColor, revision: 'workspace' }
      ])
    ).toStrictEqual({
      domain: ['main', 'workspace'],
      range: [firstColor, secondColor]
    })
  })
})

describe('extendVegaSpec', () => {
  it('should not add encoding if no color scale is provided', () => {
    const extendedSpec = extendVegaSpec(linearTemplate, PlotSize.REGULAR)
    expect(extendedSpec.encoding).toBeUndefined()
  })

  it('should extend the default linear template', () => {
    const colorScale = {
      domain: ['workspace', 'main'],
      range: copyOriginalColors().slice(0, 2)
    }
    const extendedSpec = extendVegaSpec(linearTemplate, PlotSize.REGULAR, {
      color: colorScale
    })

    expect(extendedSpec).not.toStrictEqual(defaultTemplate)
    expect(extendedSpec.encoding.color).toStrictEqual({
      legend: { disable: true },
      scale: colorScale
    })
  })

  const longTitle =
    'we-need-a-very-very-very-long-title-to-test-with-many-many-many-characters-at-least-seventy-characters'
  const longAxisTitleHorizontal = `${longTitle}-x`
  const longAxisTitleVertical = `${longTitle}-y`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layers = (linearTemplate as any).layer

  const withLongTemplatePlotTitle = (title: VegaText | VegaTitle = longTitle) =>
    ({
      ...linearTemplate,
      layer: [
        {
          ...layers[0],
          encoding: {
            ...layers[0].encoding,
            x: {
              ...layers[0].encoding.x,
              title: longAxisTitleHorizontal
            },
            y: {
              ...layers[0].encoding.y,
              title: longAxisTitleVertical
            }
          }
        },
        ...layers.slice(1)
      ],
      title
    } as TopLevelSpec)

  it('should truncate all titles from the left to 50 characters for large plots', () => {
    const spec = withLongTemplatePlotTitle()
    const updatedSpec = extendVegaSpec(spec, PlotSize.LARGE)

    const truncatedTitle = '…-many-many-characters-at-least-seventy-characters'
    const truncatedHorizontalTitle =
      '…any-many-characters-at-least-seventy-characters-x'
    const truncatedVerticalTitle = '…racters-at-least-seventy-characters-y'

    const specString = JSON.stringify(spec)
    expect(specString).not.toContain(truncatedTitle)
    expect(specString).not.toContain(truncatedHorizontalTitle)
    expect(specString).not.toContain(truncatedVerticalTitle)
    expect(specString).toContain(longTitle)
    expect(specString).toContain(longAxisTitleHorizontal)
    expect(specString).toContain(longAxisTitleVertical)

    const updatedSpecString = JSON.stringify(updatedSpec)
    expect(updatedSpecString).toContain(truncatedTitle)
    expect(updatedSpecString).toContain(truncatedHorizontalTitle)
    expect(updatedSpecString).toContain(truncatedVerticalTitle)
    expect(updatedSpecString).not.toContain(longTitle)
    expect(updatedSpecString).not.toContain(longAxisTitleHorizontal)
    expect(updatedSpecString).not.toContain(longAxisTitleVertical)
  })

  it('should truncate all titles from the left to 50 characters for regular plots', () => {
    const spec = withLongTemplatePlotTitle()
    const updatedSpec = extendVegaSpec(spec, PlotSize.REGULAR)

    const truncatedTitle = '…-many-many-characters-at-least-seventy-characters'
    const truncatedHorizontalTitle =
      '…any-many-characters-at-least-seventy-characters-x'
    const truncatedVerticalTitle = '…racters-at-least-seventy-characters-y'

    const specString = JSON.stringify(spec)
    expect(specString).not.toContain(truncatedTitle)
    expect(specString).not.toContain(truncatedHorizontalTitle)
    expect(specString).not.toContain(truncatedVerticalTitle)
    expect(specString).toContain(longTitle)
    expect(specString).toContain(longAxisTitleHorizontal)
    expect(specString).toContain(longAxisTitleVertical)

    const updatedSpecString = JSON.stringify(updatedSpec)
    expect(updatedSpecString).toContain(truncatedTitle)
    expect(updatedSpecString).toContain(truncatedHorizontalTitle)
    expect(updatedSpecString).toContain(truncatedVerticalTitle)
    expect(updatedSpecString).not.toContain(longTitle)
    expect(updatedSpecString).not.toContain(longAxisTitleHorizontal)
    expect(updatedSpecString).not.toContain(longAxisTitleVertical)
  })

  it('should truncate all titles from the left to 30 characters for small plots', () => {
    const spec = withLongTemplatePlotTitle()
    const updatedSpec = extendVegaSpec(spec, PlotSize.SMALL)

    const truncatedTitle = '…s-at-least-seventy-characters'
    const truncatedHorizontalTitle = '…at-least-seventy-characters-x'
    const truncatedVerticalTitle = '…t-seventy-characters-y'

    const specString = JSON.stringify(spec)
    expect(specString).not.toContain(truncatedTitle)
    expect(specString).not.toContain(truncatedHorizontalTitle)
    expect(specString).not.toContain(truncatedVerticalTitle)
    expect(specString).toContain(longTitle)
    expect(specString).toContain(longAxisTitleHorizontal)
    expect(specString).toContain(longAxisTitleVertical)

    const updatedSpecString = JSON.stringify(updatedSpec)
    expect(updatedSpecString).toContain(truncatedTitle)
    expect(updatedSpecString).toContain(truncatedHorizontalTitle)
    expect(updatedSpecString).toContain(truncatedVerticalTitle)
    expect(updatedSpecString).not.toContain(longTitle)
    expect(updatedSpecString).not.toContain(longAxisTitleHorizontal)
    expect(updatedSpecString).not.toContain(longAxisTitleVertical)
  })

  it('should truncate the title and the subtitle', () => {
    const repeatedTitle = 'abcdefghijklmnopqrstuvwyz1234567890'
    const spec = withLongTemplatePlotTitle({
      subtitle: repeatedTitle,
      text: repeatedTitle
    })

    const updatedSpec = extendVegaSpec(spec, PlotSize.SMALL)

    const truncatedTitle = '…ghijklmnopqrstuvwyz1234567890'

    const specString = JSON.stringify(spec)
    expect(specString).toContain(repeatedTitle)
    expect(specString).not.toContain(truncatedTitle)

    const updatedSpecString = JSON.stringify(updatedSpec)
    expect(updatedSpecString).not.toContain(repeatedTitle)
    expect(updatedSpecString).toContain(truncatedTitle)
  })

  it('should truncate every line of the title', () => {
    const repeatedTitle = 'abcdefghijklmnopqrstuvwyz1234567890'
    const spec = withLongTemplatePlotTitle([repeatedTitle, repeatedTitle])

    const updatedSpec = extendVegaSpec(spec, PlotSize.SMALL)

    const truncatedTitle = '…ghijklmnopqrstuvwyz1234567890'

    const specString = JSON.stringify(spec)
    expect(specString).toContain(repeatedTitle)
    expect(specString).not.toContain(truncatedTitle)

    const updatedSpecString = JSON.stringify(updatedSpec)
    expect(updatedSpecString).not.toContain(repeatedTitle)
    expect(updatedSpecString).toContain(truncatedTitle)
  })

  it('should truncate every line of the title and subtitle', () => {
    const repeatedTitle = 'abcdefghijklmnopqrstuvwyz1234567890'
    const spec = withLongTemplatePlotTitle({
      subtitle: [repeatedTitle, repeatedTitle],
      text: [repeatedTitle, repeatedTitle]
    })

    const updatedSpec = extendVegaSpec(spec, PlotSize.SMALL)

    const truncatedTitle = '…ghijklmnopqrstuvwyz1234567890'

    const specString = JSON.stringify(spec)
    expect(specString).toContain(repeatedTitle)
    expect(specString).not.toContain(truncatedTitle)

    const updatedSpecString = JSON.stringify(updatedSpec)
    expect(updatedSpecString).not.toContain(repeatedTitle)
    expect(updatedSpecString).toContain(truncatedTitle)
  })
})

describe('reverseOfLegendSuppressionUpdate', () => {
  it('should reverse the legend suppression applied by extendVegaSpec', () => {
    type NonOptionalEncoding = { [P in keyof Encoding]-?: Encoding[P] }
    const update: NonOptionalEncoding = {
      color: {
        legend: {
          disable: true
        },
        scale: { domain: [], range: [] }
      },
      detail: {
        field: 'shape-field'
      },
      shape: {
        field: 'shape-field',
        legend: {
          disable: true
        },
        scale: { domain: [], range: [] }
      },
      strokeDash: {
        field: 'strokeDash-field',
        legend: {
          disable: true
        },
        scale: { domain: [], range: [] }
      }
    }

    expect(JSON.stringify(update)).toContain('"legend":{"disable":true}')

    const reverse = reverseOfLegendSuppressionUpdate()

    const result = JSON.stringify(
      merge({ spec: { encoding: update } }, reverse)
    )
    expect(result).not.toContain('"legend":{"disable":true}')
    expect(result).toContain('"legend":{"disable":false}')
  })
})
