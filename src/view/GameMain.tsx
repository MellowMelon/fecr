import React, {useState} from "react";
import {Button, Box, Heading, Layer, Markdown, Tabs, Tab, Text} from "grommet";
import {
	CircleQuestion as CircleQuestionIcon,
	FormClose as FormCloseIcon,
	Share as ShareIcon,
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
	const [showHelp, setShowHelp] = useState<boolean>(false);
	const [showPersist, setShowPersist] = useState<boolean>(false);

	const {state, dispatch} = props;
	const {team, charTab, charName} = state;
	const game = state.game!;

	let helpModal = null;
	if (showHelp) {
		const onCloseHelp = () => setShowHelp(false);

		helpModal = (
			<Layer onEsc={onCloseHelp} onClickOutside={onCloseHelp}>
				<Box pad="medium" overflow="auto">
					<Box direction="row" align="center">
						<Heading margin="none" level={4}>
							Getting Started
						</Heading>
						<Box flex />
						<Button icon={<FormCloseIcon />} onClick={onCloseHelp} />
					</Box>
					<Markdown>{getHelp(game, "start")}</Markdown>
				</Box>
			</Layer>
		);
	}

	let persistModal = null;
	if (showPersist) {
		const onClosePersist = () => setShowPersist(false);

		persistModal = (
			<Layer onEsc={onClosePersist} onClickOutside={onClosePersist}>
				<Box pad="medium" overflow="auto">
					<Box direction="row" align="center">
						<Heading margin="none" level={4}>
							Save / Load
						</Heading>
						<Box flex />
						<Button icon={<FormCloseIcon />} onClick={onClosePersist} />
					</Box>
					<Markdown>{getHelp(game, "saveLoad")}</Markdown>
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
				<Button
					icon={<CircleQuestionIcon />}
					title="Help"
					onClick={() => setShowHelp(true)}
				/>
				<Button
					icon={<ShareIcon />}
					title="Save/Load"
					onClick={() => setShowPersist(true)}
				/>
				<Button
					icon={<UndoIcon />}
					title="Undo"
					disabled={!canUndo}
					onClick={() => dispatch({type: "undo"})}
				/>
				<Button
					icon={<RedoIcon />}
					title="Redo"
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
			{helpModal}
			{persistModal}
		</Box>
	);
};
export default GameMain;
