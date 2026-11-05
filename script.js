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
};

// 배경과 게임 요소에 사용할 색을 정합니다.
const colors = {
	side: "#808080",
	road: "#7a8e8e",
	roadFar: "#526465",
	laneLine: "#fff",
	playerBody: "#fff",
	circleObstacle: "#595963",
	squareObstacle: "#4b4b58",
	text: "#fff",
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
