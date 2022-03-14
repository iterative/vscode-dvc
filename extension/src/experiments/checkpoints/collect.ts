import { PartialDvcYaml } from '../../fileSystem'

export const collectHasCheckpoints = (yaml: PartialDvcYaml): boolean => {
  return !!yaml.stages.train.outs.some(out => {
    if (typeof out === 'string') {
      return false
    }

    if (Object.values(out).some(file => file?.checkpoint)) {
      return true
    }
  })
}
