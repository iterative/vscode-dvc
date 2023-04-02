import { PlotError, PlotsOutput } from '../../cli/dvc/contract'

export const collectErrors = (
  data: PlotsOutput,
  revs: string[],
  errors: PlotError[],
  cliIdToLabel: { [id: string]: string }
) => {
  const existingErrors = errors.filter(
    ({ rev }) => !revs.includes(cliIdToLabel[rev] || rev)
  )
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
