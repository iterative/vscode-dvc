import {
	window,
	ExtensionContext,
	commands,
	scm,
	Uri,
	workspace,
	TreeDataProvider,
	Event,
	ProviderResult,
	TreeItem,
	ThemeIcon,
	TreeItemCollapsibleState,
} from "vscode";
import { Disposable } from "@hediet/std/disposable";
import {
	enableHotReload,
	hotRequireExportedFn,
	registerUpdateReconciler,
	getReloadCount,
} from "@hediet/node-reload";

if (process.env.HOT_RELOAD) {
	enableHotReload({ entryModule: module, loggingEnabled: true });
}

import { Config } from "./Config";
import { DvcWebviewManager } from "./DvcWebviewManager";

registerUpdateReconciler(module);

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		hotRequireExportedFn(module, Extension, Extension => new Extension())
	);
}

export function deactivate() {}

export class Extension {
	public readonly dispose = Disposable.fn();

	private readonly config = new Config();
	private readonly manager = this.dispose.track(
		new DvcWebviewManager(this.config)
	);

	constructor() {
		if (getReloadCount(module) > 0) {
			const i = this.dispose.track(window.createStatusBarItem());
			i.text = "reload" + getReloadCount(module);
			i.show();
		}

		// When hot-reload is active, make sure that you dispose everything when the extension is disposed!
		this.dispose.track(
			commands.registerCommand(
				"dvc-integration.showWebview",
				async () => {
					const result = await window.showInputBox({
						prompt: "Enter some message",
					});
					if (result) {
						const m = await this.manager.createNew();
						m.showMessage(result);
					}
				}
			)
		);

		this.testScmView();
		this.testTreeView();
	}

	testTreeView() {
		interface MyTreeItem {
			name: string;
		}

		class MyTreeDataProvider implements TreeDataProvider<MyTreeItem> {
			/*onDidChangeTreeData?:
				| Event<void | MyTreeItem | null | undefined>
				| undefined;*/

			async getTreeItem(element: MyTreeItem): Promise<TreeItem> {
				return {
					label: element.name,
					iconPath: ThemeIcon.File,
					collapsibleState: TreeItemCollapsibleState.Collapsed,
				};
			}

			async getChildren(element?: MyTreeItem): Promise<MyTreeItem[]> {
				// this produces an infinite tree
				return [
					{
						name: "3",
					},
					{
						name: "2",
					},
				];
			}
		}

		const result = this.dispose.track(
			window.createTreeView("dvc-tree-view", {
				treeDataProvider: new MyTreeDataProvider(),
				canSelectMany: false,
			})
		);
	}

	testScmView() {
		// TODO delete this. You can see the effect of this method in the Source Control Pane.

		const uri = workspace.workspaceFolders![0].uri.fsPath + "/";

		const c = this.dispose.track(
			scm.createSourceControl("dvc", "DVC", Uri.file(uri))
		);
		c.acceptInputCommand = {
			command: "workbench.action.output.toggleOutput",
			title: "foo",
		};

		c.inputBox.placeholder = "Message (Ctrl+Enter to commit on 'master')";
		//ic.commitTemplate = "templatea";

		c.statusBarCommands = [
			{
				command: "test",
				title: "dvc push",
			},
		];
		const g = this.dispose.track(
			c.createResourceGroup("group1", "Unchanged")
		);

		g.resourceStates = [
			{
				resourceUri: Uri.file(uri + "path/file.ts"),
				command: {
					command: "workbench.action.output.toggleOutput",
					title: "group1-file1",
				},

				decorations: {
					strikeThrough: false,
				},
			},
			{
				resourceUri: Uri.file(uri + "path/file2.txt"),
				command: {
					command: "workbench.action.output.toggleOutput",
					title: "group1-file1",
				},
				decorations: {
					strikeThrough: false,
				},
			},
			{
				resourceUri: Uri.file(uri + "path/sub/file.txt"),
				command: {
					command: "workbench.action.output.toggleOutput",
					title: "group1-file1",
				},
				decorations: {
					strikeThrough: false,
				},
			},
		];
	}
}
