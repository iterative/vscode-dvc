const getCliCommand = (command: string, fsPath: string): string => {
  return `cd ${fsPath.substring(1)} && dvc ${command}`
}

const ADD = 'add'
const CHECKOUT = 'checkout'
const COMMIT = 'commit'
const DESTROY = 'destroy'
const FETCH = 'fetch'
const GC = 'gc'
const INIT = 'init'
const INSTALL = 'install'
const LIST = 'list'
const PULL = 'pull'
const PUSH = 'push'
const RUN_EXPERIMENT = 'exp run'
const STATUS = 'status'

export const getAddCommand = (relPath: string, options: string[]): string => {
  let cmd = `dvc ${ADD} ${relPath.substring(1)}`
  if (options.length) {
    cmd = cmd.concat(' ', options.join(' '))
  }
  return cmd
}

export const getCheckoutCommand = (
  fsPath: string,
  options: string[]
): string => {
  let cmd = getCliCommand(CHECKOUT, fsPath)
  if (options.length) {
    cmd = cmd.concat(' ', options.join(' '))
  }
  return cmd
}

export const getCommitCommand = (fsPath: string): string => {
  return getCliCommand(COMMIT, fsPath)
}

export const getDestroyCommand = (fsPath: string): string => {
  return getCliCommand(DESTROY, fsPath)
}

export const getFetchCommand = (fsPath: string, options: string[]): string => {
  let cmd = getCliCommand(FETCH, fsPath)
  if (options.length) {
    cmd = cmd.concat(' ', options.join(' '))
  }
  return cmd
}

export const getGcCommand = (fsPath: string, options: string[]): string => {
  let cmd = getCliCommand(GC, fsPath)
  if (options.length) {
    cmd = cmd.concat(' ', options.join(' '))
  }
  return cmd
}

export const getInitCommand = (fsPath: string, options: string[]): string => {
  let cmd = getCliCommand(INIT, fsPath)
  if (options.length) {
    cmd = cmd.concat(' ', options.join(' '))
  }
  return cmd
}

export const getInstallCommand = (fsPath: string): string => {
  return getCliCommand(INSTALL, fsPath)
}

export const getListCommand = (fsPath: string): string => {
  return `dvc ${LIST} ${fsPath}`
}

export const getPullCommand = (fsPath: string): string => {
  return getCliCommand(PULL, fsPath)
}

export const getPushCommand = (relPath: string, options: string[]): string => {
  let cmd = `dvc ${PUSH} ${relPath.substring(1)}`
  if (options.length) {
    cmd = cmd.concat(' ', options.join(' '))
  }
  return cmd
}

export const getRunExperimentCommand = (): string => {
  return `dvc ${RUN_EXPERIMENT}`
}

export const getStatusCommand = (fsPath: string): string => {
  return getCliCommand(STATUS, fsPath)
}
