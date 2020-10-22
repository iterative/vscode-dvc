import {
	window,
	ExtensionContext,
	commands,
	scm,
	Uri,
	workspace,
	TreeDataProvider,
	TreeItem,
	ThemeIcon,
	TreeItemCollapsibleState,
	Command,
} from "vscode";
import { Disposable } from "@hediet/std/disposable";
import {
	enableHotReload,
	hotRequireExportedFn,
	registerUpdateReconciler,
	getReloadCount,
} from "@hediet/node-reload";

import { inspect } from "util";

import { Config } from "./Config";
import { DvcWebviewManager } from "./DvcWebviewManager";
import { getTableData, inferDefaultOptions } from "./DvcReader";

if (process.env.HOT_RELOAD) {
	enableHotReload({ entryModule: module, loggingEnabled: true });
}

registerUpdateReconciler(module);

export class Extension {
	public readonly dispose = Disposable.fn();

	private readonly config = new Config();

	private readonly manager = this.dispose.track(
		new DvcWebviewManager(this.config)
	);

	constructor() {
		if (getReloadCount(module) > 0) {
			const i = this.dispose.track(window.createStatusBarItem());
			i.text = `reload${getReloadCount(module)}`;
			i.show();
		}

		// When hot-reload is active, make sure that you dispose everything when the extension is disposed!
		this.dispose.track(
			commands.registerCommand(
				"dvc-integration.showWebview",
				async () => {
					const { workspaceFolders } = workspace;
					if (!workspaceFolders)
						throw new Error(
							"The Webview needs a Workspace folder!"
						);
					const options = await inferDefaultOptions(
						workspaceFolders[0].uri.fsPath
					);
					const tableData = await getTableData(options);
					const m = await this.manager.createNew();
					m.showMessage(
						inspect(tableData, { depth: null, colors: true })
					);
				}
			)
		);

		this.dvcScmFilesView();
		this.dvcCommandView();
	}

	dvcCommandView(): void {
		interface TreeItemEntry {
			label: string;
			command?: Command;
		}

		class DVCTreeDataProvider implements TreeDataProvider<TreeItemEntry> {
			/* onDidChangeTreeData?:
				| Event<void | MyTreeItem | null | undefined>
				| undefined; */

			async getChildren(
				element?: TreeItemEntry
			): Promise<TreeItemEntry[]> {
				if (!element) {
					// Root
					return [
						{
							label: "View Tree",
							command: {
								title: "Webview Tree",
								command: "dvc-integration.showWebview",
							},
						},
					];
				}
				return [];
			}

			async getTreeItem(element: TreeItemEntry): Promise<TreeItem> {
				return {
					label: element.label,
					command: element.command,
					iconPath: ThemeIcon.File,
					collapsibleState: TreeItemCollapsibleState.None,
				};
			}
		}

		this.dispose.track(
			window.createTreeView("dvc-tree", {
				treeDataProvider: new DVCTreeDataProvider(),
				canSelectMany: false,
			})
		);
	}

	dvcScmFilesView(): void {
		const { workspaceFolders } = workspace;
		if (!workspaceFolders) return;

		workspaceFolders.forEach((folder) => {
			const uri = `${folder.uri.fsPath}/`;

			const c = this.dispose.track(
				scm.createSourceControl("dvc", "DVC", Uri.file(uri))
			);
			c.acceptInputCommand = {
				command: "workbench.action.output.toggleOutput",
				title: "foo",
			};

			c.inputBox.placeholder =
				"Message (Ctrl+Enter to commit on 'master')";
			// ic.commitTemplate = "templatea";

			c.statusBarCommands = [
				{
					command: "test",
					title: "DVC",
				},
			];

			const resourceGroup = this.dispose.track(
				c.createResourceGroup("group1", "Unchanged")
			);

			resourceGroup.resourceStates = [
				{
					resourceUri: Uri.file(`${uri}path/file.ts`),
					command: {
						command: "workbench.action.output.toggleOutput",
						title: "group1-file1",
					},

					decorations: {
						strikeThrough: false,
					},
				},
				{
					resourceUri: Uri.file(`${uri}path/file2.txt`),
					command: {
						command: "workbench.action.output.toggleOutput",
						title: "group1-file1",
					},
					decorations: {
						strikeThrough: false,
					},
				},
				{
					resourceUri: Uri.file(`${uri}path/sub/file.txt`),
					command: {
						command: "workbench.action.output.toggleOutput",
						title: "group1-file1",
					},
					decorations: {
						strikeThrough: false,
					},
				},
			];
		});
	}
}

export function activate(context: ExtensionContext): void {
	context.subscriptions.push(
		hotRequireExportedFn(
			module,
			Extension,
			(HotExtension) => new HotExtension()
		)
	);
}

// export function deactivate(): void {}
