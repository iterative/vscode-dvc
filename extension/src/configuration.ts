import * as vscode from 'vscode'

/**
 * Configurations contributed by the DVC extension.
 *
 * @remarks
 * Import 'getConfig' to use. Call it before each retrieval. There is odd persistence behaviour we want to avoid tripping over.
 */
class Config {
  private config: vscode.WorkspaceConfiguration

  constructor() {
    this.config = vscode.workspace.getConfiguration()
  }

  public get dvcPath(): string {
    return <string>this.config.get('dvc.dvcPath')
  }
}

export function getConfig() {
  return new Config()
}
