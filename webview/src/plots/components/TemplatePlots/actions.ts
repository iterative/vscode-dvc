import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'

export enum PlotsGroup {
  MULTI_VIEW = 'static-multi',
  SINGLE_VIEW = 'static-single'
}

export type PlotSection = {
  group: PlotsGroup
  entries: VegaPlots
}

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
        const entries = Object.fromEntries(
          Object.entries(section.entries).filter(
            sectionEntry => sectionEntry[0] !== entryId
          )
        )
        return Object.keys(entries).length
          ? {
              entries,
              group: section.group
            }
          : null
      } else if (i === newGroupIndex) {
        return {
          entries: {
            ...section.entries,
            [entryId]: entry
          },
          group: section.group
        }
      }
      return section
    })
    .filter(Boolean) as PlotSection[]
