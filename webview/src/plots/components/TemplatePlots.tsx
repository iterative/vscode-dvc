import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React from 'react'
import styles from './styles.module.scss'
import { TemplatePlotGrid } from './TemplatePlotGrid'

interface TemplatePlotsProps {
  plots: VegaPlots
}

type TemplatePlotAccumulator = {
  singleViewPlots: VegaPlots
  multiViewPlots: VegaPlots
}

const fillInPlotsType = (
  plotsType: VegaPlots,
  path: string,
  plot: TemplatePlot
) => {
  plotsType[path] = plotsType[path] ? [...plotsType[path], plot] : [plot]
}

const splitPlotsByViewType = (plots: VegaPlots): TemplatePlotAccumulator => {
  const acc: TemplatePlotAccumulator = {
    multiViewPlots: {},
    singleViewPlots: {}
  }

  for (const [path, pathPlots] of Object.entries(plots)) {
    for (const plot of pathPlots) {
      if (plot.multiView) {
        fillInPlotsType(acc.multiViewPlots, path, plot)
        continue
      }
      fillInPlotsType(acc.singleViewPlots, path, plot)
    }
  }
  return acc
}

export const TemplatePlots: React.FC<TemplatePlotsProps> = ({ plots }) => {
  const { singleViewPlots, multiViewPlots } = splitPlotsByViewType(plots)

  return (
    <>
      <div className={styles.singleViewPlotsGrid}>
        <TemplatePlotGrid entries={singleViewPlots} group="static-single" />
      </div>
      <div className={styles.multiViewPlotsGrid}>
        <TemplatePlotGrid entries={multiViewPlots} group="static-multi" />
      </div>
    </>
  )
}
