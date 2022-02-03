import { PartialDvcYaml } from '../../fileSystem'

export const collectHasCheckpoints = (yaml: PartialDvcYaml): boolean => {
  return !!yaml.stages.train.outs.find(out => {
    if (typeof out === 'string') {
      return false
    }

    if (Object.values(out).find(file => file?.checkpoint)) {
      return true
    }
  })
}
