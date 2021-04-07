import { Uri } from 'vscode'

export function mapPaths(uris: Uri[]): string[] {
  return uris.map(uri => uri.path)
}
