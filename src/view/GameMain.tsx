import React, {useState} from "react";
import {Button, Box, Heading, Layer, Markdown, Menu, Tabs, Tab} from "grommet";
import {FormClose as FormCloseIcon, Menu as MenuIcon} from "grommet-icons";

import {CharName, Char} from "../common";
import HelpTable from "../HelpTable";
import * as ViewState from "../ViewState";
import {createChar} from "../CharUtils";

import CharSelectPanel from "./CharSelectPanel";
import CharEditPanel from "./CharEditPanel";
import CharReportPanel from "./CharReportPanel";

type Props = {
	state: ViewState.State;
	onGameSelect: () => void;
	onUpdateState: (s: ViewState.State) => void;
};

const GameMain: React.FunctionComponent<Props> = function(props: Props) {
	const [showPersist, setShowPersist] = useState<boolean>(false);

	const {team, charTab, charName} = props.state;
	const game = props.state.game!;

	const topMenuItems = [
		{label: "Back to Game Select", onClick: props.onGameSelect},
		{label: "Save / Load", onClick: () => setShowPersist(true)},
	];

	let persistModal = null;
	if (showPersist) {
		const onReset = function() {
			props.onUpdateState(ViewState.resetGame(props.state));
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

	const tabList: ViewState.CharTab[] = ["select", "edit", "view"];
	const tabIndex = tabList.indexOf(charTab);
	const onSelectTab = (i: number) => {
		const newTab: ViewState.CharTab = tabList[i] || "select";
		const newState = {...props.state, charTab: newTab};
		props.onUpdateState(newState);
	};

	const onSelectChar = (name: CharName, forEditing: boolean) => {
		const newTab: ViewState.CharTab = forEditing ? "edit" : "view";
		const newState = {...props.state, charTab: newTab, charName: name};
		props.onUpdateState(newState);
	};

	let char: Char | null = null;
	if (charName && team[charName]) {
		char = team[charName];
	} else if (charName) {
		char = createChar(game, charName);
	}
	const onUpdateChar = (newChar: Char) => {
		if (!charName || team[charName] === newChar) return;
		const newTeam = {
			...team,
			[charName]: newChar,
		};
		const newState = {...props.state, team: newTeam};
		props.onUpdateState(newState);
	};

	const selectTabBody = charTab === "select" && (
		<CharSelectPanel
			game={game}
			team={team}
			charName={charName}
			onSelect={onSelectChar}
		/>
	);
	const editTabBody = charTab === "edit" && (
		<CharEditPanel
			game={game}
			team={team}
			char={char}
			onUpdateChar={onUpdateChar}
			onSelectChar={name => onSelectChar(name, true)}
		/>
	);
	const reportTabBody = charTab === "view" && (
		<CharReportPanel
			game={game}
			team={team}
			char={char}
			onSelectChar={name => onSelectChar(name, false)}
		/>
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
