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
	circleObstacleY: 125,
	circleObstacleRadius: 15,
	squareObstacleY: 185,
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

// 화면 전체를 밝은 회색으로 채워 길 옆 공간을 그립니다.
ctx.fillStyle = colors.side;
ctx.fillRect(0, 0, canvas.width, canvas.height);

// 화면 가운데에 진한 회색 길을 그립니다.
ctx.fillStyle = colors.road;
ctx.fillRect(layout.roadX, layout.roadY, layout.roadWidth, layout.roadHeight);

// 길을 다섯 개 트랙으로 나누는 점선을 그립니다.
const laneWidth = layout.roadWidth / layout.laneCount;
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

// 각 트랙 위쪽에 회색 원형 장애물을 하나씩 그립니다.
ctx.fillStyle = colors.circleObstacle;
for (let laneIndex = 0; laneIndex < layout.laneCount; laneIndex += 1) {
	const obstacleCenterX = layout.roadX + laneWidth * (laneIndex + 0.5);
	ctx.beginPath();
	ctx.arc(obstacleCenterX, layout.circleObstacleY, layout.circleObstacleRadius, 0, Math.PI * 2);
	ctx.fill();
}

// 각 트랙 위쪽에 노란색 사각 장애물을 하나씩 그립니다.
ctx.fillStyle = colors.squareObstacle;
for (let laneIndex = 0; laneIndex < layout.laneCount; laneIndex += 1) {
	const obstacleCenterX = layout.roadX + laneWidth * (laneIndex + 0.5);
	ctx.fillRect(
		obstacleCenterX - layout.squareObstacleSize / 2,
		layout.squareObstacleY,
		layout.squareObstacleSize,
		layout.squareObstacleSize,
	);
}

// 화면 아래 가운데에 흰색 사각형 플레이어 몸체를 그립니다.
ctx.fillStyle = colors.playerBody;
ctx.fillRect(
	layout.playerCenterX - layout.playerBodySize / 2,
	layout.playerBodyY,
	layout.playerBodySize,
	layout.playerBodySize,
);

// 플레이어 몸체 위에 검은색 원형 머리를 그립니다.
ctx.fillStyle = colors.playerHead;
ctx.beginPath();
ctx.arc(layout.playerCenterX, layout.playerHeadCenterY, layout.playerHeadRadius, 0, Math.PI * 2);
ctx.fill();

// 길 위쪽 왼편에 제한시간을 흰 글씨로 표시합니다.
ctx.fillStyle = colors.text;
ctx.font = "16px sans-serif";
ctx.textBaseline = "top";
ctx.textAlign = "left";
ctx.fillText("제한시간 60초", layout.roadX + layout.hudPadding, layout.hudY);

// 길 위쪽 오른편에 과제 완성도를 흰 글씨로 표시합니다.
ctx.textAlign = "right";
ctx.fillText("과제 완성도 100점", layout.roadX + layout.roadWidth - layout.hudPadding, layout.hudY);
