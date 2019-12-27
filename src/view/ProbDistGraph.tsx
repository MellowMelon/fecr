import _ from "lodash";
import React, {useRef, useLayoutEffect} from "react";
import * as ProbDist from "../ProbDist";

export type GraphDims = {
	horizontal: boolean;
	labelFontSize: number;
	labelHeight: number; // Only used if horizontal is false
	labelWidth: number; // Only has minor use unless horizontal is true
	labelAuxDivisor: number;
	barSize: number;
	barMaxLen: number;
	barSpacing: number;
	barPruneLen: number;
	barMinCount: number;
	barMaxCount: number;
	// We use the smallest mark multiple in this list that results in less than
	// the max number of marks.
	axisMarkMultiples: number[];
	axisMarkMax: number;
	axisMarkSize: number;
	axisMarkLabelFontSize: number; // 0 means no labels
	axisMarkLabelWidth: number;
	axisMarkLabelHeight: number;
	bgColor: string;
	barColor: string;
	barFocusColor: string;
	lightFocusColor: string;
	labelLightColor: string;
	labelFocusColor: string;
	axisColor: string;
	axisMarkColor: string;
	axisMarkLabelColor: string;
};

const defaultDims: GraphDims = {
	horizontal: false,
	labelFontSize: 12,
	labelHeight: 13,
	labelWidth: 16,
	labelAuxDivisor: 5,
	barSize: 14,
	barMaxLen: 60,
	barSpacing: 2,
	barPruneLen: 0.5,
	barMinCount: 15,
	barMaxCount: 15,
	axisMarkMultiples: [50, 20, 10, 5, 2, 1],
	axisMarkMax: 2,
	axisMarkSize: 5,
	axisMarkLabelFontSize: 12,
	axisMarkLabelWidth: 24,
	axisMarkLabelHeight: 13,
	bgColor: "#FFFFFF",
	barColor: "#4477FF",
	barFocusColor: "#FF6633",
	lightFocusColor: "#FFDDBB",
	labelLightColor: "#999999",
	labelFocusColor: "#444444",
	axisColor: "#999999",
	axisMarkColor: "#999999",
	axisMarkLabelColor: "#999999",
};

export type Props = {
	dist: ProbDist.ProbDist;
	curr: number;
	dims?: Partial<GraphDims>;
};

function getFloorMult(x: number, div: number): number {
	return x - (((x % div) + div) % div);
}

function pruneDist(
	props: Props,
	dims: GraphDims
): [ProbDist.ProbDist, number, number] {
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
		while (maxVal - minVal + 1 > dims.barMaxCount) {
			if (newDist[minVal] < newDist[maxVal]) {
				delete newDist[minVal];
				minVal += 1;
			} else {
				delete newDist[maxVal];
				maxVal -= 1;
			}
		}
	}
	if (dims.barMinCount > 0 && dims.barMinCount <= dims.barMaxCount) {
		let bumpMin = true;
		while (maxVal - minVal + 1 < dims.barMinCount) {
			if (bumpMin && minVal >= 0) {
				minVal -= 1;
				newDist[minVal] = 0;
			} else {
				maxVal += 1;
				newDist[maxVal] = 0;
			}
			bumpMin = !bumpMin;
		}
	}
	return [newDist, minVal, maxVal];
}

function shouldLabel(
	x: number,
	curr: number,
	minVal: number,
	maxVal: number,
	dims: GraphDims
): boolean {
	const div = dims.labelAuxDivisor;
	// True if no label would be drawn at all without some override.
	const wouldHaveNoLabel =
		minVal > getFloorMult(maxVal, div) && !(curr >= minVal && curr <= maxVal);
	// True if this label is too close to the current value and needs hiding.
	const omitCloseToCurr =
		!dims.horizontal &&
		curr >= minVal &&
		curr <= maxVal &&
		Math.abs(x - curr) <= 1 &&
		dims.barSize + dims.barSpacing < dims.labelWidth;
	return (
		x === curr ||
		(!omitCloseToCurr && x % div === 0) ||
		(wouldHaveNoLabel && x === Math.floor((minVal + maxVal) / 2))
	);
}

// Used internally to hold values derived from dims and props.
type AuxMeasures = {
	minVal: number;
	maxVal: number;
	maxDensity: number;
	markAt: number[];
	axisSize: number;
	xpadForText: number;
	barTotalSize: number;
	firstBarPos: number;
};

