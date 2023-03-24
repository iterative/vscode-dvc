import {
  EXPERIMENT_WORKSPACE_ID,
  PlotError,
  PlotsOutput
} from '../../cli/dvc/contract'
import { truncate } from '../../util/string'

export const collectErrors = (
  data: PlotsOutput,
  revs: string[],
  errors: PlotError[],
  cliIdToLabel: { [id: string]: string }
) => {
  const fetchedRevs = new Set(
    revs.map((rev: string) => cliIdToLabel[rev] || rev)
  )

  const existingErrors = errors.filter(({ rev }) => !fetchedRevs.has(rev))
  const newErrors = data?.errors || []

  return [
    ...existingErrors,
    ...newErrors.map(error => {
      const { rev } = error
      return {
        ...error,
        rev: cliIdToLabel[rev] || rev
      }
    })
  ]
}

const getMessage = (error: PlotError): string => {
  const { msg, type, source } = error

  if (type === 'FileNotFoundError' && source && !msg) {
    return `${type}: ${source} not found.`
  }
  return [type, msg].filter(Boolean).join(': ')
}

export const collectImageErrors = (
  path: string,
  revision: string,
  errors: PlotError[]
): string | undefined => {
  const msgs: string[] = []
  for (const error of errors) {
    if (error.rev === revision && error.name === path) {
      const msg = getMessage(error)
      msgs.push(msg)
    }
  }

  if (msgs.length === 0) {
    return undefined
  }

  return msgs.join('\n')
}

const formatError = (acc: string[]): string | undefined => {
  if (acc.length === 0) {
    return
  }

  acc.sort()
  acc.unshift('Errors\n|||\n|--|--|')

  return acc.join('\n')
}

export const collectPathErrorsTable = (
  path: string,
  selectedRevisions: string[],
  errors: PlotError[]
): string | undefined => {
  const acc = new Set<string>()
  for (const error of errors) {
    const { name, rev } = error
    if (name !== path || !selectedRevisions.includes(rev)) {
      continue
    }

    const row = `| ${truncate(
      rev,
      EXPERIMENT_WORKSPACE_ID.length
    )} | ${getMessage(error)} |`

    acc.add(row)
  }
  return formatError([...acc])
}
