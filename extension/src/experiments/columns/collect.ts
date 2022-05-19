import { join } from 'path'
import { Uri } from 'vscode'
import get from 'lodash/get'
import { ValueWalkMeta, walkRepo } from './walk'
import { joinColumnPath, METRIC_PARAM_SEPARATOR } from './paths'
import { Column, ColumnType } from '../webview/contract'
import {
  ExperimentFields,
  ExperimentFieldsOrError,
  ExperimentsOutput,
  Value,
  ValueTree,
  ValueTreeOrError
} from '../../cli/reader'

const getValueType = (value: Value) => {
  if (value === null) {
    return 'null'
  }
  return typeof value
}

const concatenatePathSegments = (path: string[], limit = 5) => {
  /*
    This function doesn't receive the first and final layer, and the
    concatenated layer itself counts as one; because of this, we must subtract 3
    from what we want the final layer count to be.
  */
  const convertedLimit = limit - 3
  if (path.length > convertedLimit) {
    const cutoff = path.length - convertedLimit
    const concatenatedPath = path.slice(0, cutoff).join(METRIC_PARAM_SEPARATOR)
    return [concatenatedPath, ...path.slice(cutoff)]
  }
  return path
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

const mergeValueIntoColumn = (
  column: Column,
  valueType: string,
  value: Value
) => {
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

export const collectColumns = (data: ExperimentsOutput): Column[] => {
  const collectedColumns: Record<string, Column> = {}

  const mergeParentColumnByPath = (path: string[], type: ColumnType) => {
    const name = path[path.length - 1]
    const columnPath = joinColumnPath(type, ...path)
    const parentPath = joinColumnPath(type, ...path.slice(0, -1))
    if (!collectedColumns[columnPath]) {
      collectedColumns[columnPath] = {
        hasChildren: true,
        name,
        parentPath,
        path: columnPath,
        type
      }
    } else {
      collectedColumns[columnPath].hasChildren = true
    }
  }

  const buildValueColumn = (
    name: string,
    value: Value,
    { type, file }: ValueWalkMeta,
    ancestors: string[],
    concatenatedAncestors: string[],
    path: string,
    valueType: string
  ) => {
    const parentPath = joinColumnPath(type, file, ...concatenatedAncestors)
    const newColumn: Column = {
      hasChildren: false,
      maxStringLength: String(value).length,
      name,
      parentPath,
      path,
      pathArray: [type, file, ...ancestors, name],
      type,
      types: [valueType]
    }

    if (valueType === 'number') {
      newColumn.maxNumber = value as number
      newColumn.minNumber = value as number
    }

    return newColumn
  }

  const mergeValueColumn = (
    name: string,
    value: Value,
    meta: ValueWalkMeta,
    ancestors: string[],
    concatenatedAncestors: string[]
  ) => {
    const { type, file } = meta
    const path = joinColumnPath(type, file, ...concatenatedAncestors, name)
    const valueType = getValueType(value)
    if (!collectedColumns[path]) {
      collectedColumns[path] = buildValueColumn(
        name,
        value,
        meta,
        ancestors,
        concatenatedAncestors,
        path,
        valueType
      )
    } else {
      mergeValueIntoColumn(collectedColumns[path], valueType, value)
    }
  }

  walkRepo(data, (key, value, meta, ancestors) => {
    const concatenatedAncestors = concatenatePathSegments(ancestors)
    const fullConcatenatedPath = [meta.file, ...concatenatedAncestors]
    for (let i = 1; i <= fullConcatenatedPath.length; i++) {
      mergeParentColumnByPath(fullConcatenatedPath.slice(0, i), meta.type)
    }
    mergeValueColumn(key, value, meta, ancestors, concatenatedAncestors)
  })
  return Object.values(collectedColumns)
}

const collectChange = (
  changes: string[],
  type: ColumnType,
  file: string,
  key: string,
  value: Value | ValueTree,
  commitData: ExperimentFields,
  ancestors: string[] = []
) => {
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value as ValueTree)) {
      collectChange(changes, type, file, childKey, childValue, commitData, [
        ...ancestors,
        key
      ])
    }
    return
  }

  if (get(commitData?.[type], [file, 'data', ...ancestors, key]) !== value) {
    changes.push(joinColumnPath(type, file, ...ancestors, key))
  }
}

const collectFileChanges = (
  changes: string[],
  type: ColumnType,
  commitData: ExperimentFields,
  file: string,
  value: ValueTreeOrError
) => {
  const data = value.data
  if (!data) {
    return
  }

  for (const [key, value] of Object.entries(data)) {
    collectChange(changes, type, file, key, value, commitData)
  }
}

const collectColumnsChanges = (
  changes: string[],
  workspaceData: ExperimentFields,
  commitData: ExperimentFields
) => {
  for (const type of Object.values(ColumnType)) {
    for (const [file, value] of Object.entries(workspaceData?.[type] || {})) {
      collectFileChanges(changes, type, commitData, file, value)
    }
  }
}

export const collectParamsFiles = (
  dvcRoot: string,
  data: ExperimentsOutput
): Set<string> => {
  const files = Object.keys(data.workspace.baseline.data?.params || {}).map(
    file => Uri.file(join(dvcRoot, file)).fsPath
  )
  return new Set(files)
}

const getData = (value: { baseline: ExperimentFieldsOrError }) =>
  value.baseline.data || {}

export const collectChanges = (data: ExperimentsOutput): string[] => {
  const changes: string[] = []

  let workspace
  let currentCommit

  for (const [key, value] of Object.entries(data)) {
    if (key === 'workspace') {
      workspace = getData(value)
      continue
    }
    currentCommit = getData(value)
  }

  if (!(workspace && currentCommit)) {
    return changes
  }

  collectColumnsChanges(changes, workspace, currentCommit)

  return changes.sort()
}
