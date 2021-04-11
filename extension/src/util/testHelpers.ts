import { URI } from 'vscode-uri'

export function mapPaths(uris?: URI[]): string[] | undefined {
  return uris?.map(uri => uri.fsPath)
}
