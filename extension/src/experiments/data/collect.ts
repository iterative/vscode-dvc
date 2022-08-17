import { ExperimentsOutput } from '../../cli/reader'

export const collectFiles = (
  data: ExperimentsOutput,
  existingFiles: string[]
): string[] => {
  const files = new Set<string>([
    ...Object.keys({
      ...data?.workspace.baseline?.data?.params,
      ...data?.workspace.baseline?.data?.metrics
    }).filter(Boolean),
    ...existingFiles
  ])

  return [...files]
}
