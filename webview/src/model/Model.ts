import {
	MessageFromWebview,
	MessageToWebview,
	WindowWithWebviewData,
} from "dvc-integration/src/webviewContract";
import { observable, action, computed, when, runInAction, autorun } from "mobx";
import { getVsCodeApi } from "./VsCodeApi";
import { Disposable } from "@hediet/std/disposable";

declare const window: Window & WindowWithWebviewData;
declare let __webpack_public_path__: string;

interface PersistedModelState {
	message?: string;
}

export class Model {
	public readonly dispose = Disposable.fn();

	@observable
	public theme: "dark" | "light" = "light";

	@observable
	public message: string | undefined;

	private readonly vsCodeApi = getVsCodeApi<
		PersistedModelState,
		MessageFromWebview,
		MessageToWebview
	>();

	constructor() {
		const data = window.webviewData;

		// this needs to be setup so that dynamic imports work
		__webpack_public_path__ = data.publicPath;
		this.theme = data.theme;

		this.dispose.track(
			this.vsCodeApi.addMessageHandler(message =>
				this.handleMessage(message)
			)
		);

		const state = this.vsCodeApi.getState();
		if (state) {
			this.setState(state);
		}

		this.sendMessage({ kind: "initialized" });

		this.dispose.track({
			dispose: autorun(() => {
				console.log(this.getState());
				this.vsCodeApi.setState(this.getState());
			}),
		});
	}

	private getState(): PersistedModelState {
		return {
			message: this.message,
		};
	}

	private setState(state: PersistedModelState) {
		this.message = state.message;
	}

	private sendMessage(message: MessageFromWebview): void {
		this.vsCodeApi.postMessage(message);
	}

	private handleMessage(message: MessageToWebview): void {
		switch (message.kind) {
			case "setTheme":
				this.theme = message.theme;
				return;
			case "showMessage":
				this.message = message.message;
				return;
			default:
				const nvr: never = message;
				console.error("Unexpected message", message);
		}
	}
}
