import { join } from 'path'
import { EXP_RWLOCK_FILE } from '../../cli/dvc/constants'
import { getPidFromFile } from '../../fileSystem'
import { Toast } from '../../vscode/toast'
import { processExists, stopProcesses } from '../../process/execution'

export const stopWorkspaceExperiment = async (dvcRoot: string) => {
  const pid = await getPidFromFile(join(dvcRoot, EXP_RWLOCK_FILE))
  if (!pid) {
    return
  }
  if (!(await processExists(pid))) {
    return
  }

  void Toast.showOutput(
    stopProcesses([pid]).then(stopped =>
      stopped
        ? 'The experiment running in the workspace was stopped.'
        : 'Failed to stop the experiment running in the workspace.'
    )
  )
}
