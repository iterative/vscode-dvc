/* eslint-disable @typescript-eslint/no-explicit-any */
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { VisualizationSpec } from 'react-vega'
import { TopLevelSpec } from 'vega-lite'
import { ExprRef, hasOwnProperty, SignalRef, Title, truncate, Text } from 'vega'
import { TitleParams } from 'vega-lite/build/src/title'
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
import { ColorScale, PlotSize, Revision } from '../webview/contract'
import { ShapeEncoding, StrokeDashEncoding } from '../multiSource/constants'

const COMMIT_FIELD = 'rev'

const getFacetField = (
  template: TopLevelSpec | VisualizationSpec
): string | null => {
  const facetSpec = template as TopLevelFacetSpec
  if (facetSpec.facet) {
    return (
      (facetSpec.facet as FacetFieldDef<any, any>).field ||
      (facetSpec.facet as FacetMapping<any>).row?.field ||
      (facetSpec.facet as FacetMapping<any>).column?.field
    )
  }

  const unitSpec = template as TopLevelUnitSpec<any>
  if (unitSpec.encoding) {
    return (
      unitSpec.encoding.facet?.field ||
      unitSpec.encoding.row?.field ||
      unitSpec.encoding.column?.field
    )
  }

  return null
}

const isVegaFacetPlot = (template: TopLevelSpec | VisualizationSpec): boolean =>
  !!getFacetField(template)

type ConcatSpec = TopLevel<GenericConcatSpec<NonNormalizedSpec>>
type VerticalConcatSpec = TopLevel<GenericVConcatSpec<NonNormalizedSpec>>
type HorizontalConcatSpec = TopLevel<GenericHConcatSpec<NonNormalizedSpec>>

const isVegaConcatPlot = (
  template: TopLevelSpec | VisualizationSpec
): boolean =>
  (template as ConcatSpec).concat?.length > 0 ||
  (template as VerticalConcatSpec).vconcat?.length > 0 ||
  (template as HorizontalConcatSpec).hconcat?.length > 0

const isVegaRepeatPlot = (
  template: TopLevelSpec | VisualizationSpec
): boolean => {
  const repeatSpec = template as TopLevel<NonLayerRepeatSpec>
  return (
    !!repeatSpec.repeat &&
    ((repeatSpec.repeat as string[]).length > 0 ||
      ((repeatSpec.repeat as RepeatMapping).row?.length || 0) > 0 ||
      ((repeatSpec.repeat as RepeatMapping).column?.length || 0) > 0)
  )
}

export const isMultiViewPlot = (
  template?: TopLevelSpec | VisualizationSpec
): boolean =>
  !template ||
  isVegaFacetPlot(template) ||
  isVegaConcatPlot(template) ||
  isVegaRepeatPlot(template)

export const isMultiViewByCommitPlot = (
  template?: TopLevelSpec | VisualizationSpec
): boolean => !template || getFacetField(template) === COMMIT_FIELD

export const getColorScale = (
  revisions: Revision[]
): ColorScale | undefined => {
  const acc: ColorScale = { domain: [], range: [] }

  for (const { revision, displayColor } of revisions) {
    acc.domain.push(revision)
    acc.range.push(displayColor)
  }

  return acc.domain.length > 0 ? acc : undefined
}

export type Encoding = {
  strokeDash?: StrokeDashEncoding & {
    legend: {
      disable: boolean
    }
  }
  shape?: ShapeEncoding & {
    legend: {
      disable: boolean
    }
  }
  detail?: {
    field: string
  }
  color?: {
    legend: {
      disable: boolean
    }
    scale: ColorScale
  }
}

type EncodingUpdate = {
  encoding: Encoding
}

export const getSpecEncodingUpdate = ({
  color,
  shape,
  strokeDash
}: {
  color?: ColorScale
  shape?: ShapeEncoding
  strokeDash?: StrokeDashEncoding
}): EncodingUpdate => {
  const encoding: Encoding = {}
  if (color) {
    encoding.color = {
      legend: { disable: true },
      scale: color
    }
  }

  if (strokeDash) {
    encoding.strokeDash = {
      ...strokeDash,
      legend: { disable: true }
    }
  }
  if (shape) {
    encoding.shape = {
      ...shape,
      legend: { disable: true }
    }
    encoding.detail = shape
  }

  return {
    encoding
  }
}

