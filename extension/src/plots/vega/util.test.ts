import merge from 'lodash.merge'
import {
  isMultiViewPlot,
  getColorScale,
  Encoding,
  reverseOfLegendSuppressionUpdate,
  makePlotZoomOnWheel
} from './util'
import confusionTemplate from '../../test/fixtures/plotsDiff/templates/confusion'
import confusionNormalizedTemplate from '../../test/fixtures/plotsDiff/templates/confusionNormalized'
import defaultTemplate from '../../test/fixtures/plotsDiff/templates/default'
import linearTemplate from '../../test/fixtures/plotsDiff/templates/linear'
import scatterTemplate from '../../test/fixtures/plotsDiff/templates/scatter'
import smoothTemplate from '../../test/fixtures/plotsDiff/templates/smooth'
import { copyOriginalColors } from '../../experiments/model/status/colors'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'

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

describe('getColorScale', () => {
  it('should return undefined given an empty object', () => {
    expect(getColorScale([])).toBeUndefined()
  })

  it('should convert an object to a vega color scale', () => {
    const [firstColor, secondColor] = copyOriginalColors()
    expect(
      getColorScale([
        { displayColor: firstColor, id: 'main' },
        { displayColor: secondColor, id: EXPERIMENT_WORKSPACE_ID }
      ])
    ).toStrictEqual({
      domain: ['main', EXPERIMENT_WORKSPACE_ID],
      range: [firstColor, secondColor]
    })
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

describe('makePlotZoomOnWheel', () => {
  it('should provide a spec update that makes custom plots zoom on wheel (and enable pan when zoomed)', () => {
    const { spec: specUpdate } = makePlotZoomOnWheel(true, false)

    expect(Object.keys(specUpdate)).toContain('params')
  })

  it('should provide a spec update that does not break template plots but enables zoom on wheel (and pan when zoomed)', () => {
    const { spec: specUpdate } = makePlotZoomOnWheel(false, false)

    expect(Object.keys(specUpdate)).not.toContain('params')
  })

  it('should provide a spec update that enables zoom on wheel (and pan when zoomed) for the default templates which have smoothing', () => {
    const { spec: specUpdate } = makePlotZoomOnWheel(false, true)

    expect(specUpdate.layer?.[0].params).not.toBeUndefined()
  })
})
