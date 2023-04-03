import isEqual from 'lodash.isequal'
import {
  ShapeEncoding,
  StrokeDashEncoding,
  StrokeDashScale,
  StrokeDash,
  Shape,
  StrokeDashValue,
  ShapeValue
} from './constants'
import { isImagePlot, Plot, TemplatePlot } from '../webview/contract'
import { PlotsOutput } from '../../cli/dvc/contract'
import { sortCollectedArray } from '../../util/array'

const FIELD_SEPARATOR = '::'

type Values = { filename?: Set<string>; field?: Set<string> }

type Variation = {
  filename?: string | undefined
  field?: string | undefined
}
type Variations = Variation[]

export type MultiSourceVariations = Record<string, Variations>

export type MultiSourceEncoding = Record<
  string,
  {
    strokeDash: StrokeDashEncoding
    shape?: ShapeEncoding
  }
>

export const mergeFields = (fields: string[]): string =>
  fields.join(FIELD_SEPARATOR)

export const isConcatenatedField = (field: string): boolean =>
  !!field.includes(FIELD_SEPARATOR)

export const unmergeConcatenatedFields = (field: string): string[] =>
  field.split(FIELD_SEPARATOR)

export const getDvcDataVersionInfo = (
  value: Record<string, unknown>
): Record<string, unknown> => {
  const dvcDataVersionInfo =
    (value.dvc_data_version_info as Record<string, unknown>) || {}
  if (dvcDataVersionInfo.revision) {
    delete dvcDataVersionInfo.revision
  }

  return dvcDataVersionInfo
}

const collectPlotMultiSourceVariations = (
  acc: Record<string, Record<string, unknown>[]>,
  path: string,
  plot: TemplatePlot
) => {
  if (!acc[path]) {
    acc[path] = []
  }

  for (const value of Object.values(plot.datapoints || {}).flat()) {
    const dvcDataVersionInfo = getDvcDataVersionInfo(value)

    if (acc[path].some(obj => isEqual(obj, dvcDataVersionInfo))) {
      continue
    }
    acc[path].push(dvcDataVersionInfo)
  }
}

const collectPathMultiSourceVariations = (
  acc: Record<string, Record<string, unknown>[]>,
  path: string,
  plots: Plot[]
) => {
  for (const plot of plots) {
    if (isImagePlot(plot)) {
      continue
    }

    collectPlotMultiSourceVariations(acc, path, plot)
  }
}

export const collectMultiSourceVariations = (
  output: PlotsOutput,
  acc: Record<string, Record<string, unknown>[]>
) => {
  const { data } = output
  for (const [path, plots] of Object.entries(data)) {
    collectPathMultiSourceVariations(acc, path, plots)
  }

  return acc
}

const initializeAcc = (values: Values, key: 'filename' | 'field') => {
  if (!values[key]) {
    values[key] = new Set<string>()
  }
}

const collectMultiSourceValue = (values: Values, variation: Variation) => {
  for (const [key, value] of Object.entries(variation)) {
    if (key !== 'filename' && key !== 'field') {
      continue
    }
    initializeAcc(values, key)
    ;(values[key] as Set<string>).add(value)
  }
}

const collectMultiSourceValues = (variations: Variations): Values => {
  const values: Values = {}
  for (const variation of variations) {
    collectMultiSourceValue(values, variation)
  }
  return values
}

const sortDifferentVariations = (
  differentVariations: { field: string; variations: number }[],
  expectedOrder: string[]
): { field: string; variations: number }[] => {
  differentVariations.sort(
    (
      { field: aField, variations: aVariations },
      { field: bField, variations: bVariations }
    ) =>
      aVariations === bVariations
        ? expectedOrder.indexOf(aField) - expectedOrder.indexOf(bField)
        : aVariations - bVariations
  )
  return differentVariations
}

const groupVariations = (
  variations: Variations,
  values: Values
): {
  lessValuesThanVariations: { field: string; variations: number }[]
  valuesMatchVariations: string[]
} => {
  const valuesMatchVariations: string[] = []
  const lessValuesThanVariations: { field: string; variations: number }[] = []

  for (const [field, valueSet] of Object.entries(values)) {
    if (valueSet.size === 1) {
      continue
    }
    if (valueSet.size === variations.length) {
      valuesMatchVariations.push(field)
      continue
    }
    lessValuesThanVariations.push({ field, variations: valueSet.size })
  }

  const expectedOrder = ['filename', 'field']
  return {
    lessValuesThanVariations: sortDifferentVariations(
      lessValuesThanVariations,
      expectedOrder
    ),
    valuesMatchVariations: sortCollectedArray(
      valuesMatchVariations,
      (a, b) => expectedOrder.indexOf(a) - expectedOrder.indexOf(b)
    )
  }
}

