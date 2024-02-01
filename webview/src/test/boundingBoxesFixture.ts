/* eslint-disable sonarjs/no-duplicate-string */
import {
  ComparisonClassDetails,
  ComparisonPlotClasses,
  ComparisonPlotClass,
  PlotsComparisonData
} from 'dvc/src/plots/webview/contract'

const boxColors = [
  '#ff3838',
  '#ff9d97',
  '#ff701f',
  '#ffb21d',
  '#cfd231',
  '#48f90a',
  '#92cc17',
  '#3ddb86',
  '#1a9334',
  '#00d4bb',
  '#2c99a8',
  '#00c2ff',
  '#344593',
  '#6473ff',
  '#0018ec',
  '#8438ff',
  '#520085',
  '#cb38ff',
  '#ff95c8',
  '#ff37c7'
]

const boundingBoxImgClasses: ComparisonClassDetails = {
  car: { color: boxColors[1], selected: true },
  sign: { color: boxColors[2], selected: false },
  'traffic light': { color: boxColors[3], selected: true }
}
const classesArr: {
  rev: string
  classes: ComparisonPlotClass[]
}[] = [
  {
    classes: [
      { boxes: [{ h: 75, w: 100, x: 100, y: 100 }], label: 'traffic light' },
      { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
    ],
    rev: 'exp-83425'
  },
  {
    classes: [
      { boxes: [{ h: 110, w: 100, x: 90, y: 100 }], label: 'traffic light' },
      { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
    ],
    rev: 'exp-e7a67'
  },
  {
    classes: [
      { boxes: [{ h: 100, w: 100, x: 100, y: 100 }], label: 'traffic light' },
      { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
    ],
    rev: 'main'
  },
  {
    classes: [
      { boxes: [{ h: 100, w: 90, x: 100, y: 110 }], label: 'traffic light' },
      { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
    ],
    rev: 'test-branch'
  },
  {
    classes: [
      { boxes: [{ h: 90, w: 80, x: 120, y: 120 }], label: 'traffic light' },
      {
        boxes: [
          { h: 30, w: 30, x: 190, y: 310 },
          { h: 50, w: 60, x: 300, y: 320 }
        ],
        label: 'car'
      }
    ],
    rev: 'workspace'
  }
]

export const addBoundingBoxes = (
  fixture: PlotsComparisonData
): PlotsComparisonData => {
  const boundingBoxPlotPath =
    fixture.plots.find(({ path }) => path.includes('bounding_boxes.png'))
      ?.path || ''
  const plotClasses: ComparisonPlotClasses = {}

  for (const { rev, classes } of classesArr) {
    plotClasses[rev] = { [boundingBoxPlotPath]: classes }
  }

  return {
    ...fixture,
    plotClasses,
    plots: fixture.plots.map(plot => {
      const isBoundingBoxImg = plot.path.includes('bounding_boxes.png')

      if (!isBoundingBoxImg) {
        return plot
      }

      return {
        ...plot,
        classDetails: boundingBoxImgClasses
      }
    })
  }
}
