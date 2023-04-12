import { join } from 'path'
import { PlotError, PlotsOutput } from '../../cli/dvc/contract'

export type Error = { path: string | undefined; rev: string; msg: string }

const getMessage = (error: PlotError): string => {
  const { msg, type, source } = error

  if (msg) {
    return msg
  }

  if (type === 'FileNotFoundError' && source && !msg) {
    return `${source} not found.`
  }
  return type
}

export const collectErrors = (
  data: PlotsOutput,
  revs: string[],
  errors: Error[]
): Error[] => {
  const fetchedRevs = new Set(revs)

  const existingErrors = errors.filter(({ rev }) => !fetchedRevs.has(rev))
  const newErrors = data?.errors || []

  return [
    ...existingErrors,
    ...newErrors.map(error => {
      const { rev, name } = error
      return {
        msg: getMessage(error),
        path: name,
        rev
      }
    })
  ]
}

export const collectImageErrors = (
  path: string,
  revision: string,
  errors: Error[]
): string[] | undefined => {
  const acc: string[] = []
  for (const error of errors) {
    if (error.rev === revision && error.path === path) {
      acc.push(error.msg)
    }
  }

  if (acc.length === 0) {
    return undefined
  }

  return acc
}

const isDuplicateError = (
  acc: { rev: string; msg: string }[],
  rev: string,
  msg: string
) =>
  acc.some(
    ({ rev: existingRev, msg: existingMsg }) =>
      rev === existingRev && msg === existingMsg
  )

const isRevisionError = (path: string | undefined): path is undefined => !path

export const collectPathErrors = (
  path: string,
  selectedRevisions: string[],
  errors: Error[]
): { rev: string; msg: string }[] | undefined => {
  const acc: { rev: string; msg: string }[] = []
  for (const error of errors) {
    const { msg, rev } = error
    if (
      (!isRevisionError(error.path) && error.path !== path) ||
      !selectedRevisions.includes(rev) ||
      isDuplicateError(acc, rev, msg)
    ) {
      continue
    }

    acc.push({ msg, rev })
  }

  if (acc.length === 0) {
    return undefined
  }

  return acc
}

const addErrorToEveryPath = (
  acc: Set<string>,
  dvcRoot: string,
  paths: string[]
) => {
  for (const path of paths) {
    acc.add(join(dvcRoot, path))
  }
}

export const collectErrorPaths = (
  dvcRoot: string,
  selectedRevisions: string[],
  paths: string[],
  errors: Error[]
): Set<string> => {
  const acc = new Set<string>()
  for (const { path, rev } of errors) {
    if (!selectedRevisions.includes(rev)) {
      continue
    }

    if (isRevisionError(path)) {
      addErrorToEveryPath(acc, dvcRoot, paths)
      continue
    }

    acc.add(join(dvcRoot, path))
  }
  return acc
}