const collectVariation = (
  scale: StrokeDashScale,
  keysToCombine: string[],
  field: Set<string>,
  idx: number,
  variation: Variation
): void => {
  const domain: string[] = []

  for (const key of keysToCombine as (keyof typeof variation)[]) {
    if (variation[key]) {
      domain.push(variation[key] as string)
      field.add(key)
    }
  }

  scale.domain.push(mergeFields(domain))
  scale.range.push(StrokeDash[idx])
  scale.domain.sort()
}

const getEncoding = <T extends StrokeDashValue | ShapeValue>(
  field: Set<string>,
  scale: { domain: string[]; range: T[] }
): { field: string; scale: { domain: string[]; range: T[] } } => ({
  field: mergeFields([...field]),
  scale
})

const collectMergedStrokeDashEncoding = (
  acc: MultiSourceEncoding,
  path: string,
  variations: Variations,
  keysToCombine: string[]
): void => {
  const scale: StrokeDashScale = {
    domain: [],
    range: []
  }
  let idx = 0
  const field = new Set<string>()

  for (const variation of variations) {
    collectVariation(scale, keysToCombine, field, idx, variation)
    idx++
  }

  acc[path] = {
    strokeDash: getEncoding(field, scale)
  }
}

const collectEncodingFromValues = <T extends typeof Shape | typeof StrokeDash>(
  scaleRange: T,
  values: Values,
  lessValuesThanVariations: { field: string; variations: number }[]
): { field: string; scale: { range: T[number][]; domain: string[] } } => {
  const scale: { range: T[number][]; domain: string[] } = {
    domain: [],
    range: []
  }
  const filenameOrField = lessValuesThanVariations.shift()
  let idx = 0
  const field = new Set<string>()
  if (filenameOrField?.field) {
    for (const value of values[filenameOrField.field as 'filename' | 'field'] ||
      []) {
      field.add(filenameOrField.field)
      scale.domain.push(value)
      scale.range.push(scaleRange[idx])
      scale.domain.sort()
      idx++
    }
  }
  return getEncoding(field, scale)
}

const collectUnmergedStrokeDashEncoding = (
  acc: MultiSourceEncoding,
  path: string,
  values: Values,
  lessValuesThanVariations: { field: string; variations: number }[]
): void => {
  acc[path] = {
    strokeDash: collectEncodingFromValues(
      StrokeDash,
      values,
      lessValuesThanVariations
    )
  }
}

const collectUnmergedShapeEncoding = (
  acc: MultiSourceEncoding,
  path: string,
  values: Values,
  lessValuesThanVariations: { field: string; variations: number }[]
): void => {
  acc[path] = {
    ...acc[path],
    shape: collectEncodingFromValues(Shape, values, lessValuesThanVariations)
  }
}

const collectPathMultiSourceEncoding = (
  acc: MultiSourceEncoding,
  path: string,
  variations: Variations
): void => {
  const values = collectMultiSourceValues(variations)

  const { valuesMatchVariations, lessValuesThanVariations } = groupVariations(
    variations,
    values
  )

  if (valuesMatchVariations.length > 0) {
    const keysToCombined = [
      ...valuesMatchVariations,
      ...lessValuesThanVariations.map(({ field }) => field)
    ]
    collectMergedStrokeDashEncoding(acc, path, variations, keysToCombined)
    return
  }

  if (lessValuesThanVariations.length > 0 && !acc[path]?.strokeDash) {
    collectUnmergedStrokeDashEncoding(
      acc,
      path,
      values,
      lessValuesThanVariations
    )
  }

  if (lessValuesThanVariations.length > 0) {
    collectUnmergedShapeEncoding(acc, path, values, lessValuesThanVariations)
  }
}

export const collectMultiSourceEncoding = (
  data: Record<string, { filename?: string; field?: string }[]>
): MultiSourceEncoding => {
  const acc: MultiSourceEncoding = {}

  for (const [path, variations] of Object.entries(data)) {
    if (variations.length <= 1) {
      continue
    }

    collectPathMultiSourceEncoding(acc, path, variations)
  }

  return acc
}
