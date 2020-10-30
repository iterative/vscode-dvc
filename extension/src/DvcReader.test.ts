import * as path from "path";
import { getExperiments, inferDefaultOptions } from "./DvcReader";

const extensionDirectory = path.resolve(__dirname, "..");
const testDvcDirectory = path.resolve(
	extensionDirectory,
	"..",
	"demo",
	"example-get-started"
);

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

test("Comparing a table in the test repo to a snapshot", async () => {
	const tableData = getExperiments(await testOptions);
	return expect(await tableData).toMatchSnapshot();
});
