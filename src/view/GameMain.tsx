import React, {useState} from "react";
import {Button, Box, Heading, Layer, Menu, Paragraph, Tabs, Tab} from "grommet";
import {FormClose as FormCloseIcon, Menu as MenuIcon} from "grommet-icons";

import {CharName, Char} from "../common";
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
				<Box>
					<Button icon={<FormCloseIcon />} onClick={onClose} />
					<Paragraph>
						To <strong>save</strong>, copy the URL in your address bar. This URL
						updates after everything you do.
					</Paragraph>
					<Paragraph>
						To <strong>load</strong>, paste a URL saved previously.
					</Paragraph>
					<Paragraph>
						If you'd like to start over, use the button below. Make sure you've
						recorded the current URL if you want to view the current team at a
						later time.
					</Paragraph>
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

	return (
		<Box>
			<Box direction="row">
				<Menu icon={<MenuIcon />} items={topMenuItems} />
			</Box>
			<Heading level={1} margin="none">
				{game.name}
			</Heading>
			<Tabs activeIndex={tabIndex} onActive={onSelectTab}>
				<Tab title="Select">
					<CharSelectPanel
						game={game}
						team={team}
						charName={charName}
						onSelect={onSelectChar}
					/>
				</Tab>
				<Tab title="Edit" disabled={!charName}>
					<CharEditPanel game={game} char={char} onUpdateChar={onUpdateChar} />
				</Tab>
				<Tab title="Report" disabled={!charName}>
					<CharReportPanel game={game} char={char} />
				</Tab>
			</Tabs>
			{persistModal}
		</Box>
	);
};
export default GameMain;
