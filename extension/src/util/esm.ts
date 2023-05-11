import { Deferred } from '@hediet/std/synchronization'

const deferred = new Deferred()
export const esmPackagesImported = deferred.promise

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type EsmExeca = typeof import('execa').execa
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type EsmProcessExists = typeof import('process-exists').processExists

const shouldImportEsm = !process.env.JEST_WORKER_ID

let execa: EsmExeca
let doesProcessExist: EsmProcessExists
const importEsmPackages = async () => {
  const [{ execa: esmExeca }, { processExists: esmProcessExists }] =
    await Promise.all([import('execa'), import('process-exists')])
  execa = esmExeca
  doesProcessExist = esmProcessExists
  deferred.resolve()
}

if (shouldImportEsm) {
  void importEsmPackages()
}

export { execa, doesProcessExist }
