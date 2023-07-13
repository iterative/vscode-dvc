import { dirname } from 'path'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { BaseData } from '../data'
import { findFiles } from '../fileSystem/workspace'

export class PipelineData extends BaseData<{
  dag: string
  stages: { [pipeline: string]: string | undefined }
}> {
  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    super(
      dvcRoot,
      internalCommands,
      [{ name: 'update', process: () => this.update() }],
      ['dvc.yaml']
    )

    void this.managedUpdate()
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public async update(): Promise<void> {
    const [dag, fileList] = await Promise.all([
      this.internalCommands.executeCommand(AvailableCommands.DAG, this.dvcRoot),
      this.findDvcYamls()
    ])

    const dvcYamlsDirs = new Set<string>()
    for (const file of fileList) {
      if (file.startsWith(this.dvcRoot)) {
        dvcYamlsDirs.add(dirname(file))
      }
    }

    const stages: { [dir: string]: string } = {}
    for (const dir of dvcYamlsDirs) {
      stages[dir] = await this.internalCommands.executeCommand(
        AvailableCommands.STAGE_LIST,
        dir
      )
    }

    return this.notifyChanged({ dag, stages })
  }

  private findDvcYamls() {
    return findFiles('**/dvc.yaml')
  }
}
