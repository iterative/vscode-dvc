## Feedback

See something that should be changed? Want to request a new feature? Open an
[issue on GitHub](https://github.com/iterative/vscode-dvc/issues)!

## Pull requests

You may also submit a change request to this repository directly
[from here](https://github.com/iterative/vscode-dvc/pulls). Contributions are
highly appreciated!

> 💡 **Tip**: To enable formatting on save in VS Code, install the
> `esbenp.prettier-vscode` extension. This is highly recommended as PRs with
> improper format will be blocked from merge until fixed.

## Development environment

Setting up a dev environment allows contributors to test their changes to the
extension. The local repository source is built and loaded into the Extension
Development Host.

First, ensure that [Yarn](https://yarnpkg.com/) and
[Visual Studio Code](https://code.visualstudio.com) are installed.

- Open this repository's root directory as a project in VS Code.

- Run `Tasks: Run Build Task` (Shift + Ctrl/Cmd + `b`) to start the extension
  and Webview dev servers (alternatively, run `yarn dev-server` from the
  _Integrated Terminal_).

  > **Warning**: Having a separate (`.vsix`) version of the extension installed
  > may cause all kinds of chaos in your development environment.

- **Start Debugging** (F5) to open the Extension Development Host, a child
  instance of VS Code with the results of the dev servers installed as an
  extension.

  > **Note**: using the `Run Extension` command when running the debugger will
  > prevent all other extensions from loading into VS Code. This will improve
  > the performance of VS Code but can cause certain DVC commands to fail if the
  > project uses an isolated python environment (see [this warning](#warning)).

- Open a DVC project in the Extension Development Host. VS Code will remember
  the last project opened, so this step only has to be done once.

  > **Note**: We have provided a demo project as part of this repo, but feel
  > free to use any DVC project that you have available.

## The demo project

The [demo project](demo) is provided as a lightweight, convenient testbed to try
your changes to the extension.

> **Note**: It is not an exhaustive showcase of DVC's features. Testers are
> encouraged to try other DVC repositories -- especially real-world cases!

- Run `yarn setup:venv` from the root of this repo to set up a virtual Python
  environment for the demo project (in `demo/.env`).

- Open the `demo/` folder of this repo directly in VS Code.

- Pull the project data with the extension (either from the **DVC Tracked**
  panel in the _File Explorer_ or the **DVC panel** for _Source Control_) or by
  running `dvc pull` from a _Terminal_.

- In order to [run experiments] in the demo project, the virtual env should be
  loaded through the Microsoft [Python extension] (please install it).

[python extension]:
  https://marketplace.visualstudio.com/items?itemName=ms-python.python
[run experiments]:
  https://github.com/iterative/vscode-dvc/blob/main/extension/resources/walkthrough/run-experiments.md

<a id='warning'></a>

> **Warning**: When using any project that relies on an isolated Python
> environment (`conda`, `venv`, etc.), Microsoft's Python extension is required.
> It's used by this extension to locate and utilize the required environment.

## React component development with Storybook

Start Storybook with `yarn storybook` in either the monorepo root or in the
`webview` project. You can develop the React components this plugin uses without
requiring VS Code as a dev environment.

There are some discrepancies between the Storybook environment and the
environment of a real VS Code extension, custom themes being a big one. Always
make sure to try out changed components in the full dev environment before
merging!
