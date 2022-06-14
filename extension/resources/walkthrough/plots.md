# Plots

Select one or more experiments to visualize them in the
[`Plots Dashboard`](command:dvc.showPlots). This is the extension's equivalent
of the `dvc plots show` and `dvc plots diff` commands.

💡 If you don't have any DVC
[plots](https://dvc.org/doc/command-reference/plots) in the project, start
writing data points into JSON, YAML, CSV or TSV or saving plots as images
(`.png`, etc) (check the [DVCLive](https://dvc.org/doc/dvclive) helper library
if you use Python):

<p align="center">
  <img src="images/plots-dump-with-open-file.png"
       alt="Code to Dump a JSON Plot File" />
  <img src="images/plots-dump-with-dvclive.png"
       alt="Code to Dump a JSON Plot File with DVCLive" />
  <img src="images/plots-dump-image.png"
       alt="Code to Dump an Image Plot File" />
</p>

Use `DVC: Show Plots` from the
[Command Palette](command:workbench.action.quickOpen?%22>DVC:%20Show%20Plots%22)
to open up the plots dashboard. The extension will display the following
sections for selected experiments, that correspond to the different
[types of plots](https://dvc.org/doc/command-reference/plots#supported-file-formats)
supported by DVC:

<p align="center">
  <img src="images/plots-data-series.png"
       alt="Plots: Data Series" />
</p>

`Data Series`. JSON, YAML, CSV or TSV files visualized using the predefined
(e.g. confusion matrix, linear) or custom (Vega-lite) templates.

<p align="center">
  <img src="images/plots-images.png"
       alt="Plots: Images" />
</p>

`Images`. Any image file (e,g `.png`) can be visualized as a plot. They will be
rendered side by side in the table.

<p align="center">
  <img src="images/plots-trends.png"
       alt="Plots: Trends" />
</p>

`Trends`. Linear plots based on data from the experiments table if you use
[checkpoints](https://dvc.org/doc/user-guide/experiment-management/checkpoints).

The plots dashboard can be configured and accessed using using the `Plots` and
`Experiments` views:

<p float="left">
  <img src="images/plots-plots-view-icon.png"
       alt="Plots View" width="49%" />
  <img src="images/plots-experiments-view-icon.png"
       alt="Experiments View" width="49%" />
</p>
