// 나의 기여도 5% 커서의 기여도 95%
// 커서는 신이다.

// 난이도별 설정(크기/점수/페널티)
const DIFFICULTY_SETTINGS = {
    easy: { size: 80, points: 10, penalty: 5 },
    medium: { size: 60, points: 15, penalty: 8 },
    hard: { size: 46, points: 20, penalty: 10 }
};

// 게임 상태 변수
let score = 0;
let timeLeft = 60;
let gameActive = false;
let currentDifficulty = 'hard';
let gameTimer = null;

// DOM 참조 (id 기준)
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const menuEl = document.getElementById('menu');
const gameEl = document.getElementById('game');
const gameArea = document.getElementById('gameArea');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const exitBtn = document.getElementById('exitBtn');
const playBtn = document.getElementById('playBtn');
const bestScoreEl = document.getElementById('bestScore');

// 난이도 버튼은 사용하지 않음(플레이 버튼으로 하드 모드 시작). HTML에서 제거해도 무방합니다.

// 최고점(localStorage)
let bestScore = 0;
try { bestScore = parseInt(localStorage.getItem('aimlab_best') || '0', 10) || 0; } catch (e) { bestScore = 0; }
if (bestScoreEl) bestScoreEl.textContent = bestScore;

// Play 버튼: 하드 모드로 시작
if (playBtn) {
    playBtn.addEventListener('click', () => startGameWithDifficulty('hard'));
}

// 종료/재시작 버튼
if (exitBtn) {
    exitBtn.addEventListener('click', () => {
        if (confirm('게임을 종료하시겠습니까?')) endGame();
    });
}

if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        resetToMenu();
    });
}

// HUD 업데이트
function updateHUD() {
    if (scoreEl) scoreEl.textContent = score;
    if (timeEl) timeEl.textContent = timeLeft;
}

// 선택한 난이도로 게임 시작
function startGameWithDifficulty(difficulty) {
    currentDifficulty = difficulty;
    startGame();
}

// 게임 시작: 초기화 및 타이머/타겟 생성
function startGame() {
    score = 0;
    timeLeft = 60;
    gameActive = true;

    if (menuEl) menuEl.style.display = 'none';
    if (gameOverEl) gameOverEl.style.display = 'none';
    if (gameEl) gameEl.style.display = 'block';

    updateHUD();
    startTimer();

    for (let i = 0; i < 3; i++) spawnTarget();
}

// 타이머 시작
function startTimer() {
    if (gameTimer) clearInterval(gameTimer);

    gameTimer = setInterval(() => {
        timeLeft -= 1;
        updateHUD();
        if (timeLeft <= 0) endGame();
    }, 1000);
}

// 게임 종료 처리
function endGame() {
    gameActive = false;

    if (gameTimer) clearInterval(gameTimer);

    // 모든 타겟 제거
    Array.from(gameArea.getElementsByClassName('target')).forEach(t => t.remove());

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (gameEl) gameEl.style.display = 'none';
    if (gameOverEl) gameOverEl.style.display = 'block';

    if (score > bestScore) {
        bestScore = score;
        if (bestScoreEl) bestScoreEl.textContent = bestScore;
        try { localStorage.setItem('aimlab_best', String(bestScore)); } catch (e) { }
    }
}

// 메뉴로 복귀
function resetToMenu() {
    gameActive = false;
    if (gameTimer) clearInterval(gameTimer);
    Array.from(gameArea.getElementsByClassName('target')).forEach(t => t.remove());
    if (menuEl) menuEl.style.display = 'block';
    if (gameEl) gameEl.style.display = 'none';
    if (gameOverEl) gameOverEl.style.display = 'none';
}

// 타겟 생성: 크기/위치 설정 및 클릭 핸들러 등록
function createTargetElement(difficulty) {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const t = document.createElement('div');
    t.className = `target ${difficulty}`;
    t.style.width = settings.size + 'px';
    t.style.height = settings.size + 'px';

    // 무작위 위치 설정: 게임 영역의 크기를 고려하여 화면 밖으로 나가지 않도록 계산
    const maxX = Math.max(0, gameArea.clientWidth - settings.size);
    const maxY = Math.max(0, gameArea.clientHeight - settings.size);
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    t.style.left = x + 'px';
    t.style.top = y + 'px';

    // 클릭은 버블링을 막고 hitTarget 처리
    t.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!gameActive) return;
        hitTarget(t);
    });

    return t;
}

// 게임 영역에 타겟 추가(최대 3개 유지)
function spawnTarget() {
    if (!gameActive) return;

    const existing = gameArea.getElementsByClassName('target').length;
    if (existing >= 3) return; // 이미 3개면 추가하지 않음

    const t = createTargetElement(currentDifficulty);
    gameArea.appendChild(t);
}

// 타겟 히트 처리: 점수 추가, 클릭 애니메이션 후 제거 및 재스폰
function hitTarget(target) {
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    score += settings.points;
    target.classList.add('clicked');

    // 클릭 애니메이션 후 제거 및 재스폰
    setTimeout(() => {
        if (target.parentNode) target.parentNode.removeChild(target);
        if (gameActive) requestAnimationFrame(spawnTarget);
    }, 120);

    updateHUD();
}

// 빈 공간 클릭 -> MISS 처리 (감점 + 짧은 플래시)
if (gameArea) {
    gameArea.addEventListener('click', (e) => {
        if (!gameActive) return;
        if (e.target === gameArea) {
            const settings = DIFFICULTY_SETTINGS[currentDifficulty];
            score = Math.max(0, score - Math.floor(settings.penalty * 0.5));

            // 빨간 플래시 효과
            const fx = document.createElement('div');
            fx.style.position = 'absolute';
            fx.style.left = '0'; fx.style.top = '0'; fx.style.width = '100%'; fx.style.height = '100%';
            fx.style.background = 'rgba(255,0,0,0.25)'; fx.style.pointerEvents = 'none'; fx.style.zIndex = '1000';
            document.body.appendChild(fx);
            fx.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 220 }).onfinish = () => fx.remove();

            updateHUD();
        }
    });
}

// 창 크기 변경 시 타겟 제거(위치 깨짐 방지)
window.addEventListener('resize', () => {
    Array.from(gameArea.getElementsByClassName('target')).forEach(t => t.remove());
});

// 초기 상태: 메뉴 표시
if (menuEl) menuEl.style.display = 'block';
updateHUD();

// 디버깅용 전역 헬퍼 노출 (콘솔에서 호출 가능)
window._aimlab = { startGame, endGame, spawnTarget, resetToMenu };
