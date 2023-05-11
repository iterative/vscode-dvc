import { join } from 'path'
import {
  DVCLIVE_ONLY_RUNNING_SIGNAL_FILE,
  EXP_RWLOCK_FILE
} from '../../cli/dvc/constants'
import { getPidFromFile } from '../../fileSystem'

export const collectDvcRootPids = async (
  acc: Set<number>,
  dvcRoot: string
): Promise<void> => {
  for (const file of [
    join(dvcRoot, DVCLIVE_ONLY_RUNNING_SIGNAL_FILE),
    join(dvcRoot, EXP_RWLOCK_FILE)
  ]) {
    const pid = await getPidFromFile(file)
    if (!pid) {
      continue
    }
    acc.add(pid)
  }
}

export const collectRunningExperimentPids = async (
  dvcRoots: string[]
): Promise<number[]> => {
  const acc = new Set<number>()
  for (const dvcRoot of dvcRoots) {
    await collectDvcRootPids(acc, dvcRoot)
  }
  return [...acc]
}
