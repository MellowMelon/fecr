import React from "react";
import {Box, Image, Paragraph} from "grommet";

import {CharName, GameData, Team} from "../common";
import {doesCharHaveData} from "../CharUtils";

type Props = {
	game: GameData;
	team: Team;
	charName: CharName | null;
	onSelect: (name: CharName, forEditing: boolean) => void;
};

const CharSelectPanel: React.FunctionComponent<Props> = function(props: Props) {
	const onTeamEls: React.ReactElement[] = [];
	const offTeamEls: React.ReactElement[] = [];

	const {chars, id} = props.game;

	Object.keys(chars).forEach(name => {
		const hasData = doesCharHaveData(props.game, props.team[name]);
		const src = "images/chars/" + id + "-" + name.toLowerCase() + ".jpg";
		const boxBorder =
			name === props.charName
				? {color: "accent-1", size: "small"}
				: {color: "dark-4", size: "small"};
		const boxProps = {
			key: name,
			border: boxBorder,
			pad: "xxsmall",
			margin: "xxsmall",
			elevation: name === props.charName ? "none" : "small",
			style: {cursor: "pointer"},
			onClick: () => props.onSelect(name, !hasData),
		};
		const imageProps = {
			src,
			width: 48,
			height: 48,
		};
		const el = (
			<Box {...boxProps}>
				<Image {...imageProps} />
			</Box>
		);
		if (hasData) {
			onTeamEls.push(el);
		} else {
			offTeamEls.push(el);
		}
	});

	let onTeamFrag = null;
	if (onTeamEls.length) {
		onTeamFrag = (
			<React.Fragment>
				<Paragraph>View a character on the team:</Paragraph>
				<Box direction="row" wrap={true}>
					{onTeamEls}
				</Box>
			</React.Fragment>
		);
	}
	let offTeamFrag = null;
	if (offTeamEls.length) {
		offTeamFrag = (
			<React.Fragment>
				<Paragraph>Add a character to the team:</Paragraph>
				<Box direction="row" wrap={true}>
					{offTeamEls}
				</Box>
			</React.Fragment>
		);
	}

	return (
		<Box>
			{onTeamFrag}
			{offTeamFrag}
		</Box>
	);
};
export default CharSelectPanel;
