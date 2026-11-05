const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 화면과 게임 요소의 좌표 및 크기를 한곳에서 조정합니다.
const layout = {
	roadX: 150,
	roadY: 0,
	roadWidth: 500,
	roadHeight: 600,
	farRoadWidth: 360,
	laneCount: 5,
	laneDashLength: 14,
	playerCenterX: 400,
	playerBodyY: 540,
	playerBodySize: 40,
	circleObstacleRadius: 15,
	squareObstacleSize: 30,
	obstacleMinScale: 0.45,
	obstacleGapMin: 170,
	obstacleGapMax: 320,
	obstacleSpeed: 2,
	hudY: 20,
	hudPadding: 12,
	// [창문 설정] 왼쪽 벽 창문의 네 꼭짓점 좌표입니다. (오른쪽은 자동으로 좌우 대칭)
	// 순서: [도로쪽-먼 위, 도로쪽-가까운 아래, 바깥쪽-가까운 아래, 바깥쪽-먼 위]
	// 위에서부터 먼 창문 → 가까운 창문 순서이고, 숫자는 [x, y]입니다.
	windowShapes: [
		[[164, 49], [150, 167], [87, 74], [110, -29]],
		[[149, 185], [132, 327], [55, 215], [83, 90]],
		[[127, 365], [107, 541], [12, 403], [47, 249]],
	],
};

// 배경과 게임 요소에 사용할 색을 정합니다.
const colors = {
	side: "#e8e9e6",
	road: "#b6bdcd",
	roadFar: "#828eaa",
	laneLine: "#fff",
	playerBody: "#fff",
	circleObstacle: "#595963",
	squareObstacle: "#4b4b58",
	text: "#fff",
	// [창문 색]
	windowGlass: "#9acff3",
	windowFrame: "#3f4c52",
};

// 각 장애물의 위치와 속도를 저장합니다.
const vanishingX = canvas.width / 2;
const obstacles = [];
for (let laneIndex = 0; laneIndex < layout.laneCount; laneIndex += 1) {
	obstacles.push({
		type: "circle",
		laneIndex,
		y: 0,
		size: layout.circleObstacleRadius,
		speed: layout.obstacleSpeed,
		active: false,
		startDelay: Math.random() * 150,
		minimumGap: getRandomObstacleGap(),
	});
	obstacles.push({
		type: "square",
		laneIndex,
		y: 0,
		size: layout.squareObstacleSize,
		speed: layout.obstacleSpeed,
		active: false,
		startDelay: Math.random() * 150,
		minimumGap: getRandomObstacleGap(),
	});
}

const obstaclesByLane = Array.from({ length: layout.laneCount }, () => []);
for (const obstacle of obstacles) {
	obstaclesByLane[obstacle.laneIndex].push(obstacle);
}

// 깊이에 따라 도로 안에서의 레인 위치와 물체 크기를 계산합니다.
function getPerspectiveDepth(y) {
	return Math.max(0, Math.min(1, y / canvas.height));
}

function getObstacleCenterY(obstacle, y = obstacle.y) {
	return obstacle.type === "circle" ? y : y + obstacle.size / 2;
}

function getObstacleHalfSize(obstacle) {
	return obstacle.type === "circle" ? obstacle.size : obstacle.size / 2;
}

function getRandomObstacleGap() {
	return layout.obstacleGapMin + Math.random() * (layout.obstacleGapMax - layout.obstacleGapMin);
}

function getLaneX(laneIndex, depth) {
	const farRoadLeft = vanishingX - layout.farRoadWidth / 2;
	const farRoadRight = vanishingX + layout.farRoadWidth / 2;
	const roadLeft = farRoadLeft + (layout.roadX - farRoadLeft) * depth;
	const roadRight = farRoadRight + (layout.roadX + layout.roadWidth - farRoadRight) * depth;
	return roadLeft + (roadRight - roadLeft) * (laneIndex + 0.5) / layout.laneCount;
}

let cloudOffsetY = 0;

