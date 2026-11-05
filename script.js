const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 화면과 게임 요소의 좌표 및 크기를 한곳에서 조정합니다.
const layout = {
	roadX: 150,
	roadY: 0,
	roadWidth: 500,
	roadHeight: 600,
	laneCount: 5,
	laneDashLength: 14,
	playerCenterX: 400,
	playerHeadCenterY: 520,
	playerHeadRadius: 20,
	playerBodyY: 540,
	playerBodySize: 40,
	circleObstacleRadius: 15,
	squareObstacleSize: 30,
	hudY: 20,
	hudPadding: 12,
};

// 배경과 게임 요소에 사용할 색을 정합니다.
const colors = {
	side: "#88bd98",
	road: "#7a8e8e",
	laneLine: "#426f6f",
	playerHead: "#968181",
	playerBody: "#ddd4d4",
	circleObstacle: "#595963",
	squareObstacle: "#4b4b58",
	text: "#fff",
};

// 각 장애물의 위치와 속도를 저장합니다.
const laneWidth = layout.roadWidth / layout.laneCount;
const obstacles = [];
for (let laneIndex = 0; laneIndex < layout.laneCount; laneIndex += 1) {
	const obstacleX = layout.roadX + laneWidth * (laneIndex + 0.5);
	obstacles.push({
		type: "circle",
		x: obstacleX,
		y: 125 - laneIndex * 130,
		size: layout.circleObstacleRadius,
		speed: 1 + Math.random() * 1.5,
	});
	obstacles.push({
		type: "square",
		x: obstacleX,
		y: 185 - laneIndex * 130,
		size: layout.squareObstacleSize,
		speed: 1 + Math.random() * 1.5,
	});
}

function gameLoop() {
	// 지우기: 이전 프레임의 화면을 지웁니다.
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// 계산: 장애물을 아래로 움직이고, 화면 아래로 사라지면 위에서 다시 시작합니다.
	for (const obstacle of obstacles) {
		obstacle.y += obstacle.speed;
		if (obstacle.y + obstacle.size > layout.roadY + layout.roadHeight) {
			obstacle.y = layout.roadY - obstacle.size - Math.random() * 250;
			obstacle.speed = 1.5 + Math.random() * 1.5;
		}
	}

	// 그리기: 배경과 길을 그립니다.
	ctx.fillStyle = colors.side;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = colors.road;
	ctx.fillRect(layout.roadX, layout.roadY, layout.roadWidth, layout.roadHeight);

	// 길을 다섯 개 트랙으로 나누는 점선을 그립니다.
	ctx.strokeStyle = colors.laneLine;
	ctx.lineWidth = 2;
	ctx.setLineDash([layout.laneDashLength, layout.laneDashLength]);
	for (let laneIndex = 1; laneIndex < layout.laneCount; laneIndex += 1) {
		const lineX = layout.roadX + laneWidth * laneIndex;
		ctx.beginPath();
		ctx.moveTo(lineX, layout.roadY);
		ctx.lineTo(lineX, layout.roadY + layout.roadHeight);
		ctx.stroke();
	}
	ctx.setLineDash([]);

	// 원형과 사각형 장애물을 그립니다.
	for (const obstacle of obstacles) {
		if (obstacle.type === "circle") {
			ctx.fillStyle = colors.circleObstacle;
			ctx.beginPath();
			ctx.arc(obstacle.x, obstacle.y, obstacle.size, 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.fillStyle = colors.squareObstacle;
			ctx.fillRect(
				obstacle.x - obstacle.size / 2,
				obstacle.y,
				obstacle.size,
				obstacle.size,
			);
		}
	}

	// 화면 아래 가운데에 플레이어를 그립니다.
	ctx.fillStyle = colors.playerBody;
	ctx.fillRect(
		layout.playerCenterX - layout.playerBodySize / 2,
		layout.playerBodyY,
		layout.playerBodySize,
		layout.playerBodySize,
	);

	ctx.fillStyle = colors.playerHead;
	ctx.beginPath();
	ctx.arc(layout.playerCenterX, layout.playerHeadCenterY, layout.playerHeadRadius, 0, Math.PI * 2);
	ctx.fill();

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
