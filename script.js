const todayDate = document.querySelector("#today-date");

const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
  .toISOString()
  .slice(0, 10);

todayDate.dateTime = localDate;
todayDate.textContent = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
}).format(today);

const games = {
  "star-rail": {
    title: "붕괴: 스타레일",
    description: "은하를 여행하며 여러 행성의 이야기와 동료들을 만나는 턴제 RPG입니다.",
    url: "https://hsr.hoyoverse.com/ko-kr/home?utm_source=hsrofficialweb&utm_medium=fab&utm_campaign=logo",
  },
  valorant: {
    title: "발로란트",
    description: "개성 있는 요원들의 능력을 활용해 겨루는 5대5 전술 슈팅 게임입니다.",
    url: "https://playvalorant.com/ko-kr/",
  },
  "honkai-impact-3rd": {
    title: "붕괴 3rd",
    description: "발키리들과 함께 붕괴에 맞서 싸우는 액션 RPG입니다.",
    url: "https://honkaiimpact3.hoyoverse.com/kr/ko-kr/home",
  },
};

const gameButtons = document.querySelectorAll(".game");
const gameDetails = document.querySelector("#game-details");
const gameDetailTitle = document.querySelector("#game-detail-title");
const gameDescription = document.querySelector("#game-description");
const officialLink = document.querySelector("#official-link");

gameButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const game = games[button.dataset.game];

    gameButtons.forEach((gameButton) => {
      gameButton.setAttribute("aria-pressed", "false");
    });

    button.setAttribute("aria-pressed", "true");
    gameDetailTitle.textContent = game.title;
    gameDescription.textContent = game.description;
    officialLink.href = game.url;
    gameDetails.hidden = false;
  });
});
