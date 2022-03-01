import { VegaPlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React from 'react'
import styles from './styles.module.scss'
import { StaticPlotGrid } from './StaticPlotGrid'

interface StaticPlotsProps {
  plots: VegaPlots
}

type StaticPlotAccumulator = {
  singleViewPlots: VegaPlots
  multiViewPlots: VegaPlots
}

export const StaticPlots: React.FC<StaticPlotsProps> = ({ plots }) => {
  const fillInPlotsType = (
    plotsType: VegaPlots,
    path: string,
    plot: VegaPlot
  ) => {
    plotsType[path] = plotsType[path] ? [...plotsType[path], plot] : [plot]
  }

  const { singleViewPlots, multiViewPlots } = Object.entries(plots).reduce(
    (acc: StaticPlotAccumulator, [path, plots]) => {
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
        <StaticPlotGrid entries={singleViewPlots} />
      </div>
      <div className={styles.multiViewPlotsGrid}>
        <StaticPlotGrid entries={multiViewPlots} />
      </div>
    </>
  )
}
