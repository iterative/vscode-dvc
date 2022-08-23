import {
  TemplatePlotSection,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'

const remove = (section: TemplatePlotSection, entryId: string) => {
  const entries = section.entries.filter(({ id }) => id !== entryId)
  return {
    entries,
    group: section.group
  }
}

const add = (
  section: TemplatePlotSection,
  entry: TemplatePlotEntry,
  position?: number
) => {
  const entries = [...section.entries]
  entries.splice(
    position !== undefined ? position : entries.length - 1,
    0,
    entry
  )
  return { entries, group: section.group }
}

const cleanup = (section: TemplatePlotSection) =>
  section.entries.length > 0 ? section : null

export const removeFromPreviousAndAddToNewSection = (
  sections: TemplatePlotSection[],
  oldSectionIndex: number,
  entryId: string,
  newGroupIndex?: number,
  entry?: TemplatePlotEntry,
  position?: number
) => {
  const newSections = sections.map((section, i) => {
    if (i === oldSectionIndex) {
      return remove(section, entryId)
    } else if (i === newGroupIndex && entry) {
      return add(section, entry, position)
    }
    return section
  })

  return newSections
    .map(section => cleanup(section))
    .filter(Boolean) as TemplatePlotSection[]
}