// ===== 창문 그리기 (v3 창문 스타일 + 꼭짓점 직접 지정) =====
// side: 왼쪽 -1, 오른쪽 1 (오른쪽은 x를 좌우 대칭으로 뒤집어 계산)
function drawWindow(side, shape) {
	const toPoint = ([x, y]) => ({ x: side < 0 ? x : 2 * vanishingX - x, y });
	const [p1, p2, p3, p4] = shape.map(toPoint);

	const tracePath = () => {
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.lineTo(p3.x, p3.y);
		ctx.lineTo(p4.x, p4.y);
		ctx.closePath();
	};

	// 깊이: 창문이 화면 아래쪽일수록 가깝다고 보고 밝게, 위쪽일수록 어둡게 합니다.
	const centerY = (p1.y + p2.y + p3.y + p4.y) / 4;
	const depth = getPerspectiveDepth(centerY);

	// 유리
	tracePath();
	ctx.fillStyle = colors.windowGlass;
	ctx.fill();
	ctx.fillStyle = `rgba(20, 40, 50, ${0.45 * (1 - depth)})`;
	ctx.fill();

	// 유리 안쪽에만 구름을 그려 창밖 풍경을 표현합니다.
	ctx.save();
	tracePath();
	ctx.clip();
	const pointAt = (u, v) => ({
		x: p1.x * (1 - u) * (1 - v) + p2.x * (1 - u) * v + p3.x * u * v + p4.x * u * (1 - v),
		y: p1.y * (1 - u) * (1 - v) + p2.y * (1 - u) * v + p3.y * u * v + p4.y * u * (1 - v),
	});
	const windowWidth = (Math.hypot(p4.x - p1.x, p4.y - p1.y)
		+ Math.hypot(p3.x - p2.x, p3.y - p2.y)) / 2;
	const windowHeight = (Math.hypot(p2.x - p1.x, p2.y - p1.y)
		+ Math.hypot(p3.x - p4.x, p3.y - p4.y)) / 2;
	const windowVerticalSpan = ((p2.y - p1.y) + (p3.y - p4.y)) / 2;
	const cloudShapes = [
		[[-0.34, 0.16, 0.34, 0.38], [-0.16, -0.02, 0.28, 0.66], [0.08, -0.12, 0.34, 0.8], [0.34, 0.08, 0.32, 0.52]],
		[[-0.36, 0.08, 0.31, 0.46], [-0.12, 0.02, 0.37, 0.62], [0.18, -0.08, 0.25, 0.75], [0.38, 0.16, 0.27, 0.36]],
		[[-0.38, 0.14, 0.27, 0.34], [-0.2, -0.1, 0.3, 0.72], [0.1, 0.04, 0.37, 0.5], [0.36, -0.06, 0.29, 0.66]],
	];
	const drawCloud = (u, v, width, height, shape) => {
		const scroll = (cloudOffsetY % windowVerticalSpan) / windowVerticalSpan;
		for (const cycle of [-1, 0, 1]) {
			for (const [offsetX, offsetY, radiusX, radiusY] of shape) {
				const center = pointAt(u + offsetX * width, v + scroll + cycle + offsetY * height);
				ctx.beginPath();
				ctx.ellipse(
					center.x,
					center.y,
					windowWidth * width * radiusX,
					windowHeight * height * radiusY,
					0,
					0,
					Math.PI * 2,
				);
				ctx.fill();
			}
		}
	};
	ctx.fillStyle = `rgba(245, 250, 252, ${0.65 + depth * 0.25})`;
	drawCloud(0.34, 0.28, 0.62, 0.3, cloudShapes[depth < 0.35 ? 0 : 1]);
	drawCloud(0.7, 0.67, 0.48, 0.25, cloudShapes[depth > 0.65 ? 2 : 1]);
	ctx.restore();

	// 창살: 각 변의 중점을 이어 창문과 같이 기울어지게 합니다.
	const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
	const roadSideMid = mid(p1, p2);
	const outerSideMid = mid(p4, p3);
	const farMid = mid(p1, p4);
	const nearMid = mid(p2, p3);
	ctx.strokeStyle = colors.windowFrame;
	ctx.lineWidth = 1.5 + 1.5 * depth;
	ctx.beginPath();
	ctx.moveTo(roadSideMid.x, roadSideMid.y);
	ctx.lineTo(outerSideMid.x, outerSideMid.y);
	ctx.moveTo(farMid.x, farMid.y);
	ctx.lineTo(nearMid.x, nearMid.y);
	ctx.stroke();

	// 창틀
	tracePath();
	ctx.lineWidth = 2.5 + 3 * depth;
	ctx.lineJoin = "round";
	ctx.stroke();
}

function drawWindows() {
	cloudOffsetY += layout.obstacleSpeed;
	for (const shape of layout.windowShapes) {
		drawWindow(-1, shape);
		drawWindow(1, shape);
	}
}
// ===== 창문 그리기 끝 =====

