import { getTableData, inferDefaultOptions } from "./DvcReader";
import * as path from "path";
import * as util from "util";

const testDvcDirectory = path.resolve("..", "demo", "example-get-started");
const extensionDirectory = path.resolve();

const testOptions = inferDefaultOptions(testDvcDirectory);

test("Options on the base non-.env repo defaults to dvc on PATH", async () => {
	expect(await inferDefaultOptions(path.resolve())).toEqual({
		bin: "dvc",
		cwd: extensionDirectory,
	});
});

test("Options are properly inferred from the test repo", async () => {
	expect(await testOptions).toEqual({
		bin: path.resolve(testDvcDirectory, ".env", "bin", "dvc"),
		cwd: testDvcDirectory,
	});
});

test("Comparing a table in the test repo to a manual copy of what it should be", async () => {
	const tableData = await getTableData(await testOptions);
	expect(tableData).toEqual({
		workspace: {
			baseline: {
				timestamp: null,
				params: {
					"params.yaml": {
						prepare: { split: 0.2, seed: 20170428 },
						featurize: { max_features: 1500, ngrams: 2 },
						train: { seed: 20170428, n_estimators: 50 },
					},
				},
				queued: false,
				metrics: { "scores.json": { auc: 0.6131382960762474 } },
			},
		},
		"9e05ab4590fb1a569875153bbb8a8a0231e2acec": {
			baseline: {
				timestamp: "2020-08-01T23:01:45",
				params: {
					"params.yaml": {
						prepare: { split: 0.2, seed: 20170428 },
						featurize: { max_features: 1500, ngrams: 2 },
						train: { seed: 20170428, n_estimators: 50 },
					},
				},
				queued: false,
				metrics: { "scores.json": { auc: 0.6131382960762474 } },
				name: "10-bigrams-experiment",
			},
			ddd585e77fdbb49f94452bbb7f2c5d86169d1056: {
				timestamp: "2020-10-19T19:29:26",
				params: {
					"params.yaml": {
						prepare: { split: 0.2, seed: 20170428 },
						featurize: { max_features: 1500, ngrams: 2 },
						train: { seed: 20170428, n_estimators: 50 },
					},
				},
				queued: false,
				metrics: { "scores.json": { auc: 0.6131382960762474 } },
			},
		},
	});
});
