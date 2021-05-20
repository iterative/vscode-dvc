/* eslint-disable @typescript-eslint/no-use-before-define */
import React from 'react'
import get from 'lodash/get'

import { DataDictRoot } from 'dvc/src/Experiments/Webview/contract'
import { Experiment } from './parse-experiments'

import {
  formatFloat,
  formatInteger,
  formatSignedFloat
} from './number-formatting'
import { Column, Accessor } from 'react-table'

type SchemaType = string | string[]

interface SchemaProperty {
  type: SchemaType
  properties?: SchemaProperties
  canBeNegative?: boolean
  canBeFloat?: boolean
}
type SchemaProperties = Record<string, SchemaProperty>

type Value = string | number
type ValueObject = Record<string, Value>
type ValueTree = Record<string, ValueObject | Value>

const UndefinedCell = <>-</>

// String
const StringCell: React.FC<{ value: Value }> = ({ value }) =>
  value === undefined ? UndefinedCell : <>{value}</>
// Integer
const IntegerCell: React.FC<{ value: Value }> = ({ value }) =>
  value === undefined ? UndefinedCell : <>{formatInteger(value as number)}</>
// Float
const FloatCell: React.FC<{ value: Value }> = ({ value }) =>
  value === undefined ? UndefinedCell : <>{formatFloat(value as number)}</>
// Signed Float
const SignedFloatCell: React.FC<{ value: Value }> = ({ value }) =>
  value === undefined ? (
    UndefinedCell
  ) : (
    <>{formatSignedFloat(value as number)}</>
  )

const getNumberCellComponent: (
  propertyType: SchemaProperty
) => React.FC<{ value: Value }> = propertyType => {
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
) => React.FC<{ value: Value }> = propertyType => {
  const NumberCell = getNumberCellComponent(propertyType)
  return function MixedCell({ value }) {
    if (value === undefined) {
      return null
    }
    return typeof value === 'number' ? (
      <NumberCell value={value} />
    ) : (
      <StringCell value={value} />
    )
  }
}

const getCellComponent: (
  propertyType: SchemaProperty
) => React.FC<{ value: Value }> = schemaProperty => {
  const propertyType = schemaProperty.type
  if (Array.isArray(propertyType)) {
    return makeMixedCellComponent(schemaProperty)
  }
  if (propertyType === 'number') {
    return getNumberCellComponent(schemaProperty)
  }
  return StringCell
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
  samples: ValueTree[],
  base?: SchemaProperties
) => SchemaProperties = (samples, base = {}) =>
  samples.reduce((acc, cur) => convertObjectToProperties(cur, acc), base)

const convertObjectToProperties: (
  addition?: ValueTree,
  base?: SchemaProperties
) => SchemaProperties = (sample, base = {}) => {
  if (!sample) {
    return base
  }
  const sampleEntries = Object.entries(sample)
  for (const [propertyKey, propertyValue] of sampleEntries) {
    base[propertyKey] = addToProperty(base[propertyKey], propertyValue)
  }
  return base
}

const addToProperty: (
  original: SchemaProperty | undefined,
  addition: Value | Record<string, Value>
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
        addition as Record<string, Value>,
        newProperty.properties
      )
      break
    default:
  }
  return newProperty
}

const buildAccessor: (
  valuePath: string[]
) => Accessor<Experiment> = pathArray => originalRow =>
  get(originalRow, pathArray)

const buildColumnsFromSchemaProperties: (
  properties: SchemaProperties,
  objectPath?: string[]
) => Column<Experiment>[] = (properties, objectPath = []) => {
  const entries = Object.entries(properties)
  return entries.map(([key, property]) => {
    const currentPath = [...objectPath, key]
    const { type: propertyType } = property
    const Cell = getCellComponent(property)
    const column: Column<Experiment> & {
      columns?: Column<Experiment>[]
      sortType?: string
      type?: SchemaType
    } = {
      Header: key,
      id: buildColumnIdFromPath(currentPath),
      accessor: buildAccessor(currentPath),
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

const dataReducer = (data: Experiment[]) =>
  data.reduce<{
    params: DataDictRoot[]
    metrics: DataDictRoot[]
  }>(
    ({ params, metrics }, cur) => ({
      params: cur.params ? [...params, cur.params] : params,
      metrics: cur.metrics ? [...metrics, cur.metrics] : metrics
    }),
    { params: [], metrics: [] }
  )

const buildDynamicColumnsFromExperiments = (
  data: Experiment[]
): Column<Experiment>[] => {
  if (!data || data?.length === 0) {
    return []
  }

  const { params, metrics } = dataReducer(data)

  const paramsProperties = convertObjectsToProperties(params as ValueTree[])
  const metricsProperties = convertObjectsToProperties(metrics as ValueTree[])

  return [
    ...buildColumnsFromSchemaProperties(paramsProperties, ['params']),
    ...buildColumnsFromSchemaProperties(metricsProperties, ['metrics'])
  ]
}

export default buildDynamicColumnsFromExperiments
