import _ from "lodash";
import React from "react";
import {Box, Button, Heading, ResponsiveContext} from "grommet";

import {HistoryEntry, GameData} from "../types";
import HelpTable from "../HelpTable";
import {ViewAction} from "../state/types";

import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	dispatch: (a: ViewAction) => void;
};

const labelTable = {
	checkpoint: "Add Checkpoint",
	class: "Add Class Change",
	boost: "Add Stat Boost",
	maxboost: "Add Max Stat Increase",
	equipchange: "Add Equipment Change",
};

const HistoryAdd: React.FunctionComponent<Props> = function(props: Props) {
	const {game, dispatch} = props;
	const {enableMaxIncrease, enableEquipment} = game.globals;

	const screenSize = React.useContext(ResponsiveContext);

	const onAddHistory = function(type: HistoryEntry["type"]) {
		dispatch({type: "updateCharHistoryAdd", entryType: type});
	};

	const makeHistoryAddButton = function(type: HistoryEntry["type"]) {
		const label = labelTable[type] || "Add " + type;
		return (
			<Button key={type} label={label} onClick={() => onAddHistory(type)} />
		);
	};

	let buttonLayout: HistoryEntry["type"][][] = [
		["checkpoint", "class"],
		["boost", "maxboost", "equipchange"],
	];
	buttonLayout = buttonLayout.map(row => {
		return row.filter(histType => {
			if (histType === "maxboost" && !enableMaxIncrease) {
				return false;
			} else if (histType === "equipchange" && !enableEquipment) {
				return false;
			}
			return true;
		});
	});

	if (screenSize === "xxsmall") {
		buttonLayout = _.flatten(buttonLayout).map(x => [x]);
	}

	const buttonEls = buttonLayout.map((row, i) => {
		return (
			<Box key={i} direction="row" gap="small">
				{row.map(makeHistoryAddButton)}
			</Box>
		);
	});

	return (
		<Box pad="medium" gap="small">
			<Box direction="row">
				<Heading level={3}>Add History</Heading>
				<HelpButton title="Help - Add History" md={HelpTable.histAdd} />
			</Box>
			{buttonEls}
		</Box>
	);
};
export default HistoryAdd;
