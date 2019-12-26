import React, {useState} from "react";
import {
	Button,
	Box,
	Heading,
	Layer,
	Markdown,
	Menu,
	Tabs,
	Tab,
	Text,
} from "grommet";
import {
	FormClose as FormCloseIcon,
	Menu as MenuIcon,
	Undo as UndoIcon,
	Redo as RedoIcon,
} from "grommet-icons";

import {Char} from "../types";
import getHelp from "../HelpTable";
import {createChar} from "../CharUtils";
import {CharTab, ViewState, ViewAction} from "../state/types";
import * as OpsUndoRedo from "../state/OpsUndoRedo";

import CharSelectPanel from "./CharSelectPanel";
import CharEditPanel from "./CharEditPanel";
import CharReportPanel from "./CharReportPanel";

type Props = {
	state: ViewState;
	dispatch: (a: ViewAction) => void;
};

const GameMain: React.FunctionComponent<Props> = function(props: Props) {
	const [showPersist, setShowPersist] = useState<boolean>(false);

	const {state, dispatch} = props;
	const {team, charTab, charName} = state;
	const game = state.game!;

	const topMenuItems = [
		{
			label: "Back to Game Select",
			onClick: () => dispatch({type: "deselectGame"}),
		},
		{label: "Save / Load", onClick: () => setShowPersist(true)},
	];

	let persistModal = null;
	if (showPersist) {
		const onReset = function() {
			dispatch({type: "resetGame"});
			setShowPersist(false);
		};
		const onClose = () => setShowPersist(false);

		persistModal = (
			<Layer onEsc={onClose} onClickOutside={onClose}>
				<Box pad="medium" overflow="auto">
					<Box direction="row" align="center">
						<Heading margin="none" level={4}>
							Save / Load
						</Heading>
						<Box flex />
						<Button icon={<FormCloseIcon />} onClick={onClose} />
					</Box>
					<Markdown>{getHelp(game, "saveLoad")}</Markdown>
					<Button label="Reset" onClick={onReset} />
				</Box>
			</Layer>
		);
	}

	const tabList: CharTab[] = ["select", "edit", "report"];
	const tabIndex = tabList.indexOf(charTab);
	const onSelectTab = (i: number) => {
		const tab: CharTab = tabList[i] || "select";
		dispatch({type: "selectCharTab", tab});
	};

	let char: Char | null = null;
	if (charName && team[charName]) {
		char = team[charName];
	} else if (charName) {
		char = createChar(game, charName);
	}

	const selectTabBody = charTab === "select" && (
		<CharSelectPanel
			game={game}
			team={team}
			charName={charName}
			dispatch={dispatch}
		/>
	);
	const editTabBody = charTab === "edit" && (
		<CharEditPanel game={game} team={team} char={char} dispatch={dispatch} />
	);
	const reportTabBody = charTab === "report" && (
		<CharReportPanel game={game} team={team} char={char} dispatch={dispatch} />
	);

	const canUndo = OpsUndoRedo.isUndoEnabled(state.ur);
	const canRedo = OpsUndoRedo.isRedoEnabled(state.ur);

	return (
		<Box gap="medium">
			<Box direction="row">
				<Menu icon={<MenuIcon />} items={topMenuItems} />
				<Button
					icon={<UndoIcon />}
					disabled={!canUndo}
					onClick={() => dispatch({type: "undo"})}
				/>
				<Button
					icon={<RedoIcon />}
					disabled={!canRedo}
					onClick={() => dispatch({type: "redo"})}
				/>
			</Box>
			<Heading margin="none" truncate level={1}>
				Fire Emblem Character Reports
			</Heading>
			<Box direction="row" align="center" wrap>
				<Box margin={{right: "large"}}>
					<Text weight="bold">Current Game: {game.shortName}</Text>
				</Box>
				<Button
					label="Change Game"
					onClick={() => dispatch({type: "deselectGame"})}
				/>
			</Box>
			<Tabs activeIndex={tabIndex} onActive={onSelectTab}>
				<Tab title="Select">{selectTabBody}</Tab>
				<Tab title="Edit" disabled={!charName}>
					{editTabBody}
				</Tab>
				<Tab title="Report" disabled={!charName}>
					{reportTabBody}
				</Tab>
			</Tabs>
			{persistModal}
		</Box>
	);
};
export default GameMain;
