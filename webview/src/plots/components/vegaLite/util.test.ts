import type { TopLevelSpec } from 'vega-lite'
import {
  AnchorDefinitions,
  PLOT_ANCHORS,
  PLOT_REV_FIELD,
  ZOOM_AND_PAN_PROP
} from 'dvc/src/cli/dvc/contract'
import barHorizontalTemplate from 'dvc/src/test/fixtures/plotsDiff/templates/barHorizontal'
import confusionTemplate from 'dvc/src//test/fixtures/plotsDiff/templates/confusion'
import scatterTemplate from 'dvc/src/test/fixtures/plotsDiff/templates/scatter'
import smoothTemplate from 'dvc/src/test/fixtures/plotsDiff/templates/smooth'

import { fillTemplate } from './util'

describe('fillTemplate', () => {
  const PLOT_GROUP_BY_ANCHOR = '<DVC_METRIC_GROUP_BY>'
  const PLOT_GROUP_BY_X_ANCHOR = '<DVC_METRIC_GROUP_BY_X>'
  const PLOT_GROUP_BY_Y_ANCHOR = '<DVC_METRIC_GROUP_BY_Y>'
  const PLOT_PIVOT_FIELD_ANCHOR = '<DVC_METRIC_PIVOT_FIELD>'
  const PLOT_ROW_ANCHOR = '<DVC_METRIC_ROW>'
  const PLOT_TOOLTIP_ANCHOR = '<DVC_METRIC_TOOLTIP>'

  const X = 'x'
  const Y = 'y'

  const MULTI_VIEW_HEIGHT = 300
  const MULTI_VIEW_WIDTH = 300

  const expectedAnchorDefinitions = {
    [PLOT_ANCHORS.COLOR]: {
      field: 'rev',
      legend: null,
      scale: {
        domain: ['other-envy', 'fixed-cons'],
        range: ['#945dd6', '#13adc7']
      }
    },
    [PLOT_ANCHORS.COLUMN]: {},
    [PLOT_ANCHORS.DATA]: [],
    [PLOT_GROUP_BY_ANCHOR]: [PLOT_REV_FIELD],
    [PLOT_GROUP_BY_X_ANCHOR]: [PLOT_REV_FIELD, X],
    [PLOT_GROUP_BY_Y_ANCHOR]: [PLOT_REV_FIELD, Y],
    [PLOT_ANCHORS.HEIGHT]: 'container',
    [PLOT_PIVOT_FIELD_ANCHOR]: 'datum.rev',
    [PLOT_ROW_ANCHOR]: {},
    [PLOT_ANCHORS.SHAPE]: {},
    [PLOT_ANCHORS.STROKE_DASH]: {},
    [PLOT_ANCHORS.TITLE]: 'PLERT',
    [PLOT_TOOLTIP_ANCHOR]: [{ field: 'x' }, { field: 'y' }, { field: 'rev' }],
    [PLOT_ANCHORS.WIDTH]: 'container',
    [PLOT_ANCHORS.X]: X,
    [PLOT_ANCHORS.X_LABEL]: X,
    [PLOT_ANCHORS.Y]: Y,
    [PLOT_ANCHORS.Y_LABEL]: 'vertical y',
    [PLOT_ANCHORS.ZOOM_AND_PAN]: ZOOM_AND_PAN_PROP
  }

  const anchorDefinitions = expectedAnchorDefinitions as AnchorDefinitions

  it('can replace all the anchors for the linear/smooth template', () => {
    const content = smoothTemplate
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      100,
      100,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_ANCHORS.DATA] },
      encoding: {
        color: expectedAnchorDefinitions[PLOT_ANCHORS.COLOR],
        strokeDash: { legend: null },
        x: {
          field: expectedAnchorDefinitions[PLOT_ANCHORS.X],
          title: expectedAnchorDefinitions[PLOT_ANCHORS.X_LABEL],
          type: 'quantitative'
        }
      },
      height: expectedAnchorDefinitions[PLOT_ANCHORS.HEIGHT],
      layer: [
        {
          encoding: {
            color: {
              field: 'rev',
              type: 'nominal'
            },
            y: {
              field: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
              scale: {
                zero: false
              },
              title: expectedAnchorDefinitions[PLOT_ANCHORS.Y_LABEL],
              type: 'quantitative'
            }
          },
          layer: [
            {
              mark: 'line',
              params: [{}]
            },
            {
              mark: 'point',
              transform: [
                {
                  filter: {
                    empty: false,
                    param: 'hover'
                  }
                }
              ]
            }
          ],
          transform: [
            {
              bandwidth: {
                signal: 'smooth'
              },
              groupby: expectedAnchorDefinitions[PLOT_GROUP_BY_ANCHOR],
              loess: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
              on: expectedAnchorDefinitions[PLOT_ANCHORS.X]
            }
          ]
        },
        {
          encoding: {
            color: {
              field: 'rev',
              type: 'nominal'
            },
            x: {
              field: expectedAnchorDefinitions[PLOT_ANCHORS.X],
              title: expectedAnchorDefinitions[PLOT_ANCHORS.X_LABEL],
              type: 'quantitative'
            },
            y: {
              field: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
              scale: { zero: false },
              title: expectedAnchorDefinitions[PLOT_ANCHORS.Y_LABEL],
              type: 'quantitative'
            }
          },
          mark: {
            opacity: 0.2,
            type: 'line'
          }
        },
        {
          encoding: {
            color: {
              field: 'rev',
              type: 'nominal'
            },
            x: {
              aggregate: 'max',
              field: expectedAnchorDefinitions[PLOT_ANCHORS.X],
              title: expectedAnchorDefinitions[PLOT_ANCHORS.X_LABEL],
              type: 'quantitative'
            },
            y: {
              aggregate: {
                argmax: expectedAnchorDefinitions[PLOT_ANCHORS.X]
              },
              field: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
              scale: {
                zero: false
              },
              title: expectedAnchorDefinitions[PLOT_ANCHORS.Y_LABEL],
              type: 'quantitative'
            }
          },
          mark: {
            size: 10,
            type: 'circle'
          }
        },
        {
          encoding: {
            opacity: {
              condition: {
                empty: false,
                param: 'hover',
                value: 0.3
              },
              value: 0
            }
          },
          mark: {
            stroke: 'grey',
            tooltip: {
              content: 'data'
            },
            type: 'rule'
          },
          params: [
            {
              name: 'hover',
              select: {
                clear: 'mouseout',
                fields: [expectedAnchorDefinitions[PLOT_ANCHORS.X]],
                nearest: true,
                on: 'mouseover',
                type: 'point'
              }
            }
          ],
          transform: [
            {
              as: 'pivot_field',
              calculate: expectedAnchorDefinitions[PLOT_PIVOT_FIELD_ANCHOR]
            },
            {
              groupby: [expectedAnchorDefinitions[PLOT_ANCHORS.X]],
              pivot: 'pivot_field',
              value: expectedAnchorDefinitions[PLOT_ANCHORS.Y]
            }
          ]
        }
      ],
      params: [
        {
          bind: {
            input: 'range',
            max: 1,
            min: 0.001,
            step: 0.001
          },
          name: 'smooth',
          value: 0.001
        }
      ],
      title: expectedAnchorDefinitions[PLOT_ANCHORS.TITLE],
      width: expectedAnchorDefinitions[PLOT_ANCHORS.WIDTH]
    })
  })

  it('can replace all the anchors for the scatter template', () => {
    const content = scatterTemplate as unknown as TopLevelSpec
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      100,
      20,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_ANCHORS.DATA] },
      encoding: {
        color: expectedAnchorDefinitions[PLOT_ANCHORS.COLOR],
        shape: { legend: null },
        tooltip: expectedAnchorDefinitions[PLOT_TOOLTIP_ANCHOR],
        x: {
          field: expectedAnchorDefinitions[PLOT_ANCHORS.X],
          title: expectedAnchorDefinitions[PLOT_ANCHORS.X_LABEL],
          type: 'quantitative'
        },
        y: {
          field: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
          title: '…y',
          type: 'quantitative'
        }
      },
      height: expectedAnchorDefinitions[PLOT_ANCHORS.HEIGHT],
      mark: {
        tooltip: {
          content: 'data'
        },
        type: 'point'
      },
      params: [{}],
      title: expectedAnchorDefinitions[PLOT_ANCHORS.TITLE],
      width: expectedAnchorDefinitions[PLOT_ANCHORS.WIDTH]
    })
  })

  it('can replace all the anchors for the confusion template', () => {
    const content = confusionTemplate as unknown as TopLevelSpec
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      100,
      100,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_ANCHORS.DATA] },
      facet: {
        column: { field: 'rev', sort: [] },
        row: expectedAnchorDefinitions[PLOT_ROW_ANCHOR]
      },
      params: [
        {
          bind: { input: 'checkbox' },
          name: 'showValues'
        }
      ],
      spec: {
        encoding: {
          x: {
            field: expectedAnchorDefinitions[PLOT_ANCHORS.X],
            sort: 'ascending',
            title: expectedAnchorDefinitions[PLOT_ANCHORS.X_LABEL],
            type: 'nominal'
          },
          y: {
            field: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
            sort: 'ascending',
            title: expectedAnchorDefinitions[PLOT_ANCHORS.Y_LABEL],
            type: 'nominal'
          }
        },
        layer: [
          {
            encoding: {
              color: {
                field: 'xy_count',
                scale: { domainMin: 0, nice: true },
                title: '',
                type: 'quantitative'
              }
            },
            height: MULTI_VIEW_HEIGHT,
            mark: 'rect',
            width: MULTI_VIEW_WIDTH
          },
          {
            encoding: {
              opacity: {
                condition: { selection: 'label', value: 1 },
                value: 0
              },
              tooltip: [
                {
                  field: expectedAnchorDefinitions[PLOT_ANCHORS.X],
                  type: 'nominal'
                },
                {
                  field: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
                  type: 'nominal'
                },
                { field: 'xy_count', type: 'quantitative' }
              ]
            },
            mark: 'rect',
            selection: {
              label: {
                clear: 'mouseout',
                empty: 'none',
                encodings: ['x', 'y'],
                on: 'mouseover',
                type: 'single'
              }
            }
          },
          {
            layer: [{ mark: { color: 'lightpink', type: 'rect' } }],
            transform: [{ filter: { selection: 'label' } }]
          },
          {
            encoding: {
              color: {
                condition: {
                  test: 'datum.percent_of_max > 0.5',
                  value: 'white'
                },
                value: 'black'
              },
              text: {
                condition: {
                  field: 'xy_count',
                  param: 'showValues',
                  type: 'quantitative'
                }
              }
            },
            mark: 'text'
          }
        ],
        transform: [
          {
            aggregate: [{ as: 'xy_count', op: 'count' }],
            groupby: [
              expectedAnchorDefinitions[PLOT_ANCHORS.Y],
              expectedAnchorDefinitions[PLOT_ANCHORS.X]
            ]
          },
          {
            groupby: expectedAnchorDefinitions[PLOT_GROUP_BY_Y_ANCHOR],
            impute: 'xy_count',
            key: expectedAnchorDefinitions[PLOT_ANCHORS.X],
            value: 0
          },
          {
            groupby: expectedAnchorDefinitions[PLOT_GROUP_BY_X_ANCHOR],
            impute: 'xy_count',
            key: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
            value: 0
          },
          {
            groupby: [],
            joinaggregate: [{ as: 'max_count', field: 'xy_count', op: 'max' }]
          },
          {
            as: 'percent_of_max',
            calculate: 'datum.xy_count / datum.max_count'
          }
        ]
      },
      title: expectedAnchorDefinitions[PLOT_ANCHORS.TITLE]
    })
  })

  it('can replace all the anchors for the bar template', () => {
    const content = barHorizontalTemplate as unknown as TopLevelSpec
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      100,
      100,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_ANCHORS.DATA] },
      encoding: {
        color: expectedAnchorDefinitions[PLOT_ANCHORS.COLOR],
        column: expectedAnchorDefinitions[PLOT_ANCHORS.COLUMN],
        x: {
          field: expectedAnchorDefinitions[PLOT_ANCHORS.X],
          scale: { zero: false },
          title: expectedAnchorDefinitions[PLOT_ANCHORS.X_LABEL],
          type: 'quantitative'
        },
        y: {
          field: expectedAnchorDefinitions[PLOT_ANCHORS.Y],
          title: expectedAnchorDefinitions[PLOT_ANCHORS.Y_LABEL],
          type: 'nominal'
        },
        yOffset: { field: 'rev', sort: [] }
      },
      height: expectedAnchorDefinitions[PLOT_ANCHORS.HEIGHT],
      mark: { type: 'bar' },
      params: [{}],
      title: expectedAnchorDefinitions[PLOT_ANCHORS.TITLE],
      width: expectedAnchorDefinitions[PLOT_ANCHORS.WIDTH]
    })
  })
})
