import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'

export enum PlotsGroup {
  MULTI_VIEW = 'static-multi',
  SINGLE_VIEW = 'static-single'
}

export type PlotSection = {
  group: PlotsGroup
  entries: VegaPlots
}

const remove = (section: PlotSection, entryId: string) => {
  const entries = Object.fromEntries(
    Object.entries(section.entries).filter(
      sectionEntry => sectionEntry[0] !== entryId
    )
  )
  return Object.keys(entries).length > 0
    ? {
        entries,
        group: section.group
      }
    : null
}

const add = (
  section: PlotSection,
  entryId: string,
  entry?: TemplatePlot[]
) => ({
  entries: {
    ...section.entries,
    [entryId]: entry
  },
  group: section.group
})

export const removeFromPreviousSectionAndAddToNewSection = (
  sections: PlotSection[],
  oldSectionIndex: number,
  entryId: string,
  newGroupIndex?: number,
  entry?: TemplatePlot[]
) =>
  sections
    .map((section, i) => {
      if (i === oldSectionIndex) {
        return remove(section, entryId)
      } else if (i === newGroupIndex) {
        return add(section, entryId, entry)
      }
      return section
    })
    .filter(Boolean) as PlotSection[]
