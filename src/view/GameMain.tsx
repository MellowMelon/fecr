import React, {useState} from "react";
import {Button, Box, Heading, Layer, Markdown, Menu, Tabs, Tab} from "grommet";
import {FormClose as FormCloseIcon, Menu as MenuIcon} from "grommet-icons";

import {Char} from "../types";
import HelpTable from "../HelpTable";
import {CharTab, ViewState, ViewAction} from "../state/types";
import {createChar} from "../CharUtils";

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
					<Markdown>{HelpTable.saveLoad}</Markdown>
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

	return (
		<Box gap="medium">
			<Box direction="row">
				<Menu icon={<MenuIcon />} items={topMenuItems} />
			</Box>
			<Heading level={1} margin="none">
				{game.name}
			</Heading>
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
