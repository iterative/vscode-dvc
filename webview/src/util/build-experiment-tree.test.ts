import { nestAndFlattenSubRows } from './build-experiment-tree'

test('Works on a manually defined tree', () => {
  const input = {
    queued: false,
    name: 'master',
    sha: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
    subRows: [
      {
        checkpoint_tip: 'ebb29fc4afc8768e54bef64db01bf9d36e1b93e6',
        queued: false,
        name: 'exp-5a8b8',
        checkpoint_parent: 'c39f37f176f043512536b175f4c3e6a201270b80',
        sha: 'ebb29fc4afc8768e54bef64db01bf9d36e1b93e6'
      },
      {
        checkpoint_tip: 'ebb29fc4afc8768e54bef64db01bf9d36e1b93e6',
        queued: false,
        checkpoint_parent: '195ee4c7673f1e8bdbf1648e510d53fcf98faba2',
        sha: 'c39f37f176f043512536b175f4c3e6a201270b80'
      },
      {
        checkpoint_tip: 'ebb29fc4afc8768e54bef64db01bf9d36e1b93e6',
        queued: false,
        checkpoint_parent: '538075916ab0c12640b142632ccd0bdbbb2d99fd',
        sha: '195ee4c7673f1e8bdbf1648e510d53fcf98faba2'
      },
      {
        checkpoint_tip: 'ebb29fc4afc8768e54bef64db01bf9d36e1b93e6',
        queued: false,
        checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
        sha: '538075916ab0c12640b142632ccd0bdbbb2d99fd'
      },
      {
        checkpoint_tip: '1206f4bc466f23b1042c216e7ecfcadffc20018b',
        queued: false,
        name: 'exp-4fd17',
        checkpoint_parent: 'c65ddb77a5b952ac503bdb397c38097ef464ccb0',
        sha: '1206f4bc466f23b1042c216e7ecfcadffc20018b'
      },
      {
        checkpoint_tip: '1206f4bc466f23b1042c216e7ecfcadffc20018b',
        queued: false,
        checkpoint_parent: '7ea8bf6c46eab35739075286e0fa04acc341a561',
        sha: 'c65ddb77a5b952ac503bdb397c38097ef464ccb0'
      },
      {
        checkpoint_tip: '1206f4bc466f23b1042c216e7ecfcadffc20018b',
        queued: false,
        checkpoint_parent: 'e1b0c4422766a3b53489feaf1dc831ac48cff974',
        sha: '7ea8bf6c46eab35739075286e0fa04acc341a561'
      },
      {
        checkpoint_tip: '1206f4bc466f23b1042c216e7ecfcadffc20018b',
        queued: false,
        checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
        sha: 'e1b0c4422766a3b53489feaf1dc831ac48cff974'
      },
      {
        checkpoint_tip: '30b4676023d84de629d3a0bce3f1814642bd960b',
        queued: false,
        name: 'exp-5e230',
        checkpoint_parent: '9515eba4eded89c906957420e13d10e6015bef5a',
        sha: '30b4676023d84de629d3a0bce3f1814642bd960b'
      },
      {
        checkpoint_tip: '30b4676023d84de629d3a0bce3f1814642bd960b',
        queued: false,
        checkpoint_parent: 'e0e36dbb1308984ae567aca66a3ed2661ec82a92',
        sha: '9515eba4eded89c906957420e13d10e6015bef5a'
      },
      {
        checkpoint_tip: '30b4676023d84de629d3a0bce3f1814642bd960b',
        queued: false,
        checkpoint_parent: '3fdd5ebeb5eb14d767a52c15b94f403f643103d6',
        sha: 'e0e36dbb1308984ae567aca66a3ed2661ec82a92'
      },
      {
        checkpoint_tip: '30b4676023d84de629d3a0bce3f1814642bd960b',
        queued: false,
        checkpoint_parent: '4d08facf98b8121602b2cf3efd0d69f215f70dea',
        sha: '3fdd5ebeb5eb14d767a52c15b94f403f643103d6'
      },
      {
        checkpoint_tip: '30b4676023d84de629d3a0bce3f1814642bd960b',
        queued: false,
        checkpoint_parent: '33224258fdec80828010f09bde20bcd453e3a8a9',
        sha: '4d08facf98b8121602b2cf3efd0d69f215f70dea'
      },
      {
        checkpoint_tip: '30b4676023d84de629d3a0bce3f1814642bd960b',
        queued: false,
        checkpoint_parent: '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77',
        sha: '33224258fdec80828010f09bde20bcd453e3a8a9'
      },
      {
        queued: true,
        sha: '3c800c3a7473db1506179bdf9c5e85b6f145c166'
      },
      {
        queued: true,
        sha: 'b7c9945e6fe1b86006e60fa7f6da65254d8b031a'
      }
    ]
  }

  const flattenedTree = nestAndFlattenSubRows(input)

  expect(flattenedTree).toMatchInlineSnapshot(`
    Array [
      Object {
        "name": "master",
        "queued": false,
        "sha": "53c3851f46955fa3e2b8f6e1c52999acc8c9ea77",
        "subRows": Array [
          Object {
            "checkpoint_parent": "53c3851f46955fa3e2b8f6e1c52999acc8c9ea77",
            "checkpoint_tip": "ebb29fc4afc8768e54bef64db01bf9d36e1b93e6",
            "queued": false,
            "sha": "538075916ab0c12640b142632ccd0bdbbb2d99fd",
            "subRows": Array [
              Object {
                "checkpoint_parent": "c39f37f176f043512536b175f4c3e6a201270b80",
                "checkpoint_tip": "ebb29fc4afc8768e54bef64db01bf9d36e1b93e6",
                "name": "exp-5a8b8",
                "queued": false,
                "sha": "ebb29fc4afc8768e54bef64db01bf9d36e1b93e6",
              },
              Object {
                "checkpoint_parent": "195ee4c7673f1e8bdbf1648e510d53fcf98faba2",
                "checkpoint_tip": "ebb29fc4afc8768e54bef64db01bf9d36e1b93e6",
                "queued": false,
                "sha": "c39f37f176f043512536b175f4c3e6a201270b80",
              },
              Object {
                "checkpoint_parent": "538075916ab0c12640b142632ccd0bdbbb2d99fd",
                "checkpoint_tip": "ebb29fc4afc8768e54bef64db01bf9d36e1b93e6",
                "queued": false,
                "sha": "195ee4c7673f1e8bdbf1648e510d53fcf98faba2",
              },
            ],
          },
          Object {
            "checkpoint_parent": "53c3851f46955fa3e2b8f6e1c52999acc8c9ea77",
            "checkpoint_tip": "1206f4bc466f23b1042c216e7ecfcadffc20018b",
            "queued": false,
            "sha": "e1b0c4422766a3b53489feaf1dc831ac48cff974",
            "subRows": Array [
              Object {
                "checkpoint_parent": "c65ddb77a5b952ac503bdb397c38097ef464ccb0",
                "checkpoint_tip": "1206f4bc466f23b1042c216e7ecfcadffc20018b",
                "name": "exp-4fd17",
                "queued": false,
                "sha": "1206f4bc466f23b1042c216e7ecfcadffc20018b",
              },
              Object {
                "checkpoint_parent": "7ea8bf6c46eab35739075286e0fa04acc341a561",
                "checkpoint_tip": "1206f4bc466f23b1042c216e7ecfcadffc20018b",
                "queued": false,
                "sha": "c65ddb77a5b952ac503bdb397c38097ef464ccb0",
              },
              Object {
                "checkpoint_parent": "e1b0c4422766a3b53489feaf1dc831ac48cff974",
                "checkpoint_tip": "1206f4bc466f23b1042c216e7ecfcadffc20018b",
                "queued": false,
                "sha": "7ea8bf6c46eab35739075286e0fa04acc341a561",
              },
            ],
          },
          Object {
            "checkpoint_parent": "53c3851f46955fa3e2b8f6e1c52999acc8c9ea77",
            "checkpoint_tip": "30b4676023d84de629d3a0bce3f1814642bd960b",
            "queued": false,
            "sha": "33224258fdec80828010f09bde20bcd453e3a8a9",
            "subRows": Array [
              Object {
                "checkpoint_parent": "9515eba4eded89c906957420e13d10e6015bef5a",
                "checkpoint_tip": "30b4676023d84de629d3a0bce3f1814642bd960b",
                "name": "exp-5e230",
                "queued": false,
                "sha": "30b4676023d84de629d3a0bce3f1814642bd960b",
              },
              Object {
                "checkpoint_parent": "e0e36dbb1308984ae567aca66a3ed2661ec82a92",
                "checkpoint_tip": "30b4676023d84de629d3a0bce3f1814642bd960b",
                "queued": false,
                "sha": "9515eba4eded89c906957420e13d10e6015bef5a",
              },
              Object {
                "checkpoint_parent": "3fdd5ebeb5eb14d767a52c15b94f403f643103d6",
                "checkpoint_tip": "30b4676023d84de629d3a0bce3f1814642bd960b",
                "queued": false,
                "sha": "e0e36dbb1308984ae567aca66a3ed2661ec82a92",
              },
              Object {
                "checkpoint_parent": "4d08facf98b8121602b2cf3efd0d69f215f70dea",
                "checkpoint_tip": "30b4676023d84de629d3a0bce3f1814642bd960b",
                "queued": false,
                "sha": "3fdd5ebeb5eb14d767a52c15b94f403f643103d6",
              },
              Object {
                "checkpoint_parent": "33224258fdec80828010f09bde20bcd453e3a8a9",
                "checkpoint_tip": "30b4676023d84de629d3a0bce3f1814642bd960b",
                "queued": false,
                "sha": "4d08facf98b8121602b2cf3efd0d69f215f70dea",
              },
            ],
          },
          Object {
            "queued": true,
            "sha": "3c800c3a7473db1506179bdf9c5e85b6f145c166",
          },
          Object {
            "queued": true,
            "sha": "b7c9945e6fe1b86006e60fa7f6da65254d8b031a",
          },
        ],
      },
    ]
  `)
})
