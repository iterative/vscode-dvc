# vscode-dvc

This extension adds first-class support for DVC experiments in Visual Studio
Code

# Dev-Setup

- Install VS Code, nodejs and yarn
- Run `yarn` inside in the root dir
- Run `yarn workspace dvc-integration dev` and
  `yarn workspace dvc-vscode-webview dev` to start the typescript and webpack
  compilers.
- Use the run profile "Run Extension (Hot Reload + Dev UI)" in VS Code. This
  should enable hot reload for both the VS Code extension and the webview.
- Run `yarn build` to build the vsix.

## Usage

### Commands

Use the main view or VS Code's Command Palette (ctrl+shift+p) to access
commands.

- View Tree: show the webview.
- Run Experiment: run 'dvc exp run' in current workspace.

## Development

### Set Up Environment

- Install Visual Studio Code, nodejs and yarn
- Run `yarn` inside in the root dir to install packages

### Visual Studio Code Development

- Open the `vscode-dvc` parent project folder in VS Code
- Run `Tasks: Run Build Task` (Ctrl+Shift+b) to start the extension and webview
  development servers
- Open the test extension with `Start Debugging` (f5)

### Editor-agnostic Development

- run the `dev-server` NPM script to start the extension and webview dev servers
  (alternatively, use `extension-dev-server` and `webview-dev-server` to launch
  them individually)
- run the `dev-ui` script to launch VS code in with this plugin in dev mode.
