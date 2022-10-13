import { Out, PartialDvcYaml } from '../../fileSystem'

const stageHasCheckpoints = (outs: Out[] = []): boolean => {
  for (const out of outs) {
    if (typeof out === 'string') {
      continue
    }
    if (Object.values(out).some(file => file?.checkpoint)) {
      return true
    }
  }
  return false
}

export const collectHasCheckpoints = (yaml: PartialDvcYaml): boolean => {
  for (const stage of Object.values(yaml?.stages || {})) {
    if (stageHasCheckpoints(stage?.outs)) {
      return true
    }
  }
  return false
}
