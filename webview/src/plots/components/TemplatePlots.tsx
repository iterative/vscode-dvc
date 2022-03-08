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

export const TemplatePlots: React.FC<TemplatePlotsProps> = ({ plots }) => {
  const fillInPlotsType = (
    plotsType: VegaPlots,
    path: string,
    plot: TemplatePlot
  ) => {
    plotsType[path] = plotsType[path] ? [...plotsType[path], plot] : [plot]
  }

  const { singleViewPlots, multiViewPlots } = Object.entries(plots).reduce(
    (acc: TemplatePlotAccumulator, [path, plots]) => {
      plots.forEach(plot => {
        if (plot.multiView) {
          fillInPlotsType(acc.multiViewPlots, path, plot)
          return
        }
        fillInPlotsType(acc.singleViewPlots, path, plot)
      })
      return acc
    },
    { multiViewPlots: {}, singleViewPlots: {} }
  )

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
