/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { VisualizationSpec } from 'react-vega'
import { TopLevelSpec } from 'vega-lite'
import type { ExprRef, SignalRef, Title, Text } from 'vega'
import { hasOwnProperty, truncate } from 'vega-util'
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
import isEqual from 'lodash.isequal'
import { ColorScale, DEFAULT_NB_ITEMS_PER_ROW } from '../webview/contract'
import { ShapeEncoding, StrokeDashEncoding } from '../multiSource/constants'
import { Color } from '../../experiments/model/status/colors'

type SpecTitle = {
  normal: Title | undefined
  truncated: string | string[] | Title | undefined
}

interface SpecTitles {
  x: SpecTitle
  y: SpecTitle
  main: SpecTitle
}

export type SpecWithTitles = VisualizationSpec & { titles: SpecTitles }

const COMMIT_FIELD = 'rev'

const getFacetField = (
  template: TopLevelSpec | SpecWithTitles
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

const isVegaFacetPlot = (template: TopLevelSpec | SpecWithTitles): boolean =>
  !!getFacetField(template)

type ConcatSpec = TopLevel<GenericConcatSpec<NonNormalizedSpec>>
type VerticalConcatSpec = TopLevel<GenericVConcatSpec<NonNormalizedSpec>>
type HorizontalConcatSpec = TopLevel<GenericHConcatSpec<NonNormalizedSpec>>

const isVegaConcatPlot = (template: TopLevelSpec | SpecWithTitles): boolean =>
  (template as ConcatSpec).concat?.length > 0 ||
  (template as VerticalConcatSpec).vconcat?.length > 0 ||
  (template as HorizontalConcatSpec).hconcat?.length > 0

const isVegaRepeatPlot = (template: TopLevelSpec | SpecWithTitles): boolean => {
  const repeatSpec = template as TopLevel<NonLayerRepeatSpec>
  return (
    !!repeatSpec.repeat &&
    ((repeatSpec.repeat as string[]).length > 0 ||
      ((repeatSpec.repeat as RepeatMapping).row?.length || 0) > 0 ||
      ((repeatSpec.repeat as RepeatMapping).column?.length || 0) > 0)
  )
}

export const isMultiViewPlot = (
  template?: TopLevelSpec | SpecWithTitles
): boolean =>
  !template ||
  isVegaFacetPlot(template) ||
  isVegaConcatPlot(template) ||
  isVegaRepeatPlot(template)

export const isMultiViewByCommitPlot = (
  template?: TopLevelSpec | SpecWithTitles
): boolean => !template || getFacetField(template) === COMMIT_FIELD

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

type ShapePatchUpdate = {
  layer?: { layer: [{ encoding: Record<string, unknown> }] }[]
}

type EncodingUpdate = {
  encoding: Encoding
} & ShapePatchUpdate

const specHasVerticalLineOnHover = (
  spec: any
): spec is { layer: { layer: [{ encoding: Record<string, unknown> }] }[] } =>
  spec.layer?.[1]?.layer?.[0]?.encoding?.x &&
  isEqual(spec.layer[1].layer[0].mark, {
    color: 'gray',
    type: 'rule'
  })

const patchShapeEncoding = (spec: TopLevelSpec, encoding: Encoding) => {
  const update: EncodingUpdate = {
    encoding
  }

  if (encoding.shape && specHasVerticalLineOnHover(spec)) {
    update.layer = spec.layer
    update.layer[1].layer[0].encoding.shape = null
  }

  return update
}

const getSpecEncodingUpdate = (
  spec: TopLevelSpec,
  {
    color,
    shape,
    strokeDash
  }: {
    color?: ColorScale
    shape?: ShapeEncoding
    strokeDash?: StrokeDashEncoding
  }
): EncodingUpdate => {
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
      legend: {
        disable: true
      }
    }
  }

  if (shape) {
    encoding.shape = {
      ...shape,
      legend: {
        disable: true
      }
    }
    encoding.detail = { field: shape.field }
  }

  return patchShapeEncoding(spec, encoding)
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

const truncateVerticalTitle = (
  title: Text | Title,
  width: number,
  height: number
) => truncateTitle(title, Math.floor((50 - (width - height) * 5) * 0.75))

const isEndValue = (valueType: string) =>
  ['string', 'number', 'boolean'].includes(valueType)

const truncateTitles = (
  spec: TopLevelSpec,
  width: number,
  height: number,
  axis: 'x' | 'y' | 'main',
  titles: SpecTitles
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  if (spec && typeof spec === 'object') {
    const specCopy: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(spec)) {
      if (['data', 'color', 'strokeDash', 'shape', 'detail'].includes(key)) {
        specCopy[key] = value
        continue
      }

      const valueType = typeof value
      if (key === 'y' || key === 'x') {
        axis = key
      }

      if (key === 'title') {
        const title = value as unknown as Title
        const truncatedTitle =
          axis === 'y'
            ? truncateVerticalTitle(title, width, height)
            : truncateTitle(title, width > DEFAULT_NB_ITEMS_PER_ROW ? 30 : 50)
        titles[axis].normal = title
        titles[axis].truncated = truncatedTitle
        specCopy[key] = truncatedTitle
      } else if (isEndValue(valueType)) {
        specCopy[key] = value
      } else if (Array.isArray(value)) {
        specCopy[key] = value.map(val =>
          isEndValue(typeof val)
            ? val
            : truncateTitles(val, width, height, axis, titles)
        )
      } else if (typeof value === 'object') {
        specCopy[key] = truncateTitles(value, width, height, axis, titles)
      }
    }
    return specCopy
  }
  return spec
}

export const truncateVegaSpecTitles = (
  spec: TopLevelSpec,
  width: number,
  height: number
) => {
  const emptyTitle = { normal: undefined, truncated: undefined }
  const titles = {
    main: { ...emptyTitle },
    x: { ...emptyTitle },
    y: { ...emptyTitle }
  }
  const updatedSpec = truncateTitles(
    spec,
    width,
    height,
    'main',
    titles
  ) as unknown as TopLevelSpec

  ;(updatedSpec as any).titles = titles

  return updatedSpec
}

export const extendVegaSpec = (
  spec: TopLevelSpec,
  width: number,
  height: number,
  encoding?: {
    color?: ColorScale
    strokeDash?: StrokeDashEncoding
    shape?: ShapeEncoding
  }
) => {
  const updatedSpec = truncateVegaSpecTitles(spec, width, height)

  if (isMultiViewByCommitPlot(spec) || !encoding) {
    return updatedSpec
  }

  const update = getSpecEncodingUpdate(updatedSpec, encoding)

  return mergeUpdate(updatedSpec, update)
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
