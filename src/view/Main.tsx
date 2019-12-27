import React, {useReducer} from "react";
import {Box, Grommet, Layer, Text} from "grommet";

import {ViewState, ViewAction} from "../state/types";
import {reduceAction} from "../state/Reducer";
import {loadState} from "../state/Create";

import LoadErrorModal from "./LoadErrorModal";
import GameSelect from "./GameSelect";
import GameMain from "./GameMain";

type Props = {
	urlHash: string | null;
};

type ReducerType = (s: ViewState, a: ViewAction) => ViewState;

const grommetTheme: any = {
	global: {
		colors: {
			brand: "#FF6633",
			"neutral-1": "#4477FF",
		},
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
	paragraph: {
		small: {
			maxWidth: "none",
		},
		medium: {
			maxWidth: "none",
		},
		large: {
			maxWidth: "none",
		},
		xlarge: {
			maxWidth: "none",
		},
		xxlarge: {
			maxWidth: "none",
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

const Main: React.FunctionComponent<Props> = function(props: Props) {
	const [viewState, dispatch] = useReducer<ReducerType, string | null>(
		reduceAction,
		props.urlHash,
		loadState
	);

	let errorModal = null;
	if (viewState.loadError) {
		const onClose = () => {
			dispatch({type: "closeLoadError"});
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
		mainView = <GameMain state={viewState} dispatch={dispatch} />;
	} else {
		const initialID = viewState.game && viewState.game.id;
		mainView = <GameSelect initialID={initialID} dispatch={dispatch} />;
	}

	return (
		<Grommet theme={grommetTheme}>
			<Box fill align="center" gap="medium">
				<Box width="large">
					{mainView}
					{errorModal}
				</Box>
				<Box width="medium" margin={{top: "medium"}}>
					<Text size="9px" color="dark-1">
						<em>Fire Emblem</em> is copyrighted by Nintendo and Intelligent
						Systems. This site has no affiliation with the copyright holders.
					</Text>
				</Box>
			</Box>
		</Grommet>
	);
};
export default Main;
