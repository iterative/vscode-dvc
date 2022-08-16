import { ExperimentsOutput } from '../../cli/reader'

export const collectFiles = (data: ExperimentsOutput): string[] => {
  const files = new Set<string>(
    Object.keys({
      ...data?.workspace?.baseline?.data?.params,
      ...data?.workspace?.baseline?.data?.metrics
    }).filter(Boolean)
  )

  return [...files]
}
