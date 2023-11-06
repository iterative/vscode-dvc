import { ShapeEncoding, StrokeDashEncoding } from './constants'
import {
  DVC_METRIC_SHAPE,
  DVC_METRIC_STROKE_DASH,
  PlotsOutput,
  TemplatePlot,
  isImagePlotOutput
} from '../../cli/dvc/contract'

export type MultiSourceEncoding = Record<
  string,
  { strokeDash?: StrokeDashEncoding; shape?: ShapeEncoding }
>

const collectEncoding = (
  acc: MultiSourceEncoding,
  id: string,
  plot: TemplatePlot
): void => {
  if (plot.anchor_definitions[DVC_METRIC_STROKE_DASH]) {
    acc[id] = {
      strokeDash: JSON.parse(
        plot.anchor_definitions[DVC_METRIC_STROKE_DASH]
      ) as StrokeDashEncoding
    }
    return
  }
  if (plot.anchor_definitions[DVC_METRIC_SHAPE]) {
    acc[id] = {
      shape: JSON.parse(
        plot.anchor_definitions[DVC_METRIC_SHAPE]
      ) as ShapeEncoding
    }
  }
}

export const collectMultiSourceEncoding = (
  output: PlotsOutput
): MultiSourceEncoding => {
  const acc: MultiSourceEncoding = {}
  const { data } = output
  for (const [id, plots] of Object.entries(data)) {
    for (const plot of plots) {
      if (isImagePlotOutput(plot)) {
        continue
      }
      collectEncoding(acc, id, plot)
    }
  }
  return acc
}
