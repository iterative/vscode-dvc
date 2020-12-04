import React from 'react'
import generateSchema from 'generate-schema/src/schemas/json'

import { Column } from 'react-table'

import { DVCExperimentRow } from './Experiments'

import { formatSigned, formatSignedInteger } from '../util/number-formatting'

interface NumberValue {
  value: number
}

const cellsByType: Record<string, React.FC<{ value: any }>> = {
  number: ({ value }: NumberValue) => <div>{formatSigned(value)}</div>,
  integer: ({ value }: NumberValue) => <div>{formatSignedInteger(value)}</div>
}

interface SchemaProperty {
  type: string
  properties: SchemaProperties
}
type SchemaProperties = Record<string, SchemaProperty>

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

const buildColumnIdFromPath = (objectPath: string[]) => {
  return objectPath.map(segment => `[${segment}]`).join('')
}

const buildColumnsFromSchemaProperties: (
  properties: SchemaProperties,
  objectPath: string[]
) => Column<DVCExperimentRow>[] = (properties, objectPath = []) => {
  const entries = Object.entries(properties)
  return entries.map(([key, property]) => {
    const currentPath = [...objectPath, key]
    const { type: propertyType } = property
    const column: Column<DVCExperimentRow> & {
      columns?: Column<DVCExperimentRow>[]
      sortType?: string
      type?: string
    } = {
      Header: key,
      id: buildColumnIdFromPath(currentPath),
      accessor: arrayAccessor(currentPath),
      type: propertyType
    }
    const Cell = cellsByType[propertyType]
    if (Cell) column.Cell = Cell
    switch (propertyType) {
      case 'object':
        column.columns = buildColumnsFromSchemaProperties(
          property.properties,
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

  const dynamicProperties = generateSchema(
    data.map(({ params, metrics }) => ({ params, metrics }))
  ).items.properties

  return buildColumnsFromSchemaProperties(dynamicProperties, [])
}

export default buildDynamicColumnsFromExperiments
