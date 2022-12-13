import { IExtension } from './interfaces'
import { checkAvailable } from './setup'

export const willRecheck = (
  extension: IExtension,
  dvcRootOrFirstFolder: string
) => {
  setTimeout(() => checkAvailable(extension, dvcRootOrFirstFolder, true), 5000)
}
