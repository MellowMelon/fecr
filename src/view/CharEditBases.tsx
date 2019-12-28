import React, {memo} from "react";
import {Box, Heading, Text} from "grommet";

import {Stat, CharClass, CharName, StatsTable, GameData} from "../types";
import getHelp from "../HelpTable";
import {ViewAction} from "../state/types";

import ButtonMaybeMenu from "./ButtonMaybeMenu";
import InputClass from "./InputClass";
import InputStats from "./InputStats";
import InputStatName from "./InputStatName";
import InputCharName from "./InputCharName";
import HistoryBase from "./HistoryBase";
import HelpButton from "./HelpButton";

type Props = {
	game: GameData;
	name: CharName;
	baseLevel: number;
	baseClass: CharClass;
	baseStats: StatsTable;
	boon?: Stat;
	bane?: Stat;
	parent?: CharName;
	dispatch: (a: ViewAction) => void;
};

const CharEditBases: React.FunctionComponent<Props> = function(props: Props) {
	const {
		game,
		name,
		baseLevel,
		baseClass,
		baseStats,
		boon,
		bane,
		parent,
		dispatch,
	} = props;
	const gameCharData = game.chars[name];

	const onResetBases = function(altIndex: number) {
		dispatch({type: "updateCharResetBases", altIndex});
	};

	const onChangeBaseLevel = function(level: number) {
		dispatch({type: "updateCharBaseLevel", level});
	};

	const onSelectBaseClass = function(newClass: CharClass) {
		dispatch({type: "updateCharBaseClass", newClass});
	};

	const onChangeBaseStats = function(statName: Stat, value: number) {
		dispatch({type: "updateCharBaseStats", stats: {[statName]: value}});
	};

	const onSelectBoon = function(newStat: Stat) {
		dispatch({type: "updateCharBaseBoon", value: newStat});
	};

	const onSelectBane = function(newStat: Stat) {
		dispatch({type: "updateCharBaseBane", value: newStat});
	};

	const onSelectParent = function(newName: CharName) {
		dispatch({type: "updateCharBaseParent", name: newName});
	};

	const basesAlts = gameCharData.basesAlts || [];
	const resetOptions = [
		gameCharData.defaultAltName || "Default",
		...basesAlts.map(alt => alt.name),
	];
	const resetButton: React.ReactNode = (
		<ButtonMaybeMenu
			label="Set to Game Defaults"
			options={resetOptions}
			onClick={i => onResetBases(i - 1)}
		/>
	);
	const resetRow: React.ReactNode = (
		<Box direction="row" alignSelf="start">
			{resetButton}
		</Box>
	);

	let boonBaneBox: React.ReactNode = null;
	if (gameCharData.hasBoonBane) {
		boonBaneBox = (
			<React.Fragment>
				<Box direction="row" align="center" gap="small">
					<Text weight="bold">Boon</Text>
					<InputStatName game={game} value={boon!} onSelect={onSelectBoon} />
				</Box>
				<Box direction="row" align="center" gap="small">
					<Text weight="bold">Bane</Text>
					<InputStatName game={game} value={bane!} onSelect={onSelectBane} />
				</Box>
			</React.Fragment>
		);
	}

	let parentBox: React.ReactNode = null;
	if (gameCharData.hasBoonBane) {
		parentBox = (
			<React.Fragment>
				<Box direction="row" align="center" gap="small">
					<Text weight="bold">Parent</Text>
					<InputCharName
						game={game}
						value={parent!}
						onSelect={onSelectParent}
					/>
				</Box>
			</React.Fragment>
		);
	}

	return (
		<HistoryBase
			game={game}
			level={baseLevel}
			index={-1}
			count={-1}
			onSetLevel={onChangeBaseLevel}
			onMove={() => {}}
			onDelete={() => {}}
		>
			<Box gap="small">
				<Box direction="row" align="center">
					<Heading level={3} margin="none">
						Initial Stats
					</Heading>
					<HelpButton
						title="Help - Initial Stats"
						md={getHelp(game, "bases")}
					/>
					<Box flex />
				</Box>
				{resetRow}
				<Box direction="row" align="center" gap="small">
					<Text weight="bold">Class</Text>
					<InputClass
						game={game}
						value={baseClass}
						onSelect={onSelectBaseClass}
					/>
				</Box>
				{boonBaneBox}
				{parentBox}
				<InputStats
					game={game}
					value={baseStats}
					onChange={onChangeBaseStats}
				/>
			</Box>
		</HistoryBase>
	);
};
export default memo(CharEditBases);
