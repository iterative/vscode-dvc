import type { TopLevelSpec } from 'vega-lite'
import {
  AnchorDefinitions,
  PLOT_COLOR_ANCHOR,
  PLOT_COLUMN_ANCHOR,
  PLOT_DATA_ANCHOR,
  PLOT_HEIGHT_ANCHOR,
  PLOT_REV_FIELD,
  PLOT_SHAPE_ANCHOR,
  PLOT_STROKE_DASH_ANCHOR,
  PLOT_TITLE_ANCHOR,
  PLOT_WIDTH_ANCHOR,
  PLOT_X_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_ANCHOR,
  PLOT_Y_LABEL_ANCHOR,
  PLOT_ZOOM_AND_PAN_ANCHOR,
  ZOOM_AND_PAN_PROP
} from 'dvc/src/cli/dvc/contract'
import barHorizontalTemplate from 'dvc/src/test/fixtures/plotsDiff/templates/barHorizontal'
import confusionTemplate from 'dvc/src//test/fixtures/plotsDiff/templates/confusion'
import scatterTemplate from 'dvc/src/test/fixtures/plotsDiff/templates/scatter'
import smoothTemplate from 'dvc/src/test/fixtures/plotsDiff/templates/smooth'

import { DEFAULT_NB_ITEMS_PER_ROW } from 'dvc/src/plots/webview/contract'
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
    [PLOT_COLOR_ANCHOR]: {
      field: 'rev',
      legend: null,
      scale: {
        domain: ['other-envy', 'fixed-cons'],
        range: ['#945dd6', '#13adc7']
      }
    },
    [PLOT_COLUMN_ANCHOR]: {},
    [PLOT_DATA_ANCHOR]: [],
    [PLOT_GROUP_BY_ANCHOR]: [PLOT_REV_FIELD],
    [PLOT_GROUP_BY_X_ANCHOR]: [PLOT_REV_FIELD, X],
    [PLOT_GROUP_BY_Y_ANCHOR]: [PLOT_REV_FIELD, Y],
    [PLOT_HEIGHT_ANCHOR]: 'container',
    [PLOT_PIVOT_FIELD_ANCHOR]: 'datum.rev',
    [PLOT_ROW_ANCHOR]: {},
    [PLOT_SHAPE_ANCHOR]: {},
    [PLOT_STROKE_DASH_ANCHOR]: {},
    [PLOT_TITLE_ANCHOR]: 'PLERT',
    [PLOT_TOOLTIP_ANCHOR]: [{ field: 'x' }, { field: 'y' }, { field: 'rev' }],
    [PLOT_WIDTH_ANCHOR]: 'container',
    [PLOT_X_ANCHOR]: X,
    [PLOT_X_LABEL_ANCHOR]: X,
    [PLOT_Y_ANCHOR]: Y,
    [PLOT_Y_LABEL_ANCHOR]: Y,
    [PLOT_ZOOM_AND_PAN_ANCHOR]: ZOOM_AND_PAN_PROP
  }

  const anchorDefinitions = expectedAnchorDefinitions as AnchorDefinitions

  it('can replace all the anchors for the linear/smooth template', () => {
    const content = smoothTemplate
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      DEFAULT_NB_ITEMS_PER_ROW,
      1,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_DATA_ANCHOR] },
      encoding: {
        color: expectedAnchorDefinitions[PLOT_COLOR_ANCHOR],
        strokeDash: { legend: null },
        x: {
          field: expectedAnchorDefinitions[PLOT_X_ANCHOR],
          title: expectedAnchorDefinitions[PLOT_X_LABEL_ANCHOR],
          type: 'quantitative'
        }
      },
      height: expectedAnchorDefinitions[PLOT_HEIGHT_ANCHOR],
      layer: [
        {
          encoding: {
            color: {
              field: 'rev',
              type: 'nominal'
            },
            y: {
              field: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
              scale: {
                zero: false
              },
              title: expectedAnchorDefinitions[PLOT_Y_LABEL_ANCHOR],
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
              loess: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
              on: expectedAnchorDefinitions[PLOT_X_ANCHOR]
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
              field: expectedAnchorDefinitions[PLOT_X_ANCHOR],
              title: expectedAnchorDefinitions[PLOT_X_LABEL_ANCHOR],
              type: 'quantitative'
            },
            y: {
              field: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
              scale: { zero: false },
              title: expectedAnchorDefinitions[PLOT_Y_LABEL_ANCHOR],
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
              field: expectedAnchorDefinitions[PLOT_X_ANCHOR],
              title: expectedAnchorDefinitions[PLOT_X_LABEL_ANCHOR],
              type: 'quantitative'
            },
            y: {
              aggregate: {
                argmax: expectedAnchorDefinitions[PLOT_X_ANCHOR]
              },
              field: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
              scale: {
                zero: false
              },
              title: expectedAnchorDefinitions[PLOT_Y_LABEL_ANCHOR],
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
                fields: [expectedAnchorDefinitions[PLOT_X_ANCHOR]],
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
              groupby: [expectedAnchorDefinitions[PLOT_X_ANCHOR]],
              pivot: 'pivot_field',
              value: expectedAnchorDefinitions[PLOT_Y_ANCHOR]
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
      title: expectedAnchorDefinitions[PLOT_TITLE_ANCHOR],
      width: expectedAnchorDefinitions[PLOT_WIDTH_ANCHOR]
    })
  })

  it('can replace all the anchors for the scatter template', () => {
    const content = scatterTemplate as unknown as TopLevelSpec
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      DEFAULT_NB_ITEMS_PER_ROW,
      2,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_DATA_ANCHOR] },
      encoding: {
        color: expectedAnchorDefinitions[PLOT_COLOR_ANCHOR],
        shape: { legend: null },
        tooltip: expectedAnchorDefinitions[PLOT_TOOLTIP_ANCHOR],
        x: {
          field: expectedAnchorDefinitions[PLOT_X_ANCHOR],
          title: expectedAnchorDefinitions[PLOT_X_LABEL_ANCHOR],
          type: 'quantitative'
        },
        y: {
          field: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
          title: expectedAnchorDefinitions[PLOT_Y_LABEL_ANCHOR],
          type: 'quantitative'
        }
      },
      height: expectedAnchorDefinitions[PLOT_HEIGHT_ANCHOR],
      mark: {
        tooltip: {
          content: 'data'
        },
        type: 'point'
      },
      params: [{}],
      title: expectedAnchorDefinitions[PLOT_TITLE_ANCHOR],
      width: expectedAnchorDefinitions[PLOT_WIDTH_ANCHOR]
    })
  })

  it('can replace all the anchors for the confusion template', () => {
    const content = confusionTemplate as unknown as TopLevelSpec
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      DEFAULT_NB_ITEMS_PER_ROW,
      1,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_DATA_ANCHOR] },
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
            field: expectedAnchorDefinitions[PLOT_X_ANCHOR],
            sort: 'ascending',
            title: expectedAnchorDefinitions[PLOT_X_LABEL_ANCHOR],
            type: 'nominal'
          },
          y: {
            field: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
            sort: 'ascending',
            title: expectedAnchorDefinitions[PLOT_Y_LABEL_ANCHOR],
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
                  field: expectedAnchorDefinitions[PLOT_X_ANCHOR],
                  type: 'nominal'
                },
                {
                  field: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
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
              expectedAnchorDefinitions[PLOT_Y_ANCHOR],
              expectedAnchorDefinitions[PLOT_X_ANCHOR]
            ]
          },
          {
            groupby: expectedAnchorDefinitions[PLOT_GROUP_BY_Y_ANCHOR],
            impute: 'xy_count',
            key: expectedAnchorDefinitions[PLOT_X_ANCHOR],
            value: 0
          },
          {
            groupby: expectedAnchorDefinitions[PLOT_GROUP_BY_X_ANCHOR],
            impute: 'xy_count',
            key: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
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
      title: expectedAnchorDefinitions[PLOT_TITLE_ANCHOR]
    })
  })

  it('can replace all the anchors for the bar template', () => {
    const content = barHorizontalTemplate as unknown as TopLevelSpec
    const filledTemplate = fillTemplate(
      { anchorDefinitions, content },
      DEFAULT_NB_ITEMS_PER_ROW,
      1,
      false
    )

    expect(filledTemplate).toStrictEqual({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: expectedAnchorDefinitions[PLOT_DATA_ANCHOR] },
      encoding: {
        color: expectedAnchorDefinitions[PLOT_COLOR_ANCHOR],
        column: expectedAnchorDefinitions[PLOT_COLUMN_ANCHOR],
        x: {
          field: expectedAnchorDefinitions[PLOT_X_ANCHOR],
          scale: { zero: false },
          title: expectedAnchorDefinitions[PLOT_X_LABEL_ANCHOR],
          type: 'quantitative'
        },
        y: {
          field: expectedAnchorDefinitions[PLOT_Y_ANCHOR],
          title: expectedAnchorDefinitions[PLOT_Y_LABEL_ANCHOR],
          type: 'nominal'
        },
        yOffset: { field: 'rev', sort: [] }
      },
      height: expectedAnchorDefinitions[PLOT_HEIGHT_ANCHOR],
      mark: { type: 'bar' },
      params: [{}],
      title: expectedAnchorDefinitions[PLOT_TITLE_ANCHOR],
      width: expectedAnchorDefinitions[PLOT_WIDTH_ANCHOR]
    })
  })
})
