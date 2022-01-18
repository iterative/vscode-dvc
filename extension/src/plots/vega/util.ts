/* eslint-disable @typescript-eslint/no-explicit-any */
import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'
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

const COMMIT_FIELD = 'rev'

const getFacetField = (template: TopLevelSpec): string | null => {
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

export const isMultiViewPlot = (template?: TopLevelSpec): boolean =>
  !template ||
  isVegaFacetPlot(template) ||
  isVegaConcatPlot(template) ||
  isVegaRepeatPlot(template)

export const isMultiViewByCommitPlot = (template?: TopLevelSpec): boolean =>
  !template || getFacetField(template) === COMMIT_FIELD

export const getSpecColorUpdate = (
  commits: { name: string; color: string }[]
) => ({
  encoding: {
    color: {
      legend: { disable: true },
      scale: {
        domain: commits.map(({ name }) => name),
        range: commits.map(({ color }) => color)
      }
    }
  }
})

export const getSpecSizeUpdate = (
  hasTitle: boolean,
  width?: 'full' | number
) => ({
  height: 200,
  padding: {
    bottom: 5,
    left: 5,
    right: 5,
    top: hasTitle ? 5 : 20
  },
  width: width === 'full' ? 'container' : width
})

const getUpdate = (
  spec: TopLevelSpec,
  commits: { name: string; color: string }[]
) => ({
  ...(isMultiViewByCommitPlot(spec) ? {} : getSpecColorUpdate(commits)),
  ...getSpecSizeUpdate(
    !!spec.title,
    !isMultiViewPlot(spec) ? 'full' : undefined
  )
})

export const extendVegaSpec = (
  spec: TopLevelSpec,
  commits: { name: string; color: string }[]
) => {
  let newSpec = cloneDeep(spec) as any

  const update = getUpdate(spec, commits)

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
