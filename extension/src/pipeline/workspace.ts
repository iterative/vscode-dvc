import { join } from 'path'
import { Uri, commands } from 'vscode'
import { Pipeline } from '.'
import { TEMP_DAG_FILE } from '../cli/dvc/constants'
import { BaseWorkspace } from '../workspace'

export class WorkspacePipeline extends BaseWorkspace<Pipeline> {
  public createRepository(dvcRoot: string) {
    const pipeline = this.dispose.track(
      new Pipeline(dvcRoot, this.internalCommands)
    )

    this.setRepository(dvcRoot, pipeline)

    return pipeline
  }

  public async showDag() {
    const cwd = await this.getOnlyOrPickProject()

    if (!cwd) {
      return
    }

    return commands.executeCommand(
      'markdown.showPreview',
      Uri.file(join(cwd, TEMP_DAG_FILE))
    )
  }
}
