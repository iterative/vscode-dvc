import { AvailableCommands, InternalCommands } from '../commands/internal'
import { BaseData } from '../data'

export class PipelineData extends BaseData<string> {
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
    const dag = await this.internalCommands.executeCommand(
      AvailableCommands.DAG,
      this.dvcRoot
    )
    return this.notifyChanged(dag)
  }
}
