import { workspace, WorkspaceConfiguration } from 'vscode'

/**
 * Configurations contributed by the DVC extension.
 *
 * @remarks
 * Import 'getConfig' to use, and call it before each retrieval. Think of it as a snapshot.
 * There is odd persistence behaviour with WorkspaceConfiguration objects that we want to avoid tripping over.
 */
class Config {
  private config: WorkspaceConfiguration

  constructor() {
    this.config = workspace.getConfiguration()
  }

  public get dvcPath(): string {
    return <string>this.config.get('dvc.dvcPath')
  }
}

export function getConfig(): Config {
  return new Config()
}
