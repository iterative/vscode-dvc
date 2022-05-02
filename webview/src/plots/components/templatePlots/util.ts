import {
  TemplatePlotSection,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'

const remove = (section: TemplatePlotSection, entryId: string) => {
  const entries = section.entries.filter(({ id }) => id !== entryId)
  return entries.length > 0
    ? {
        entries,
        group: section.group
      }
    : null
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

export const removeFromPreviousAndAddToNewSection = (
  sections: TemplatePlotSection[],
  oldSectionIndex: number,
  entryId: string,
  newGroupIndex?: number,
  entry?: TemplatePlotEntry,
  position?: number
) =>
  sections
    .map((section, i) => {
      if (i === oldSectionIndex) {
        return remove(section, entryId)
      } else if (i === newGroupIndex && entry) {
        return add(section, entry, position)
      }
      return section
    })
    .filter(Boolean) as TemplatePlotSection[]
