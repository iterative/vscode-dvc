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

const add = (section: TemplatePlotSection, entry: TemplatePlotEntry) => {
  section.entries.push(entry)
  return { entries: section.entries, group: section.group }
}

export const removeFromPreviousAndAddToNewSection = (
  sections: TemplatePlotSection[],
  oldSectionIndex: number,
  entryId: string,
  newGroupIndex?: number,
  entry?: TemplatePlotEntry
) =>
  sections
    .map((section, i) => {
      if (i === oldSectionIndex) {
        return remove(section, entryId)
      } else if (i === newGroupIndex && entry) {
        return add(section, entry)
      }
      return section
    })
    .filter(Boolean) as TemplatePlotSection[]
