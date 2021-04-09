import { Uri } from 'vscode'

export function mapPaths(uris?: Uri[]): string[] | undefined {
  return uris?.map(uri => uri.fsPath)
}
