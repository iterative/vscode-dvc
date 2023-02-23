import { PlotGroup } from './templatePlotsSlice'

const remove = (section: PlotGroup, entryId: string) => {
  const entries = section.entries.filter(id => id !== entryId)
  return {
    entries,
    group: section.group
  }
}

const add = (section: PlotGroup, entryId: string, position?: number) => {
  const entries = [...section.entries]
  entries.splice(
    position === undefined ? entries.length - 1 : position,
    0,
    entryId
  )
  return { entries, group: section.group }
}

const cleanup = (section: PlotGroup) =>
  section.entries.length > 0 ? section : null

export const removeFromPreviousAndAddToNewSection = (
  sections: PlotGroup[],
  oldSectionIndex: number,
  entryId: string,
  newGroupIndex?: number,
  position?: number
) => {
  const newSections = sections.map((section, i) => {
    if (i === oldSectionIndex) {
      return remove(section, entryId)
    } else if (i === newGroupIndex) {
      return add(section, entryId, position)
    }
    return section
  })

  return newSections
    .map(section => cleanup(section))
    .filter(Boolean) as PlotGroup[]
}
