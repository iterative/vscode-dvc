import { buildColumns } from './build-columns'

describe('buildColumns', () => {
  it('parses minimal exp show data artificially stuffed with corner cases', () => {
    expect(
      buildColumns({
        '8ff3baa3be877b406cd52517567f292334736453': {
          '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092': {
            checkpoint_parent: '4990dd057c58b2a5aaa9bb67ebf7f01b456ef328',
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            metrics: {
              'logs.json': { acc: 0.7703, loss: 1.0390191078186035, step: 5 }
            },
            name: 'exp-0abff',
            params: {
              'params.yaml': { mixedparam: 3 }
            },
            queued: false,
            timestamp: '2021-05-27T18:41:37'
          },
          baseline: {
            metrics: {
              'logs.json': { acc: 0.752, loss: 1.1647908687591553, step: 9 }
            },
            name: 'parse-experiments-in-extension',
            params: {
              'params.yaml': { mixedparam: 'string' }
            },
            queued: false,
            timestamp: '2021-05-27T17:57:43'
          }
        },
        workspace: {
          baseline: {
            metrics: {
              'logs.json': { boolparam: true, nullparam: null }
            },
            params: {
              'params.yaml': {
                boolparam: false,
                mixedparam: 1.2,
                stringparam: 'string',
                undefparam: undefined
              }
            },
            queued: false,
            timestamp: null
          }
        }
      })
    ).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "childColumns": Array [
              Object {
                "ancestors": Array [
                  "params",
                ],
                "childColumns": Array [
                  Object {
                    "ancestors": Array [
                      "params",
                      "params.yaml",
                    ],
                    "maxStringLength": 6,
                    "name": "mixedparam",
                    "types": Array [
                      "number",
                      "string",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "params",
                      "params.yaml",
                    ],
                    "maxStringLength": 5,
                    "name": "boolparam",
                    "types": Array [
                      "boolean",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "params",
                      "params.yaml",
                    ],
                    "maxStringLength": 6,
                    "name": "stringparam",
                    "types": Array [
                      "string",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "params",
                      "params.yaml",
                    ],
                    "maxStringLength": 9,
                    "name": "undefparam",
                    "types": Array [
                      "undefined",
                    ],
                  },
                ],
                "name": "params.yaml",
              },
            ],
            "name": "params",
          },
          Object {
            "childColumns": Array [
              Object {
                "ancestors": Array [
                  "metrics",
                ],
                "childColumns": Array [
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 6,
                    "name": "acc",
                    "types": Array [
                      "number",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 18,
                    "name": "loss",
                    "types": Array [
                      "number",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 1,
                    "name": "step",
                    "types": Array [
                      "number",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 4,
                    "name": "boolparam",
                    "types": Array [
                      "boolean",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 4,
                    "name": "nullparam",
                    "types": Array [
                      "null",
                    ],
                  },
                ],
                "name": "logs.json",
              },
            ],
            "name": "metrics",
          },
        ],
        Array [
          Object {
            "ancestors": Array [
              "params",
              "params.yaml",
            ],
            "maxStringLength": 6,
            "name": "mixedparam",
            "types": Array [
              "number",
              "string",
            ],
          },
          Object {
            "ancestors": Array [
              "params",
              "params.yaml",
            ],
            "maxStringLength": 5,
            "name": "boolparam",
            "types": Array [
              "boolean",
            ],
          },
          Object {
            "ancestors": Array [
              "params",
              "params.yaml",
            ],
            "maxStringLength": 6,
            "name": "stringparam",
            "types": Array [
              "string",
            ],
          },
          Object {
            "ancestors": Array [
              "params",
              "params.yaml",
            ],
            "maxStringLength": 9,
            "name": "undefparam",
            "types": Array [
              "undefined",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 6,
            "name": "acc",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 18,
            "name": "loss",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 1,
            "name": "step",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 4,
            "name": "boolparam",
            "types": Array [
              "boolean",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 4,
            "name": "nullparam",
            "types": Array [
              "null",
            ],
          },
        ],
      ]
    `)
  })
  it('parses real exp show data', () => {
    expect(
      buildColumns({
        '8ff3baa3be877b406cd52517567f292334736453': {
          '10749b0a04f3ea0f176b90e3c1f07456d5cde0a6': {
            checkpoint_parent: '6daa0e8b982234e1d32af6069d94afc0164ce722',
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            metrics: {
              'logs.json': { acc: 0.7505, loss: 1.0997670888900757, step: 2 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:38:48'
          },
          '1be19d33df28412a0f9dc69cb9015c062abf3b1c': {
            checkpoint_parent: '50c628f8577f75c336b4ee7edebd5df88f2ffce4',
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            metrics: {
              'logs.json': { acc: 0.7598, loss: 1.119758129119873, step: 1 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:24:23'
          },
          '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092': {
            checkpoint_parent: '4990dd057c58b2a5aaa9bb67ebf7f01b456ef328',
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            metrics: {
              'logs.json': { acc: 0.7703, loss: 1.0390191078186035, step: 5 }
            },
            name: 'exp-0abff',
            params: {
              'params.yaml': { lr: 0.0005, seed: 473989, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:41:37'
          },
          '4990dd057c58b2a5aaa9bb67ebf7f01b456ef328': {
            checkpoint_parent: 'f7491cb104b450c918058fd67463f9492d8a1e63',
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            metrics: {
              'logs.json': { acc: 0.7703, loss: 1.0390191078186035, step: 5 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473989, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:41:36'
          },
          '50c628f8577f75c336b4ee7edebd5df88f2ffce4': {
            checkpoint_parent: '8ff3baa3be877b406cd52517567f292334736453',
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            metrics: {
              'logs.json': { acc: 0.7488, loss: 1.1422556638717651, step: 0 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:24:18'
          },
          '6daa0e8b982234e1d32af6069d94afc0164ce722': {
            checkpoint_parent: '1be19d33df28412a0f9dc69cb9015c062abf3b1c',
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            metrics: {
              'logs.json': { acc: 0.7598, loss: 1.119758129119873, step: 1 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:24:24'
          },
          a5da5a81004000888ad165925c1335ebd5d0784a: {
            checkpoint_parent: 'ea4b4ef19109bb516d30c0cbc89c74cb92ad2fc9',
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            metrics: {
              'logs.json': { acc: 0.7647, loss: 1.0780978202819824, step: 3 }
            },
            name: 'exp-2d437',
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:38:53'
          },
          baseline: {
            metrics: {
              'logs.json': { acc: 0.752, loss: 1.1647908687591553, step: 9 }
            },
            name: 'parse-experiments-in-extension',
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T17:57:43'
          },
          ea4b4ef19109bb516d30c0cbc89c74cb92ad2fc9: {
            checkpoint_parent: '10749b0a04f3ea0f176b90e3c1f07456d5cde0a6',
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            metrics: {
              'logs.json': { acc: 0.7647, loss: 1.0780978202819824, step: 3 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:38:53'
          },
          f7491cb104b450c918058fd67463f9492d8a1e63: {
            checkpoint_parent: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            metrics: {
              'logs.json': { acc: 0.754, loss: 1.0600882768630981, step: 4 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473989, weight_decay: 0 }
            },
            queued: false,
            timestamp: '2021-05-27T18:41:31'
          }
        },
        workspace: {
          baseline: {
            metrics: {
              'logs.json': { acc: 0.752, loss: 1.1647908687591553, step: 9 }
            },
            params: {
              'params.yaml': { lr: 0.0005, seed: 473987, weight_decay: 0 }
            },
            queued: false,
            timestamp: null
          }
        }
      })
    ).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "childColumns": Array [
              Object {
                "ancestors": Array [
                  "params",
                ],
                "childColumns": Array [
                  Object {
                    "ancestors": Array [
                      "params",
                      "params.yaml",
                    ],
                    "maxStringLength": 6,
                    "name": "lr",
                    "types": Array [
                      "number",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "params",
                      "params.yaml",
                    ],
                    "maxStringLength": 6,
                    "name": "seed",
                    "types": Array [
                      "number",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "params",
                      "params.yaml",
                    ],
                    "maxStringLength": 1,
                    "name": "weight_decay",
                    "types": Array [
                      "number",
                    ],
                  },
                ],
                "name": "params.yaml",
              },
            ],
            "name": "params",
          },
          Object {
            "childColumns": Array [
              Object {
                "ancestors": Array [
                  "metrics",
                ],
                "childColumns": Array [
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 6,
                    "name": "acc",
                    "types": Array [
                      "number",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 18,
                    "name": "loss",
                    "types": Array [
                      "number",
                    ],
                  },
                  Object {
                    "ancestors": Array [
                      "metrics",
                      "logs.json",
                    ],
                    "maxStringLength": 1,
                    "name": "step",
                    "types": Array [
                      "number",
                    ],
                  },
                ],
                "name": "logs.json",
              },
            ],
            "name": "metrics",
          },
        ],
        Array [
          Object {
            "ancestors": Array [
              "params",
              "params.yaml",
            ],
            "maxStringLength": 6,
            "name": "lr",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "params",
              "params.yaml",
            ],
            "maxStringLength": 6,
            "name": "seed",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "params",
              "params.yaml",
            ],
            "maxStringLength": 1,
            "name": "weight_decay",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 6,
            "name": "acc",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 18,
            "name": "loss",
            "types": Array [
              "number",
            ],
          },
          Object {
            "ancestors": Array [
              "metrics",
              "logs.json",
            ],
            "maxStringLength": 1,
            "name": "step",
            "types": Array [
              "number",
            ],
          },
        ],
      ]
    `)
  })
})