function gameLoop() {
	// 지우기: 이전 프레임의 화면을 지웁니다.
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// 계산: 장애물마다 무작위 대기 후 y=0에서 출발하고, 서로 간격을 유지합니다.
	for (const laneObstacles of obstaclesByLane) {
		for (const obstacle of laneObstacles) {
			const otherObstacle = laneObstacles.find((other) => other !== obstacle);
			if (obstacle.active) {
				obstacle.y += obstacle.speed;
				if (getObstacleCenterY(obstacle) - getObstacleHalfSize(obstacle) > canvas.height) {
					obstacle.active = false;
					obstacle.y = 0;
					obstacle.startDelay = Math.random() * 150;
					obstacle.minimumGap = getRandomObstacleGap();
				}
				continue;
			}

			obstacle.startDelay -= 1;
			const launchCenterY = getObstacleCenterY(obstacle, 0);
			const requiredDistance = getObstacleHalfSize(obstacle)
				+ getObstacleHalfSize(otherObstacle)
				+ obstacle.minimumGap;
			if (obstacle.startDelay <= 0
				&& (!otherObstacle.active
					|| Math.abs(getObstacleCenterY(otherObstacle) - launchCenterY) >= requiredDistance)) {
				obstacle.active = true;
				obstacle.y = 0;
			}
		}
	}

	// 그리기: 배경과 위쪽이 좁은 사다리꼴 도로를 그립니다.
	ctx.fillStyle = colors.side;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const roadGradient = ctx.createLinearGradient(0, layout.roadY, 0, canvas.height);
	roadGradient.addColorStop(0, colors.roadFar);
	roadGradient.addColorStop(1, colors.road);
	ctx.fillStyle = roadGradient;
	ctx.beginPath();
	ctx.moveTo(vanishingX - layout.farRoadWidth / 2, layout.roadY);
	ctx.lineTo(vanishingX + layout.farRoadWidth / 2, layout.roadY);
	ctx.lineTo(layout.roadX + layout.roadWidth, canvas.height);
	ctx.lineTo(layout.roadX, canvas.height);
	ctx.closePath();
	ctx.fill();

	// 벽의 창문을 그립니다.
	drawWindows();

	// 레인 구분선을 흰색으로 그립니다.
	ctx.strokeStyle = colors.laneLine;
	for (let laneIndex = 1; laneIndex < layout.laneCount; laneIndex += 1) {
		let y = layout.roadY;
		while (y < canvas.height) {
			const depth = getPerspectiveDepth(y);
			const dashLength = Math.max(2, layout.laneDashLength * depth);
			const endY = Math.min(y + dashLength, canvas.height);
			ctx.lineWidth = Math.max(1.5, 3 * depth);
			ctx.beginPath();
			ctx.moveTo(getLaneX(laneIndex - 0.5, depth), y);
			ctx.lineTo(getLaneX(laneIndex - 0.5, getPerspectiveDepth(endY)), endY);
			ctx.stroke();
			y = endY + Math.max(2, layout.laneDashLength * depth);
		}
	}

	// 장애물은 원근 레인 위치에 맞춰 그리고, 아래로 내려올수록 기존 크기로 커집니다.
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(vanishingX - layout.farRoadWidth / 2, layout.roadY);
	ctx.lineTo(vanishingX + layout.farRoadWidth / 2, layout.roadY);
	ctx.lineTo(layout.roadX + layout.roadWidth, canvas.height);
	ctx.lineTo(layout.roadX, canvas.height);
	ctx.closePath();
	ctx.clip();
	for (const obstacle of obstacles) {
		if (!obstacle.active) {
			continue;
		}

		const centerY = obstacle.type === "circle" ? obstacle.y : obstacle.y + obstacle.size / 2;
		const depth = getPerspectiveDepth(centerY);
		const obstacleScale = layout.obstacleMinScale + (1 - layout.obstacleMinScale) * depth;
		const renderedSize = obstacle.size * obstacleScale;
		const obstacleX = getLaneX(obstacle.laneIndex, depth);
		if (obstacle.type === "circle") {
			ctx.fillStyle = colors.circleObstacle;
			ctx.beginPath();
			ctx.arc(obstacleX, centerY, renderedSize, 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.fillStyle = colors.squareObstacle;
			ctx.fillRect(
				obstacleX - renderedSize / 2,
				centerY - renderedSize / 2,
				renderedSize,
				renderedSize,
			);
		}
	}
	ctx.restore();

	// 화면 아래 가운데에 플레이어를 그립니다.
	ctx.fillStyle = colors.playerBody;
	ctx.fillRect(
		layout.playerCenterX - layout.playerBodySize / 2,
		layout.playerBodyY,
		layout.playerBodySize,
		layout.playerBodySize,
	);

	// 길 위쪽에 제한시간과 과제 완성도를 표시합니다.
	ctx.fillStyle = colors.text;
	ctx.font = "16px sans-serif";
	ctx.textBaseline = "top";
	ctx.textAlign = "left";
	ctx.fillText("제한시간 60초", layout.roadX + layout.hudPadding, layout.hudY);

	ctx.textAlign = "right";
	ctx.fillText("과제 완성도 100점", layout.roadX + layout.roadWidth - layout.hudPadding, layout.hudY);

	requestAnimationFrame(gameLoop);
}

gameLoop();