import _ from "lodash";
import React, {useRef, useLayoutEffect} from "react";
import * as ProbDist from "../ProbDist";

export type GraphDims = {
	labelFontSize: number;
	labelHeight: number; // Only used if horizontal is false
	labelWidth: number; // Only has minor use unless horizontal is true
	labelAuxDivisor: number;
	barSize: number;
	barMaxLen: number;
	barSpacing: number;
	barPruneLen: number;
	barMaxCount: number;
	horizontal: boolean;
	bgColor: string;
	barColor: string;
	barFocusColor: string;
	lightFocusColor: string;
	labelLightColor: string;
	labelFocusColor: string;
};

const defaultDims: GraphDims = {
	labelFontSize: 12,
	labelHeight: 13,
	labelWidth: 16,
	labelAuxDivisor: 5,
	barSize: 14,
	barMaxLen: 60,
	barSpacing: 2,
	barPruneLen: 0.5,
	barMaxCount: 0,
	horizontal: false,
	bgColor: "#FFFFFF",
	barColor: "#4477FF",
	barFocusColor: "#FF6633",
	lightFocusColor: "#FFDDBB",
	labelLightColor: "#AAAAAA",
	labelFocusColor: "#444444",
};

export type Props = {
	dist: ProbDist.ProbDist;
	curr: number;
	dims?: Partial<GraphDims>;
};

function pruneDist(props: Props, dims: GraphDims): ProbDist.ProbDist {
	const {dist} = props;
	let minVal = ProbDist.getMin(dist);
	let maxVal = ProbDist.getMax(dist);
	const maxP = ProbDist.getMaxDensity(dist);
	const newDist = _.clone(dist);
	const cutoff = (dims.barPruneLen * maxP) / dims.barMaxLen;
	while (dist[minVal] < cutoff) {
		delete newDist[minVal];
		minVal += 1;
	}
	while (dist[maxVal] < cutoff) {
		delete newDist[maxVal];
		maxVal -= 1;
	}
	if (dims.barMaxCount > 0) {
		while (maxVal - minVal >= dims.barMaxCount) {
			if (newDist[minVal] < newDist[maxVal]) {
				delete newDist[minVal];
				minVal += 1;
			} else {
				delete newDist[maxVal];
				maxVal -= 1;
			}
		}
	}
	return newDist;
}

function getCanvasSize(props: Props): [number, number] {
	const dims = _.extend({}, defaultDims, props.dims || {});
	const dist = pruneDist(props, dims);
	const minVal = ProbDist.getMin(dist);
	const maxVal = ProbDist.getMax(dist);
	const bars = maxVal - minVal + 1;

	const barTotal = dims.barSize + dims.barSpacing;
	const xpadForText = dims.horizontal
		? 0
		: Math.max(0, (dims.labelWidth - barTotal) / 2);

	const crossSize = barTotal * bars + dims.barSpacing + 2 * xpadForText;
	const lenBarSize = dims.barMaxLen;
	const lenLabelSize = dims.horizontal ? dims.labelWidth : dims.labelHeight;
	const lenSize = lenBarSize + lenLabelSize;
	if (dims.horizontal) {
		return [lenSize, crossSize];
	} else {
		return [crossSize, lenSize];
	}
}

function getFloorMult(x: number, div: number): number {
	return x - (((x % div) + div) % div);
}

function shouldLabel(
	x: number,
	curr: number,
	minVal: number,
	maxVal: number,
	dims: GraphDims
): boolean {
	const div = dims.labelAuxDivisor;
	const wouldNotLabel =
		minVal > getFloorMult(maxVal, div) && !(curr >= minVal && curr <= maxVal);
	const omitCloseToCurr =
		!dims.horizontal &&
		curr >= minVal &&
		curr <= maxVal &&
		Math.abs(x - curr) <= 1 &&
		dims.barSize + dims.barSpacing < dims.labelWidth;
	return (
		x === curr ||
		(!omitCloseToCurr && x % div === 0) ||
		(wouldNotLabel && x === minVal)
	);
}

function drawCanvas(ctx: CanvasRenderingContext2D, props: Props) {
	const {curr} = props;
	const dims = _.extend({}, defaultDims, props.dims || {});
	const dist = pruneDist(props, dims);
	const minVal = ProbDist.getMin(dist);
	const maxVal = ProbDist.getMax(dist);
	const maxP = ProbDist.getMaxDensity(dist);

	const barTotal = dims.barSize + dims.barSpacing;
	const xpadForText = dims.horizontal
		? 0
		: Math.max(0, (dims.labelWidth - barTotal) / 2);

	ctx.fillStyle = dims.bgColor;
	ctx.beginPath();
	ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fill();

	// Highlight current value
	if (curr >= minVal && curr <= maxVal) {
		ctx.fillStyle = dims.lightFocusColor;
		ctx.beginPath();
		if (dims.horizontal) {
			ctx.rect(
				0,
				barTotal * (curr - minVal) + dims.barSpacing / 2,
				dims.barMaxLen + dims.labelWidth,
				barTotal
			);
		} else {
			ctx.rect(
				xpadForText + barTotal * (curr - minVal) + dims.barSpacing / 2,
				0,
				barTotal,
				dims.barMaxLen + dims.labelHeight
			);
		}
		ctx.fill();
	}

	for (let i = minVal; i <= maxVal; i += 1) {
		const pos = xpadForText + barTotal * (i - minVal) + dims.barSpacing;

		// Labels
		if (shouldLabel(i, curr, minVal, maxVal, dims)) {
			ctx.fillStyle = i === curr ? dims.labelFocusColor : dims.labelLightColor;
			ctx.font = dims.labelFontSize + "px sans-serif";
			if (dims.horizontal) {
				ctx.fillText(String(i), 0, pos + barTotal - 2);
			} else {
				ctx.textAlign = "center";
				ctx.fillText(
					String(i),
					pos + dims.barSize / 2,
					dims.barMaxLen + dims.labelHeight - 2
				);
			}
		}

		// Bars
		ctx.fillStyle = i === curr ? dims.barFocusColor : dims.barColor;
		ctx.beginPath();
		const barLen = dims.barMaxLen * (dist[i] / maxP);
		if (dims.horizontal) {
			ctx.rect(dims.labelWidth, pos, barLen, dims.barSize);
		} else {
			ctx.rect(pos, dims.barMaxLen - barLen, dims.barSize, barLen);
		}
		ctx.fill();
	}
}

const ProbDistGraph: React.FunctionComponent<Props> = function(props: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useLayoutEffect(() => {
		const ctx = canvasRef.current && canvasRef.current.getContext("2d");
		if (ctx) {
			drawCanvas(ctx, props);
		}
	});

	const [width, height] = getCanvasSize(props);
	return <canvas ref={canvasRef} width={width} height={height} />;
};
export default ProbDistGraph;
