import React from 'react'

import { DataFilesDict } from 'dvc-integration/src/DvcReader'

import { Column } from 'react-table'

import { DVCExperimentRow } from './Experiments'

import {
  formatFloat,
  formatInteger,
  formatSignedFloat
} from '../util/number-formatting'

type SchemaType = string | string[]

interface SchemaProperty {
  type: SchemaType
  properties?: SchemaProperties
  canBeNegative?: boolean
  canBeFloat?: boolean
}
type SchemaProperties = Record<string, SchemaProperty>

const MaybeUndefinedCell: React.FC<{
  value?: any
  formatter?: (input: any) => string
}> = ({ value, formatter = x => x.toString() }) => {
  if (value === undefined) return <>-</>
  return <>{formatter(value)}</>
}

// String
const StringCell: React.FC<{ value: string }> = ({ value }) => (
  <>{value === undefined ? '-' : value}</>
)
// Integer
const IntegerCell: React.FC<{ value: number }> = ({ value }) => (
  <MaybeUndefinedCell value={value} formatter={formatInteger} />
)
// Float
const FloatCell: React.FC<{ value: number }> = ({ value }) => (
  <MaybeUndefinedCell value={value} formatter={formatFloat} />
)
// Signed Float
const SignedFloatCell: React.FC<{ value: number }> = ({ value }) => (
  <MaybeUndefinedCell value={value} formatter={formatSignedFloat} />
)

const getNumberCellComponent: (
  propertyType: SchemaProperty
) => React.FC<{ value: number }> = propertyType => {
  const { canBeFloat, canBeNegative } = propertyType
  if (canBeFloat) {
    if (canBeNegative) {
      return SignedFloatCell
    }
    return FloatCell
  }
  return IntegerCell
}

const makeMixedCellComponent: (
  propertyType: SchemaProperty
) => React.FC<{ value: any }> = propertyType => {
  const NumberCell = getNumberCellComponent(propertyType)
  return function MixedCell({ value }) {
    if (value === undefined) return null
    return typeof value === 'number' ? (
      <NumberCell value={value} />
    ) : (
      <StringCell value={value} />
    )
  }
}

const getCellComponent: (
  propertyType: SchemaProperty
) => React.FC<{ value: any }> = schemaProperty => {
  const propertyType = schemaProperty.type
  if (Array.isArray(propertyType)) {
    return makeMixedCellComponent(schemaProperty)
  }
  switch (propertyType) {
    case 'number':
      return getNumberCellComponent(schemaProperty)
    default:
      return StringCell
  }
}

const buildColumnIdFromPath = (objectPath: string[]) =>
  objectPath.map(segment => `[${segment}]`).join('')

const mergeType: (
  original: SchemaType | undefined,
  newType: string
) => SchemaType = (original, newType) => {
  if (original === undefined) {
    return newType
  }
  if (Array.isArray(original)) {
    if (original.find(x => x === newType)) {
      return original
    }
    return [...original, newType]
  }
  if (original !== newType) {
    return [original, newType]
  }
  return original
}

const convertObjectsToProperties: (
  samples: Record<string, any>[],
  base?: SchemaProperties
) => SchemaProperties = (samples, base = {}) =>
  samples.reduce((acc, cur) => convertObjectToProperties(cur, acc), base)

const convertObjectToProperties: (
  addition: Record<string, any> | undefined,
  base?: SchemaProperties
) => SchemaProperties = (sample, base = {}) => {
  if (!sample) return base
  const sampleEntries = Object.entries(sample)
  for (const [propertyKey, propertyValue] of sampleEntries) {
    base[propertyKey] = addToProperty(base[propertyKey], propertyValue)
  }
  return base
}

const addToProperty: (
  original: SchemaProperty | undefined,
  addition: any
) => SchemaProperty = (original, addition) => {
  const additionType = typeof addition
  const newProperty: SchemaProperty = original
    ? {
        ...original,
        type: mergeType(original.type, additionType)
      }
    : {
        type: additionType
      }
  // Add additional context depending on type
  switch (additionType) {
    case 'number':
      newProperty.canBeNegative = newProperty.canBeNegative || addition < 0
      newProperty.canBeFloat =
        newProperty.canBeFloat || !Number.isInteger(addition)
      break
    case 'object':
      newProperty.properties = convertObjectToProperties(
        addition,
        newProperty.properties
      )
      break
    default:
  }
  return newProperty
}

const arrayAccessor: <T = any>(
  pathArray: string[]
) => (originalRow: any) => T = pathArray => originalRow => {
  let result = originalRow
  for (let i = 0; i < pathArray.length; i += 1) {
    if (result === undefined) break
    result = result[pathArray[i]]
  }
  return result
}

const buildColumnsFromSchemaProperties: (
  properties: SchemaProperties,
  objectPath?: string[]
) => Column<DVCExperimentRow>[] = (properties, objectPath = []) => {
  const entries = Object.entries(properties)
  return entries.map(([key, property]) => {
    const currentPath = [...objectPath, key]
    const { type: propertyType } = property
    const Cell = getCellComponent(property)
    const column: Column<DVCExperimentRow> & {
      columns?: Column<DVCExperimentRow>[]
      sortType?: string
      type?: SchemaType
    } = {
      Header: key,
      id: buildColumnIdFromPath(currentPath),
      accessor: arrayAccessor(currentPath),
      type: propertyType,
      Cell
    }
    switch (propertyType) {
      case 'object':
        column.columns = buildColumnsFromSchemaProperties(
          property.properties || {},
          currentPath
        )
        break
      case 'integer':
      case 'number':
        column.sortType = 'basic'
        break
      default:
    }
    return column
  })
}

const buildDynamicColumnsFromExperiments: (
  data: DVCExperimentRow[]
) => Column<DVCExperimentRow>[] = data => {
  if (!data || data.length === 0) {
    return []
  }

  const { params, metrics } = data.reduce<{
    params: DataFilesDict[]
    metrics: DataFilesDict[]
  }>(
    ({ params, metrics }, cur) => ({
      params: cur.params ? [...params, cur.params] : params,
      metrics: cur.metrics ? [...metrics, cur.metrics] : metrics
    }),
    { params: [], metrics: [] }
  )

  const paramsProperties = convertObjectsToProperties(params)
  const metricsProperties = convertObjectsToProperties(metrics)

  const columns = [
    ...buildColumnsFromSchemaProperties(paramsProperties, ['params']),
    ...buildColumnsFromSchemaProperties(metricsProperties, ['metrics'])
  ]

  return columns
}

export default buildDynamicColumnsFromExperiments
