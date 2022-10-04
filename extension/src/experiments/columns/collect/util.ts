import { Column, ColumnType } from '../../webview/contract'
import { Value } from '../../../cli/dvc/contract'
import { ConfigKey, getConfigValue } from '../../../vscode/config'

export type ColumnAccumulator = Record<string, Column>

const joinPathArray = (
  pathSegments: string[],
  sep: string,
  fileSep: string
): string[] => {
  const [fileSegment, ...rest] = pathSegments

  if (!fileSegment) {
    return []
  }

  if (rest.length === 0) {
    return [fileSegment]
  }

  return [fileSegment + fileSep + rest.join(sep)]
}

export const limitAncestorDepth = (
  ancestors: string[],
  sep: string,
  fileSep: string,
  label: string,
  limit = 5
): {
  limitedDepthAncestors: string[]
  limitedDepthLabel: string
} => {
  const [path, ...rest] = ancestors
  const collectedLimit = Number(
    getConfigValue(ConfigKey.EXP_TABLE_HEAD_MAX_LAYERS, limit)
  )

  switch (collectedLimit) {
    case 1:
      return {
        limitedDepthAncestors: [],
        limitedDepthLabel: joinPathArray([...ancestors, label], sep, fileSep)[0]
      }
    case 2:
      return {
        limitedDepthAncestors: joinPathArray(ancestors, sep, fileSep),
        limitedDepthLabel: label
      }
    default: {
      /* 
      The depth is only limited for the middle of the path array.
      The first and final layer are excluded, and the
      concatenated layer itself counts as one; because of this, we must subtract 3
      from what we want the final layer count to be.
      */
      const convertedLimit = collectedLimit - 3
      if (collectedLimit <= 0 || rest.length <= convertedLimit) {
        return { limitedDepthAncestors: ancestors, limitedDepthLabel: label }
      }
      const cutoff = rest.length - convertedLimit
      const concatenatedPath = rest.slice(0, cutoff).join(sep)
      return {
        limitedDepthAncestors: [path, concatenatedPath, ...rest.slice(cutoff)],
        limitedDepthLabel: label
      }
    }
  }
}

const mergeParentColumnByPath = (
  acc: ColumnAccumulator,
  type: ColumnType,
  path: string,
  parentPath: string,
  label: string
) => {
  if (!acc[path]) {
    acc[path] = {
      hasChildren: true,
      label,
      parentPath,
      path,
      type
    }
  } else {
    acc[path].hasChildren = true
  }
}

const getValueType = (value: Value) => {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  return typeof value
}

const setStringLength = (column: Column, stringLength: number) => {
  if (!column.maxStringLength || column.maxStringLength < stringLength) {
    column.maxStringLength = stringLength
  }
}

const mergeNumberIntoColumn = (column: Column, value: number) => {
  const { maxNumber, minNumber } = column
  if (maxNumber === undefined || maxNumber < value) {
    column.maxNumber = value
  }
  if (minNumber === undefined || minNumber > value) {
    column.minNumber = value
  }
}

export const mergeAncestors = (
  acc: ColumnAccumulator,
  type: ColumnType,
  path: string,
  limitedDepthAncestors: string[],
  join: (...pathArray: string[]) => string
) => {
  if (!acc[path]) {
    for (let i = 1; i <= limitedDepthAncestors.length; i++) {
      const pathArray = limitedDepthAncestors.slice(0, i)
      mergeParentColumnByPath(
        acc,
        type,
        join(...pathArray),
        join(...pathArray.slice(0, -1)),
        pathArray[pathArray.length - 1]
      )
    }
  }
}

const mergeValueIntoColumn = (column: Column, value: Value) => {
  const valueType = getValueType(value)
  if (!column.types) {
    column.types = [valueType]
  } else if (!column.types.includes(valueType)) {
    column.types.push(valueType)
  }

  setStringLength(column, String(value).length)

  if (valueType === 'number') {
    mergeNumberIntoColumn(column, value as number)
  }
}

const buildValueColumn = (
  path: string,
  parentPath: string,
  pathArray: string[],
  label: string,
  value: Value
) => {
  const valueType = getValueType(value)

  const newColumn: Column = {
    hasChildren: false,
    label,
    maxStringLength: String(value).length,
    parentPath,
    path,
    pathArray,
    type: pathArray[0] as ColumnType,
    types: [valueType]
  }

  if (valueType === 'number') {
    newColumn.maxNumber = value as number
    newColumn.minNumber = value as number
  }

  return newColumn
}

export const mergeValueColumn = (
  acc: ColumnAccumulator,
  path: string,
  parentPath: string,
  pathArray: string[],
  label: string,
  value: Value
) => {
  if (!acc[path]) {
    acc[path] = buildValueColumn(path, parentPath, pathArray, label, value)
    return
  }
  mergeValueIntoColumn(acc[path], value)
}
