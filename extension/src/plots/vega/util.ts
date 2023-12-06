import type { TopLevelSpec } from 'vega-lite'
import {
  GenericHConcatSpec,
  GenericVConcatSpec,
  NonNormalizedSpec,
  TopLevel,
  TopLevelFacetSpec
} from 'vega-lite/build/src/spec'
import { GenericConcatSpec } from 'vega-lite/build/src/spec/concat'
import { FacetFieldDef, FacetMapping } from 'vega-lite/build/src/spec/facet'
import {
  NonLayerRepeatSpec,
  RepeatMapping
} from 'vega-lite/build/src/spec/repeat'
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit'
import { ColorScale } from '../webview/contract'
import { Color } from '../../experiments/model/status/colors'
import {
  AnchorDefinitions,
  PLOT_ANCHORS,
  ShapeEncoding,
  StrokeDashEncoding
} from '../../cli/dvc/contract'

const getFacetField = (template: TopLevelSpec): string | null => {
  const facetSpec = template as TopLevelFacetSpec
  if (facetSpec.facet) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (facetSpec.facet as FacetFieldDef<any, any>).field ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (facetSpec.facet as FacetMapping<any>).row?.field ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (facetSpec.facet as FacetMapping<any>).column?.field
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unitSpec = template as TopLevelUnitSpec<any>
  if (unitSpec.encoding) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (
      unitSpec.encoding.facet?.field ||
      unitSpec.encoding.row?.field ||
      unitSpec.encoding.column?.field
    )
  }

  return null
}

const isVegaFacetPlot = (template: TopLevelSpec): boolean =>
  !!getFacetField(template)

type ConcatSpec = TopLevel<GenericConcatSpec<NonNormalizedSpec>>
type VerticalConcatSpec = TopLevel<GenericVConcatSpec<NonNormalizedSpec>>
type HorizontalConcatSpec = TopLevel<GenericHConcatSpec<NonNormalizedSpec>>

const isVegaConcatPlot = (template: TopLevelSpec): boolean =>
  (template as ConcatSpec).concat?.length > 0 ||
  (template as VerticalConcatSpec).vconcat?.length > 0 ||
  (template as HorizontalConcatSpec).hconcat?.length > 0

const isVegaRepeatPlot = (template: TopLevelSpec): boolean => {
  const repeatSpec = template as TopLevel<NonLayerRepeatSpec>
  return (
    !!repeatSpec.repeat &&
    ((repeatSpec.repeat as string[]).length > 0 ||
      ((repeatSpec.repeat as RepeatMapping).row?.length || 0) > 0 ||
      ((repeatSpec.repeat as RepeatMapping).column?.length || 0) > 0)
  )
}

const isMultiViewHorizontalBar = (anchorDefinitions?: AnchorDefinitions) =>
  !!anchorDefinitions?.[PLOT_ANCHORS.COLUMN]?.field

export const isMultiViewPlot = (
  template: TopLevelSpec | undefined,
  anchorDefinitions: AnchorDefinitions | undefined
): boolean =>
  !template ||
  isVegaFacetPlot(template) ||
  isVegaConcatPlot(template) ||
  isVegaRepeatPlot(template) ||
  isMultiViewHorizontalBar(anchorDefinitions)

export const getColorScale = (
  revisions: { displayColor: Color; id: string }[]
): ColorScale | undefined => {
  const acc: ColorScale = { domain: [], range: [] }

  for (const { id, displayColor } of revisions) {
    acc.domain.push(id)
    acc.range.push(displayColor)
  }

  return acc.domain.length > 0 ? acc : undefined
}

type LegendDisabled = {
  legend: {
    disable: boolean
  }
}

export type Encoding = {
  strokeDash?: StrokeDashEncoding & LegendDisabled
  shape?: ShapeEncoding & LegendDisabled
  detail?: { field: string }
  color?: { scale: ColorScale } & LegendDisabled
}

export const reverseOfLegendSuppressionUpdate = () => ({
  spec: {
    encoding: {
      color: {
        legend: {
          disable: false
        }
      },
      shape: {
        legend: {
          disable: false,
          symbolFillColor: 'grey'
        }
      },
      strokeDash: {
        legend: {
          disable: false,
          symbolFillColor: 'transparent',
          symbolStrokeColor: 'grey'
        }
      }
    }
  }
})

export const makePlotZoomOnWheel = (
  isCustomPlot: boolean,
  hasSmoothing: boolean
) => {
  if (isCustomPlot) {
    return {
      spec: {
        params: [
          {
            bind: 'scales',
            name: 'grid',
            select: 'interval'
          }
        ]
      }
    }
  }
  if (hasSmoothing) {
    return {
      spec: {
        layer: [
          { params: [{ bind: 'scales', name: 'grid', select: 'interval' }] }
        ]
      }
    }
  }

  return {
    spec: {
      selection: {
        grid: {
          bind: 'scales',
          type: 'interval'
        }
      }
    }
  }
}
