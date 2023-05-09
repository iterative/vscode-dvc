import { collectDvcRootPids } from './collect'
import { processExists, stopProcesses } from '../../process/execution'

export const stopWorkspaceExperiment = async (dvcRoot: string, id: string) => {
  const pids = new Set<number>()

  await collectDvcRootPids(pids, dvcRoot)

  const [pid] = [...pids]

  if (!pid || !(await processExists(pid))) {
    return `process executing ${id} was not found.`
  }

  const failedToStop = `failed to kill ${id}.`

  try {
    const stopped = await stopProcesses([pid])
    return stopped ? `${id} has been killed.` : failedToStop
  } catch {
    return failedToStop
  }
}
