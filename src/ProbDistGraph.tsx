import _ from "lodash";
import React, {useRef, useLayoutEffect} from "react";
import * as ProbDist from "./ProbDist";

// Full column width needs to be less than stats table width in CSS.
const LABEL_WIDTH = 12;
const BAR_WIDTH = 56;
const BAR_HEIGHT = 10;
// Minimum bar width that should be drawn to prevent pruning a bar
const BAR_PRUNE_WIDTH = 0.5;
// Feature flag: whether to draw quartiles
// (disabling since visualization needs work)
const DRAW_QUARTILES = false;

type Props = {
	dist: ProbDist.ProbDist;
	curr: number;
};

function pruneDist(props: Props): ProbDist.ProbDist {
	const {dist, curr} = props;
	let minVal = ProbDist.getMin(dist);
	let maxVal = ProbDist.getMax(dist);
	const maxP = ProbDist.getMaxDensity(dist);
	const newDist = _.clone(dist);
	const cutoff = (BAR_PRUNE_WIDTH * maxP) / BAR_WIDTH;
	while (minVal < curr && dist[minVal] < cutoff) {
		delete newDist[minVal];
		minVal += 1;
	}
	while (maxVal > curr && dist[maxVal] < cutoff) {
		delete newDist[maxVal];
		maxVal -= 1;
	}
	return newDist;
}

function drawCanvas(ctx: CanvasRenderingContext2D, props: Props) {
	const {curr, dist: rawDist} = props;
	const dist = pruneDist(props);
	const minVal = ProbDist.getMin(dist);
	const maxVal = ProbDist.getMax(dist);
	const maxP = ProbDist.getMaxDensity(dist);

	ctx.fillStyle = "#FFFFFF";
	ctx.beginPath();
	ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fill();

	if (DRAW_QUARTILES) {
		const firstQ = ProbDist.getValueAtPercentile(rawDist, 0.25);
		const secondQ = ProbDist.getValueAtPercentile(rawDist, 0.5);
		const thirdQ = ProbDist.getValueAtPercentile(rawDist, 0.75);
		const firstQY = (firstQ - minVal) * BAR_HEIGHT + 1;
		const secondQY = (secondQ - minVal) * BAR_HEIGHT + 1;
		const thirdQY = (thirdQ - minVal) * BAR_HEIGHT + 1;
		// Quartile rectangle
		ctx.fillStyle = "#99FFFF";
		ctx.beginPath();
		ctx.rect(0, firstQY, LABEL_WIDTH + BAR_WIDTH, thirdQY - firstQY);
		ctx.fill();
		// Median
		ctx.strokeStyle = "#FFAAAA";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(0, secondQY);
		ctx.lineTo(LABEL_WIDTH + BAR_WIDTH, secondQY);
		ctx.stroke();
		ctx.lineWidth = 1;
	}
	// Highlight current value
	ctx.fillStyle = "#FFDDBB";
	ctx.beginPath();
	ctx.rect(
		0,
		BAR_HEIGHT * (curr - minVal),
		LABEL_WIDTH + BAR_WIDTH,
		BAR_HEIGHT + 1
	);
	ctx.fill();

	for (let i = minVal; i <= maxVal; i += 1) {
		const y = BAR_HEIGHT * (i - minVal) + 1;

		// Labels
		if (i === curr || i % 5 === 0) {
			ctx.fillStyle = i === curr ? "#000000" : "#AAAAAA";
			ctx.font = "10px sans-serif";
			ctx.fillText(String(i), 0, y + BAR_HEIGHT - 2);
		}

		// Bars
		ctx.fillStyle = i === curr ? "#FF7744" : "#4477FF";
		ctx.beginPath();
		ctx.rect(LABEL_WIDTH, y, BAR_WIDTH * (dist[i] / maxP), BAR_HEIGHT - 1);
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

	const dist = pruneDist(props);
	const minVal = ProbDist.getMin(dist);
	const maxVal = ProbDist.getMax(dist);
	const bars = maxVal - minVal + 1;
	return (
		<canvas
			ref={canvasRef}
			width={LABEL_WIDTH + BAR_WIDTH}
			height={BAR_HEIGHT * bars + 1}
		/>
	);
};
export default ProbDistGraph;
