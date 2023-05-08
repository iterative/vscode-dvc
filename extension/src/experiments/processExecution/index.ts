import { Toast } from '../../vscode/toast'
import { processExists, stopProcesses } from '../../process/execution'

export const stopWorkspaceExperiment = async (pid: number) => {
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
