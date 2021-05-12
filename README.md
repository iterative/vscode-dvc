# VSCode DVC: Insider Preview

[![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/build.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/build.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)

A Visual Studio Code Extension that aims to allow users of all technical
backgrounds to effectively use [DVC](https://dvc.org/), particularly the new
[Experiments](https://dvc.org/doc/start/experiments) feature.

This project is in a very early state, and will definitely change in the future.
With this in mind, the extension is built against the Insiders version of VS
Code and the latest master of DVC installed from Git. Once we are feature
complete and all Insider features we depend on move into stable, we'll end up
building against stable VS Code.

## Setup

### Installing the Extension

This repo is set up with a
[GitHub Action](https://github.com/iterative/vscode-dvc/actions) that uploads an
installable vsix build of the extension for every commit, complete with the Git
SHA appended to the extension version.

You can find the download link in the Artifacts list of any run of the
Continuous Integration workflow. 

![Screenshot_2021-05-12 iterative vscode-dvc](https://user-images.githubusercontent.com/9111807/118053924-64d0e000-b353-11eb-8d3d-7e202d741f54.png)

The easiest way to get to the build for any
particular branch is to use the GitHub Checks UI to get to the details of the
"Continuous Integration" run: next to any commit, its CI status will show up as an icon next to it. Click this icon to see a list of all Checks, and click

### Installing and Integrating With DVC CLI

There are quite a few options for installing DVC, with one big split being
whether DVC is installed globally or in a virtual environment.

- Virtual environment recognition powered by the
  [`ms-python`](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
  extension.

- The `dvc.dvcPath` setting can be set to a specific binary path in order to use
  a specific dvc executable and skip all `ms-python` inference.

- Simply calling `dvc` on the CLI is used as a fallback.

Using the Python extension is the easiest way to use virtual environments, and
using a global install of dvc is the easiest way to not use the Python
extension. For other niche cases, the `dvc.dvcPath` setting should hopefully
serve as an escape hatch.

The "Select DVC CLI Path" command in the Command Palette can be used to set the
`dvc.dvcPath` option from a more user-friendly QuickPick menu.

## How to Use

This extension, especially in this early state, makes extensive use of the
[Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette).
Every feature should be available from the Command Palette, and from there
additional GUI elements are added for convenience.

### Experiments

To open up the Experiments table view for a DVC repo, use the "Show Experiments"
command from the Command Palette.

To run experiments, use the "Run Experiment" command or use the UI elements
available when the table is visible.

![Experiment GUI Buttons](https://user-images.githubusercontent.com/9111807/118054967-40760300-b355-11eb-8ee6-38a344bdaced.png)

### SCM

The extension also provides a view in the SCM view container, next to the Git 
view, to manage file actions like checkout, pull, push, and add.

![image](https://user-images.githubusercontent.com/9111807/118057076-19b9cb80-b359-11eb-91bc-9c73a85a83a8.png)

## Contributing

See development docs and contributing guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md)
