import { quickPickOne } from '../vscode/quickPick'

export const getOnlyOrPickProject = async (
  dvcRoots: string[]
): Promise<string | undefined> => {
  if (dvcRoots.length === 1) {
    return dvcRoots[0]
  }

  return await quickPickOne(
    dvcRoots,
    'Select which project to run command against'
  )
}
