import { exec } from "child_process";
import { promisify } from "util";
import { stat, accessSync } from "fs";
import * as path from "path";
const execPromise = promisify(exec);

interface DVCExtensionOptions {
	bin: string;
	cwd: string;
}

export const inferDefaultOptions = async (cwd: string) => {
	const envDvcPath = path.resolve(cwd || ".", ".env", "bin", "dvc");
	let bin;
	try {
		accessSync(envDvcPath);
		bin = envDvcPath;
	} catch (e) {
		bin = "dvc";
	}
	return {
		bin,
		cwd,
	};
};

const execCommand: (
	options: DVCExtensionOptions,
	command: string
) => Promise<{ stdout: string; stderr: string }> = ({ bin, cwd }, command) =>
	execPromise(`${bin} ${command}`, {
		cwd,
	});

export const getTableData = async (options?: any) => {
	const { stdout, stderr } = await execCommand(
		options,
		"exp show --show-json"
	);
	const experimentsTableJson = JSON.parse(String(stdout));
	return experimentsTableJson;
};
