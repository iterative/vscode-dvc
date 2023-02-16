import { env, Uri } from 'vscode'

export const openUrl = (url: string) => env.openExternal(Uri.parse(url))
