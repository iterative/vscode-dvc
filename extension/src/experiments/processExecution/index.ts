import { processExists, stopProcesses } from '../../process/execution'

export const stopWorkspaceExperiment = async (id: string, pid: number) => {
  if (!(await processExists(pid))) {
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
