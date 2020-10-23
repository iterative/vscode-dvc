import * as React from "react";
import { observer } from "mobx-react";
import { Model } from "../model/Model";
import classnames = require("classnames");
import { hotComponent } from "../hotComponent";
import { inspect } from "util";

const Experiment = ({
	label,
	timestamp,
	...rest
}: {
	label: string;
	timestamp: Date;
}) => (
		<div>
			<h3>
				{label}: {timestamp}
			</h3>
			<pre>{inspect(rest)}</pre>
		</div>
	);

@hotComponent(module)
@observer
export class GUI extends React.Component<{ model: Model }> {
	render() {
		try {
			const model = this.props.model;
			if (!model || !model.message) return <p>Webview was given no message!</p>;
			const parsedMessage = JSON.parse(model.message)
			const { workspace, experiments } = parsedMessage
			return (
				<div
					className="component-GUI"
					tabIndex={0}
					style={{
						display: "flex",
						flexDirection: "column",
						height: "100%",
						margin: 10,
					}}
				>
					<h1>Experiments</h1>

					{workspace && (
						<div>
							<h2>Workspace</h2>
							<pre>{inspect(workspace)}</pre>
						</div>
					)}

					{
						experiments.map(({ label, ...rest }: {label: string}) => (
							<div>
								<h2>{label}</h2>
								<pre>{inspect(rest)}</pre>
							</div>
						))
					}

				</div>
			);
		} catch (e) {
			return (
				<div>
					<p>Error! {e.message}</p>
				</div>
			);
		}
	}
}
