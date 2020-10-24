# vscode-dvc

An extension for VS Code that provides support for experiment tracking, file management, and pipelines

# Trying the extension

If you'd like to try the extension without installing, [download and install the .vsix](https://github.com/iterative/vscode-dvc/blob/master/extension/dvc-integration-0.1.0.vsix)

# Dev-Setup

-   Install VS Code, nodejs and yarn
-   Run `yarn` inside in the root dir
-   Run `yarn workspace dvc-integration dev` and `yarn workspace dvc-vscode-webview dev` to start the typescript and webpack compilers.
-   Use the run profile "Run Extension (Hot Reload + Dev UI)" in VS Code. This should enable hot reload for both the VS Code extension and the webview.
-   Run `yarn build` to build the vsix.
