import { workspace } from 'vscode'
import { DvcYamlSupportWorkspace } from './support'
import { findFiles } from '../fileSystem/workspace'
import { loadText } from '../fileSystem'

export class CompletionsWorkspace implements DvcYamlSupportWorkspace {
  async findFiles(paths: string[]) {
    const globPattern = `{${paths.join(',')}}`

    const goodPaths = await findFiles(globPattern)
    return goodPaths.map(path => ({
      contents: `${loadText(path)}`,
      path
    }))
  }

  async findPaths(pathFragment: string) {
    const absolutePaths = await workspace.findFiles(
      `{**/${pathFragment}*,**/${pathFragment}*/*}`,
      '**/{.venv,.env}/**'
    )

    return absolutePaths.map(path => workspace.asRelativePath(path, false))
  }
}
