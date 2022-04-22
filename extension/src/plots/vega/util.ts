/* eslint-disable @typescript-eslint/no-explicit-any */
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { VisualizationSpec } from 'react-vega'
import { TopLevelSpec } from 'vega-lite'
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
import { CheckpointPlotsColors, ComparisonRevision } from '../webview/contract'

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

export type ColorScale = CheckpointPlotsColors

export const getColorScale = (
  revisions: ComparisonRevision[]
): ColorScale | undefined => {
  const acc: ColorScale = { domain: [], range: [] }

  for (const { revision, displayColor } of revisions) {
    acc.domain.push(revision)
    acc.range.push(displayColor)
  }

  return acc.domain.length > 0 ? acc : undefined
}

type EncodingUpdate = {
  encoding: {
    color: {
      legend: {
        disable: boolean
      }
      scale: ColorScale
    }
  }
}

export const getSpecEncodingUpdate = (
  colorScale: ColorScale
): EncodingUpdate => ({
  encoding: {
    color: {
      legend: { disable: true },
      scale: colorScale
    }
  }
})

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

export const extendVegaSpec = (spec: TopLevelSpec, colorScale?: ColorScale) => {
  if (isMultiViewByCommitPlot(spec) || !colorScale) {
    return spec
  }

  const update = getSpecEncodingUpdate(colorScale)

  return mergeUpdate(spec, update)
}
