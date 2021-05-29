import { buildColumns } from './build-columns'

describe('buildColumns', () => {
  it('parses minimal exp show data artificially stuffed with corner cases', () => {
    expect(
      buildColumns({
        workspace: {
          baseline: {
            timestamp: null,
            params: {
              'params.yaml': {
                boolparam: false,
                stringparam: 'string',
                undefparam: undefined,
                mixedparam: 1.2
              }
            },
            queued: false,
            metrics: {
              'logs.json': { boolparam: true, nullparam: null }
            }
          }
        },
        '8ff3baa3be877b406cd52517567f292334736453': {
          baseline: {
            timestamp: '2021-05-27T17:57:43',
            params: {
              'params.yaml': { mixedparam: 'string' }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 9, loss: 1.1647908687591553, acc: 0.752 }
            },
            name: 'parse-experiments-in-extension'
          },
          '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092': {
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            timestamp: '2021-05-27T18:41:37',
            params: {
              'params.yaml': { mixedparam: 3 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 5, loss: 1.0390191078186035, acc: 0.7703 }
            },
            name: 'exp-0abff',
            checkpoint_parent: '4990dd057c58b2a5aaa9bb67ebf7f01b456ef328'
          }
        }
      })
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "childColumns": Array [
            Object {
              "childColumns": Array [
                Object {
                  "maxStringLength": 5,
                  "name": "boolparam",
                  "types": Array [
                    "boolean",
                  ],
                },
                Object {
                  "maxStringLength": 6,
                  "name": "stringparam",
                  "types": Array [
                    "string",
                  ],
                },
                Object {
                  "maxStringLength": 9,
                  "name": "undefparam",
                  "types": Array [
                    "undefined",
                  ],
                },
                Object {
                  "maxStringLength": 6,
                  "name": "mixedparam",
                  "types": Array [
                    "number",
                    "string",
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
              "childColumns": Array [
                Object {
                  "maxStringLength": 4,
                  "name": "boolparam",
                  "types": Array [
                    "boolean",
                  ],
                },
                Object {
                  "maxStringLength": 4,
                  "name": "nullparam",
                  "types": Array [
                    "null",
                  ],
                },
                Object {
                  "maxStringLength": 1,
                  "name": "step",
                  "types": Array [
                    "number",
                  ],
                },
                Object {
                  "maxStringLength": 18,
                  "name": "loss",
                  "types": Array [
                    "number",
                  ],
                },
                Object {
                  "maxStringLength": 6,
                  "name": "acc",
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
      ]
    `)
  })
  it('parses real exp show data', () => {
    expect(
      buildColumns({
        workspace: {
          baseline: {
            timestamp: null,
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 9, loss: 1.1647908687591553, acc: 0.752 }
            }
          }
        },
        '8ff3baa3be877b406cd52517567f292334736453': {
          baseline: {
            timestamp: '2021-05-27T17:57:43',
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 9, loss: 1.1647908687591553, acc: 0.752 }
            },
            name: 'parse-experiments-in-extension'
          },
          '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092': {
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            timestamp: '2021-05-27T18:41:37',
            params: {
              'params.yaml': { seed: 473989, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 5, loss: 1.0390191078186035, acc: 0.7703 }
            },
            name: 'exp-0abff',
            checkpoint_parent: '4990dd057c58b2a5aaa9bb67ebf7f01b456ef328'
          },
          '4990dd057c58b2a5aaa9bb67ebf7f01b456ef328': {
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            timestamp: '2021-05-27T18:41:36',
            params: {
              'params.yaml': { seed: 473989, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 5, loss: 1.0390191078186035, acc: 0.7703 }
            },
            checkpoint_parent: 'f7491cb104b450c918058fd67463f9492d8a1e63'
          },
          f7491cb104b450c918058fd67463f9492d8a1e63: {
            checkpoint_tip: '2ebc5eeb887c28adfdd019fa2112bc2a3b37e092',
            timestamp: '2021-05-27T18:41:31',
            params: {
              'params.yaml': { seed: 473989, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 4, loss: 1.0600882768630981, acc: 0.754 }
            },
            checkpoint_parent: 'a5da5a81004000888ad165925c1335ebd5d0784a'
          },
          a5da5a81004000888ad165925c1335ebd5d0784a: {
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            timestamp: '2021-05-27T18:38:53',
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 3, loss: 1.0780978202819824, acc: 0.7647 }
            },
            name: 'exp-2d437',
            checkpoint_parent: 'ea4b4ef19109bb516d30c0cbc89c74cb92ad2fc9'
          },
          ea4b4ef19109bb516d30c0cbc89c74cb92ad2fc9: {
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            timestamp: '2021-05-27T18:38:53',
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 3, loss: 1.0780978202819824, acc: 0.7647 }
            },
            checkpoint_parent: '10749b0a04f3ea0f176b90e3c1f07456d5cde0a6'
          },
          '10749b0a04f3ea0f176b90e3c1f07456d5cde0a6': {
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            timestamp: '2021-05-27T18:38:48',
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 2, loss: 1.0997670888900757, acc: 0.7505 }
            },
            checkpoint_parent: '6daa0e8b982234e1d32af6069d94afc0164ce722'
          },
          '6daa0e8b982234e1d32af6069d94afc0164ce722': {
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            timestamp: '2021-05-27T18:24:24',
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 1, loss: 1.119758129119873, acc: 0.7598 }
            },
            checkpoint_parent: '1be19d33df28412a0f9dc69cb9015c062abf3b1c'
          },
          '1be19d33df28412a0f9dc69cb9015c062abf3b1c': {
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            timestamp: '2021-05-27T18:24:23',
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 1, loss: 1.119758129119873, acc: 0.7598 }
            },
            checkpoint_parent: '50c628f8577f75c336b4ee7edebd5df88f2ffce4'
          },
          '50c628f8577f75c336b4ee7edebd5df88f2ffce4': {
            checkpoint_tip: 'a5da5a81004000888ad165925c1335ebd5d0784a',
            timestamp: '2021-05-27T18:24:18',
            params: {
              'params.yaml': { seed: 473987, lr: 0.0005, weight_decay: 0 }
            },
            queued: false,
            metrics: {
              'logs.json': { step: 0, loss: 1.1422556638717651, acc: 0.7488 }
            },
            checkpoint_parent: '8ff3baa3be877b406cd52517567f292334736453'
          }
        }
      })
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "childColumns": Array [
            Object {
              "childColumns": Array [
                Object {
                  "maxStringLength": 6,
                  "name": "seed",
                  "types": Array [
                    "number",
                  ],
                },
                Object {
                  "maxStringLength": 6,
                  "name": "lr",
                  "types": Array [
                    "number",
                  ],
                },
                Object {
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
              "childColumns": Array [
                Object {
                  "maxStringLength": 1,
                  "name": "step",
                  "types": Array [
                    "number",
                  ],
                },
                Object {
                  "maxStringLength": 18,
                  "name": "loss",
                  "types": Array [
                    "number",
                  ],
                },
                Object {
                  "maxStringLength": 6,
                  "name": "acc",
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
      ]
    `)
  })
})
