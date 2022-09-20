import isEqual from 'lodash.isequal'
import {
  ShapeEncoding,
  ShapeScale,
  StrokeDashEncoding,
  StrokeDashScale,
  StrokeDash,
  Shape
} from './constants'
import { isImagePlot, Plot, TemplatePlot } from '../webview/contract'
import { PlotsOutput } from '../../cli/dvc/reader'

export const joinFields = (fields: string[]): string => fields.join('::')

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
  data: PlotsOutput,
  acc: Record<string, Record<string, unknown>[]>
) => {
  for (const [path, plots] of Object.entries(data)) {
    collectPathMultiSourceVariations(acc, path, plots)
  }

  return acc
}

const initializeAcc = (
  values: { filename?: Set<string>; field?: Set<string> },
  key: 'filename' | 'field'
) => {
  if (!values[key]) {
    values[key] = new Set<string>()
  }
}

const collectMultiSourceValue = (
  values: { filename?: Set<string>; field?: Set<string> },
  variation: {
    filename?: string | undefined
    field?: string | undefined
  }
) => {
  for (const [key, value] of Object.entries(variation)) {
    if (key !== 'filename' && key !== 'field') {
      continue
    }
    initializeAcc(values, key)
    ;(values[key] as Set<string>).add(value)
  }
}

const collectMultiSourceValues = (
  variations: {
    filename?: string | undefined
    field?: string | undefined
  }[]
): { filename?: Set<string>; field?: Set<string> } => {
  const values: { filename?: Set<string>; field?: Set<string> } = {}
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
  variations: {
    filename?: string | undefined
    field?: string | undefined
  }[],
  values: {
    filename?: Set<string>
    field?: Set<string>
  }
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
    valuesMatchVariations: valuesMatchVariations.sort(
      (a, b) => expectedOrder.indexOf(a) - expectedOrder.indexOf(b)
    )
  }
}

const collectEqualVariation = (
  scale: StrokeDashScale,
  valuesMatchVariations: string[],
  field: Set<string>,
  idx: number,
  variation: { filename?: string; field?: string }
) => {
  const domain: string[] = []

  for (const key of valuesMatchVariations as (keyof typeof variation)[]) {
    if (variation[key]) {
      domain.push(variation[key] as string)
      field.add(key)
    }
  }

  scale.domain.push(joinFields(domain))
  scale.range.push(StrokeDash[idx])
  scale.domain.sort()
  idx++
}

const combineFieldAndScale = <T extends StrokeDashScale | ShapeScale>(
  field: Set<string>,
  scale: T
): { field: string; scale: T } => ({ field: joinFields([...field]), scale })

const collectScaleFromVariations = (
  acc: Record<
    string,
    {
      strokeDash: StrokeDashEncoding
      shape?: ShapeEncoding
    }
  >,
  path: string,
  variations: {
    filename?: string | undefined
    field?: string | undefined
  }[],
  valuesMatchVariations: string[]
): void => {
  const scale: StrokeDashScale = {
    domain: [],
    range: []
  }

  let idx = 0
  const field = new Set<string>()
  for (const variation of variations) {
    collectEqualVariation(scale, valuesMatchVariations, field, idx, variation)
    idx++
  }

  acc[path] = {
    strokeDash: combineFieldAndScale(field, scale)
  }
}

const collectScaleFromValues = <T extends typeof Shape | typeof StrokeDash>(
  scaleRange: T,
  values: {
    filename?: Set<string>
    field?: Set<string>
  },
  lessValuesThanVariations: { field: string; variations: number }[]
): { field: Set<string>; scale: { range: T[number][]; domain: string[] } } => {
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
  return { field, scale }
}

const collectMultiSourceScales = (
  acc: Record<
    string,
    {
      strokeDash: StrokeDashEncoding
      shape?: ShapeEncoding
    }
  >,
  path: string,
  variations: {
    filename?: string | undefined
    field?: string | undefined
  }[]
): void => {
  const values = collectMultiSourceValues(variations)

  const { valuesMatchVariations, lessValuesThanVariations } = groupVariations(
    variations,
    values
  )

  if (valuesMatchVariations.length > 0) {
    collectScaleFromVariations(acc, path, variations, [
      ...valuesMatchVariations,
      ...lessValuesThanVariations.map(({ field }) => field)
    ])
    return
  }

  if (lessValuesThanVariations.length > 0 && !acc[path]?.strokeDash) {
    const { field, scale } = collectScaleFromValues(
      StrokeDash,
      values,
      lessValuesThanVariations
    )

    acc[path] = {
      strokeDash: combineFieldAndScale(field, scale)
    }
  }

  if (lessValuesThanVariations.length > 0) {
    const { field, scale } = collectScaleFromValues(
      Shape,
      values,
      lessValuesThanVariations
    )

    acc[path] = {
      ...acc[path],
      shape: combineFieldAndScale(field, scale)
    }
  }
}

export const collectMultiSourceData = (
  data: Record<string, { filename?: string; field?: string }[]>
): Record<
  string,
  {
    strokeDash: StrokeDashEncoding
    shape?: ShapeEncoding
  }
> => {
  const acc: Record<
    string,
    {
      strokeDash: StrokeDashEncoding
      shape?: ShapeEncoding
    }
  > = {}

  for (const [path, variations] of Object.entries(data)) {
    if (variations.length <= 1) {
      continue
    }

    collectMultiSourceScales(acc, path, variations)
  }

  return acc
}