function getAuxMeasures(props: Props, dims: GraphDims): AuxMeasures {
	const [prunedDist, minVal, maxVal] = pruneDist(props, dims);
	const maxDensity = ProbDist.getMaxDensity(prunedDist);

	const barTotalSize = dims.barSize + dims.barSpacing;
	const xpadForText = dims.horizontal
		? 0
		: Math.max(0, (dims.labelWidth - barTotalSize) / 2);

	let axisSize = dims.axisMarkSize;
	if (dims.axisMarkLabelFontSize) {
		axisSize += dims.horizontal
			? dims.axisMarkLabelHeight
			: dims.axisMarkLabelWidth;
	}
	const firstBarPos = Math.max(axisSize, xpadForText);

	function getMarkList(markMult: number): number[] {
		const ml = [];
		for (let x = markMult; x <= maxDensity * 100; x += markMult) {
			ml.push(x);
		}
		return ml;
	}

	const markLists = dims.axisMarkMultiples
		.map(getMarkList)
		.filter(ml => ml.length > 0 && ml.length <= dims.axisMarkMax);
	const markAt = _.last(markLists) || [];

	return {
		minVal,
		maxVal,
		maxDensity,
		markAt,
		axisSize,
		xpadForText,
		barTotalSize,
		firstBarPos,
	};
}

function getCanvasSize(props: Props): [number, number] {
	const dims = _.extend({}, defaultDims, props.dims || {});
	const aux = getAuxMeasures(props, dims);

	const crossSize =
		aux.firstBarPos +
		aux.barTotalSize * (aux.maxVal - aux.minVal + 1) +
		aux.xpadForText;
	const lenBarSize = dims.barMaxLen;
	const lenLabelSize = dims.horizontal ? dims.labelWidth : dims.labelHeight;
	const lenSize = lenBarSize + lenLabelSize;
	if (dims.horizontal) {
		return [lenSize, crossSize];
	} else {
		return [crossSize, lenSize];
	}
}

function drawCanvas(ctx: CanvasRenderingContext2D, props: Props) {
	const {curr, dist} = props;
	const dims = _.extend({}, defaultDims, props.dims || {});
	const aux = getAuxMeasures(props, dims);
	const {minVal, maxVal} = aux;

	function getBarPos(value: number): number {
		return aux.firstBarPos + aux.barTotalSize * (value - minVal);
	}

	ctx.fillStyle = dims.bgColor;
	ctx.beginPath();
	ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fill();

	// Axes marks
	ctx.strokeStyle = dims.axisMarkColor;
	if (dims.axisMarkLabelFontSize) {
		ctx.fillStyle = dims.axisMarkLabelColor;
		ctx.font = dims.axisMarkLabelFontSize + "px sans-serif";
		ctx.textAlign = "right";
	}
	ctx.beginPath();
	aux.markAt.forEach(m => {
		const markLen = (dims.barMaxLen * 0.01 * m) / aux.maxDensity;
		if (dims.horizontal) {
			if (dims.axisMarkLabelFontSize) {
				ctx.fillText(m + "%", markLen + dims.labelWidth - 1, aux.firstBarPos);
			}
			ctx.moveTo(
				markLen + dims.labelWidth,
				aux.firstBarPos - dims.axisMarkSize
			);
			ctx.lineTo(markLen + dims.labelWidth, getBarPos(maxVal + 1));
		} else {
			if (dims.axisMarkLabelFontSize) {
				ctx.fillText(
					m + "%",
					aux.firstBarPos,
					dims.barMaxLen - markLen + dims.axisMarkLabelHeight - 4
				);
			}
			ctx.moveTo(aux.firstBarPos - dims.axisMarkSize, dims.barMaxLen - markLen);
			ctx.lineTo(getBarPos(maxVal + 1), dims.barMaxLen - markLen);
		}
	});
	ctx.stroke();

	// Highlight current value
	if (curr >= minVal && curr <= maxVal) {
		ctx.fillStyle = dims.lightFocusColor;
		ctx.beginPath();
		if (dims.horizontal) {
			ctx.rect(
				0,
				getBarPos(curr),
				dims.barMaxLen + dims.labelWidth,
				aux.barTotalSize
			);
		} else {
			ctx.rect(
				getBarPos(curr),
				0,
				aux.barTotalSize,
				dims.barMaxLen + dims.labelHeight
			);
		}
		ctx.fill();
	}

	// Axes
	ctx.strokeStyle = dims.axisColor;
	ctx.beginPath();
	if (dims.horizontal) {
		ctx.moveTo(ctx.canvas.width, aux.firstBarPos);
		ctx.lineTo(dims.labelWidth, aux.firstBarPos);
		ctx.lineTo(dims.labelWidth, getBarPos(maxVal + 1));
	} else {
		ctx.moveTo(aux.firstBarPos, 0);
		ctx.lineTo(aux.firstBarPos, dims.barMaxLen);
		ctx.lineTo(getBarPos(maxVal + 1), dims.barMaxLen);
	}
	ctx.stroke();

	for (let i = minVal; i <= maxVal; i += 1) {
		const pos = getBarPos(i) + dims.barSpacing / 2;
		const distProp = (dist[i] || 0) / aux.maxDensity;

		// Labels
		if (shouldLabel(i, curr, minVal, maxVal, dims)) {
			ctx.fillStyle = i === curr ? dims.labelFocusColor : dims.labelLightColor;
			ctx.font = dims.labelFontSize + "px sans-serif";
			if (dims.horizontal) {
				ctx.fillText(String(i), 0, pos + aux.barTotalSize - 2);
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
		const barLen = dims.barMaxLen * distProp;
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
