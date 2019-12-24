import React, {useState} from "react";
import {Box, Grommet, Layer} from "grommet";

import {GameID} from "../common";
import * as ViewState from "../ViewState";
import {serialize} from "../CharSerialize";

import LoadErrorModal from "./LoadErrorModal";
import GameSelect from "./GameSelect";
import GameMain from "./GameMain";

type Props = {
	urlHash: string | null;
};

const grommetTheme: any = {
	global: {
		focus: {
			border: {
				color: "none",
			},
		},
		input: {
			padding: "4px",
		},
		breakpoints: {
			xxsmall: {
				value: 400,
			},
			xsmall: {
				value: 600,
			},
		},
	},
	select: {
		control: {
			extend: {
				backgroundColor: "white",
			},
		},
	},
};

function saveHash(hash: string) {
	window.localStorage.setItem("autosave", hash);
	window.history.replaceState({}, "", "#" + hash);
}

const Main: React.FunctionComponent<Props> = function(props: Props) {
	const [viewState, setState] = useState<ViewState.State>(
		ViewState.createState(props.urlHash)
	);

	let errorModal = null;
	if (viewState.loadError) {
		const onClose = () => {
			setState(ViewState.closeLoadError(viewState));
		};
		errorModal = (
			<Layer onEsc={onClose} onClickOutside={onClose}>
				<LoadErrorModal
					error={viewState.loadError}
					warningOnly={!!viewState.loadWarningOnly}
					onClose={onClose}
				/>
			</Layer>
		);
	}

	let mainView;
	if (viewState.game && viewState.viewingGame) {
		const onGameSelect = () => {
			setState(ViewState.goToGameSelect(viewState));
		};
		const onUpdateState = (newState: ViewState.State) => {
			if (newState.game && newState.team !== viewState.team) {
				const hash = serialize(newState.game, newState.team);
				saveHash(hash);
			}
			setState(newState);
		};
		mainView = (
			<GameMain
				state={viewState}
				onGameSelect={onGameSelect}
				onUpdateState={onUpdateState}
			/>
		);
	} else {
		const initialID = viewState.game && viewState.game.id;
		const onSelect = (gameID: GameID) => {
			setState(ViewState.setGameID(viewState, gameID));
		};
		mainView = <GameSelect initialID={initialID} onSelect={onSelect} />;
	}

	return (
		<Grommet theme={grommetTheme}>
			<Box fill align="center">
				<Box width="large">
					{mainView}
					{errorModal}
				</Box>
			</Box>
		</Grommet>
	);
};
export default Main;