const mergeUpdate = (spec: TopLevelSpec, update: EncodingUpdate) => {
  let newSpec = cloneDeep(spec) as any

  if (newSpec.concat?.length) {
    newSpec.concat = newSpec.concat.map((c: any) => merge(c, update))
  } else if (newSpec.hconcat?.length) {
    newSpec.hconcat = newSpec.hconcat.map((c: any) => merge(c, update))
  } else if (newSpec.vconcat?.length) {
    newSpec.vconcat = newSpec.vconcat.map((c: any) => merge(c, update))
  } else if (newSpec.spec) {
    newSpec.spec = merge(newSpec.spec, update)
  } else {
    newSpec = merge(newSpec, update)
  }

  return newSpec
}

const truncateTitleString = (title: string, size: number) =>
  truncate(title, size, 'left')

const truncateTitleAsArrayOrString = (title: Text, size: number) => {
  if (Array.isArray(title)) {
    return title.map(line => truncateTitleString(line, size))
  }
  return truncateTitleString(title as unknown as string, size)
}

const TitleLimit = {
  [PlotSize.LARGE]: 50,
  [PlotSize.REGULAR]: 50,
  [PlotSize.SMALL]: 30
}

const truncateTitlePart = (
  title: Title,
  key: 'text' | 'subtitle',
  size: number
) => {
  if (hasOwnProperty(title, key)) {
    const text = title[key] as unknown as Text
    title[key] = truncateTitleAsArrayOrString(text, size)
  }
}

const truncateTitle = (
  title: Title | Text | TitleParams<ExprRef | SignalRef> | undefined,
  size: number
) => {
  if (!title) {
    return ''
  }

  if (typeof title === 'string') {
    return truncateTitleString(title, size)
  }

  if (Array.isArray(title)) {
    return truncateTitleAsArrayOrString(title as Text, size)
  }

  const titleCopy = { ...title } as Title
  truncateTitlePart(titleCopy, 'text', size)
  truncateTitlePart(titleCopy, 'subtitle', size)
  return titleCopy
}

export const truncateVerticalTitle = (title: Text | Title, size: PlotSize) =>
  truncateTitle(title, TitleLimit[size] * 0.75)

const isEndValue = (valueType: string) =>
  ['string', 'number', 'boolean'].includes(valueType)

export const truncateTitles = (
  spec: TopLevelSpec,
  size: PlotSize,
  vertical?: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  if (spec && typeof spec === 'object') {
    const specCopy: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(spec)) {
      const valueType = typeof value
      if (key === 'y') {
        vertical = true
      }
      if (key === 'title') {
        const title = value as unknown as Title
        specCopy[key] = vertical
          ? truncateVerticalTitle(title, size)
          : truncateTitle(title, TitleLimit[size])
      } else if (isEndValue(valueType)) {
        specCopy[key] = value
      } else if (Array.isArray(value)) {
        specCopy[key] = value.map(val =>
          isEndValue(typeof val) ? val : truncateTitles(val, size, vertical)
        )
      } else if (typeof value === 'object') {
        specCopy[key] = truncateTitles(value, size, vertical)
      }
    }
    return specCopy
  }
  return spec
}

export const extendVegaSpec = (
  spec: TopLevelSpec,
  size: PlotSize,
  encoding?: {
    color?: ColorScale
    strokeDash?: StrokeDashEncoding
    shape?: ShapeEncoding
  }
) => {
  const updatedSpec = truncateTitles(spec, size) as unknown as TopLevelSpec

  if (isMultiViewByCommitPlot(spec) || !encoding) {
    return updatedSpec
  }

  const update = getSpecEncodingUpdate(encoding)

  return mergeUpdate(updatedSpec, update)
}

export const reverseOfLegendSuppressionUpdate = () => ({
  spec: {
    encoding: {
      color: { legend: { disable: false } },
      shape: {
        legend: {
          disable: false
        }
      },
      strokeDash: {
        legend: {
          disable: false,
          encode: {
            symbols: {
              update: {
                fill: { value: 'transparent' },
                stroke: { value: 'grey' }
              }
            }
          }
        }
      }
    }
  }
})
