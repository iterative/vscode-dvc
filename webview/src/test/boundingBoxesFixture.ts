/* eslint-disable sonarjs/no-duplicate-string */
import {
  ComparisonClassDetails,
  ComparisonPlotClass,
  ComparisonRevisionData,
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

const boundingBoxImgCoords: { [rev: string]: ComparisonPlotClass[] } = {
  'exp-83425': [
    { boxes: [{ h: 75, w: 100, x: 100, y: 100 }], label: 'traffic light' },
    { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
  ],
  'exp-e7a67': [
    { boxes: [{ h: 110, w: 100, x: 90, y: 100 }], label: 'traffic light' },
    { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
  ],
  main: [
    { boxes: [{ h: 100, w: 100, x: 100, y: 100 }], label: 'traffic light' },
    { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
  ],
  'test-branch': [
    { boxes: [{ h: 100, w: 90, x: 100, y: 110 }], label: 'traffic light' },
    { boxes: [{ h: 30, w: 30, x: 190, y: 310 }], label: 'car' }
  ],
  workspace: [
    { boxes: [{ h: 90, w: 80, x: 120, y: 120 }], label: 'traffic light' },
    {
      boxes: [
        { h: 30, w: 30, x: 190, y: 310 },
        { h: 50, w: 60, x: 300, y: 320 }
      ],
      label: 'car'
    }
  ]
}

export const addBoundingBoxes = (
  fixture: PlotsComparisonData
): PlotsComparisonData => {
  return {
    ...fixture,
    plots: fixture.plots.map(plot => {
      const isBoundingBoxImg = plot.path.includes('bounding_boxes.png')

      if (!isBoundingBoxImg) {
        return plot
      }

      const plotWithBoundingBoxes: {
        path: string
        classDetails: ComparisonClassDetails
        revisions: ComparisonRevisionData
      } = {
        classDetails: boundingBoxImgClasses,
        path: plot.path,
        revisions: {}
      }

      for (const [rev, imgPlot] of Object.entries(plot.revisions)) {
        plotWithBoundingBoxes.revisions[rev] = {
          ...imgPlot,
          imgs: imgPlot.imgs.map(img => ({
            ...img,
            classes: boundingBoxImgCoords[rev]
          }))
        }
      }

      return plotWithBoundingBoxes
    })
  }
}
