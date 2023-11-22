import {
  isImagePlotOutput,
  PLOT_SHAPE_ANCHOR,
  PLOT_STROKE_DASH_ANCHOR,
  PlotsOutput,
  ShapeEncoding,
  StrokeDashEncoding,
  TemplatePlotOutput
} from '../../cli/dvc/contract'

export type MultiSourceEncoding = Record<
  string,
  { strokeDash?: StrokeDashEncoding; shape?: ShapeEncoding }
>

const collectEncoding = (
  acc: MultiSourceEncoding,
  id: string,
  plot: TemplatePlotOutput
): void => {
  const strokeDashEncoding = plot.anchor_definitions[PLOT_STROKE_DASH_ANCHOR]
  if (strokeDashEncoding) {
    acc[id] = {
      strokeDash: strokeDashEncoding
    }
    return
  }
  const shapeEncoding = plot.anchor_definitions[PLOT_SHAPE_ANCHOR]
  if (shapeEncoding) {
    acc[id] = {
      shape: shapeEncoding
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
