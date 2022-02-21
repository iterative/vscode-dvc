import { VegaPlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React from 'react'
import styles from './styles.module.scss'
import { StaticPlot } from './StaticPlot'

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

  const makeKey = (path: string, i: number) => `plot-${path}-${i}`

  const renderPlots = (entries: VegaPlots) =>
    Object.entries(entries).map(([path, plots]) =>
      plots.map((plot: VegaPlot, i) => (
        <StaticPlot key={makeKey(path, i)} plot={plot} />
      ))
    )

  return (
    <>
      <div className={styles.singleViewPlotsGrid}>
        {renderPlots(singleViewPlots)}
      </div>
      <div className={styles.multiViewPlotsGrid}>
        {renderPlots(multiViewPlots)}
      </div>
    </>
  )
}
