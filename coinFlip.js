let getIsFastModeEnabledCallback = () => false; // Default to fast mode off if not set

// Game State Variables (already global)
let totalFlips = 0;
let headsCount = 0;
let tailsCount = 0;
let currentStreak = 0;
let currentStreakSide = null; // 'Heads' or 'Tails'
const recentResults = [];
const MAX_RECENT_RESULTS = 5;

let luckScore = 0; // 전역 변수로 선언
let correctPredictions = 0; // 전역 변수로 선언
let incorrectPredictions = 0; // 전역 변수로 선언

let currentPrediction = 'Heads'; // 초기값 설정 (Predict Heads가 기본 선택이므로)


// DOM Element References (declared globally, assigned in initCoinFlip)
let coinFlipper;
let coinResultText;
let latestTossResult;
let winnerCoinImage;
let totalFlipsCountElem;
let headsPercentageElem;
let tailsPercentageElem;
let headsBarElem;
let tailsBarElem;
let currentStreakElem;
let luckScoreElem;
let recentResultsListElem;
let coinHeads; // Added global reference for coin-heads
let coinTails; // Added global reference for coin-tails

// Added global references for prediction radios and winner/loser label
let predictHeadsRadio;
let predictTailsRadio;
let winnerLoserLabel;
let winnerAreaDisplay; // Added global reference for the winner area display
let shareBtn; // Added global reference for the share button


const headsImage = 'images/heads.png'; // Now global
const tailsImage = 'images/tails.png'; // Now global

// Animation duration (now global)
const defaultAnimationDuration = 3000; // 3 seconds for example
const fastAnimationDuration = 0; // 0 seconds for fast mode (no animation)

function updateStatsDisplay() {
    totalFlipsCountElem.textContent = totalFlips.toLocaleString();

    const headsPercentage = totalFlips > 0 ? (headsCount / totalFlips) * 100 : 0;
    const tailsPercentage = totalFlips > 0 ? (tailsCount / totalFlips) * 100 : 0;

    headsPercentageElem.textContent = `Heads (${headsPercentage.toFixed(0)}%)`;
    tailsPercentageElem.textContent = `Tails (${tailsPercentage.toFixed(0)}%)`;

    headsBarElem.style.width = `${headsPercentage}%`;
    tailsBarElem.style.width = `${tailsPercentage}%`;

    if (currentStreakSide) {
        currentStreakElem.textContent = `${currentStreak} ${currentStreakSide}`;
        currentStreakElem.classList.remove('text-green-500', 'text-red-500'); // Remove previous colors
        if (currentStreakSide === 'Heads') {
            currentStreakElem.classList.add('text-primary'); // Use primary for heads streak
        } else {
            currentStreakElem.classList.add('text-amber-400'); // Use amber for tails streak
        }
    } else {
        currentStreakElem.textContent = 'N/A';
        currentStreakElem.classList.remove('text-primary', 'text-amber-400');
    }

    // Luck Score will be implemented later, setting to N/A for now
    // luckScoreElem.textContent = 'N/A';
}

function addRecentResult(resultSide) {
    const now = new Date();
    const resultEntry = {
        side: resultSide,
        timestamp: now.toISOString(), // Store as ISO string
        timeAgo: 'Just now' // Will be updated by another function or on display
    };

    recentResults.unshift(resultEntry); // Add to the beginning
    if (recentResults.length > MAX_RECENT_RESULTS) {
        recentResults.pop(); // Remove oldest result
    }

    // Clear current list display
    recentResultsListElem.innerHTML = '';

    // Re-render recent results
    recentResults.forEach(res => {
        const div = document.createElement('div');
        div.classList.add('flex', 'items-center', 'gap-3', 'p-2', 'hover:bg-slate-50', 'dark:hover:bg-slate-800', 'rounded-lg', 'transition-colors', 'cursor-default');

        const iconDiv = document.createElement('div');
        iconDiv.classList.add('size-8', 'rounded-full', 'flex', 'items-center', 'justify-center', 'text-sm');
        if (res.side === 'Heads') {
            iconDiv.classList.add('bg-primary/20', 'text-primary');
            iconDiv.innerHTML = '<span class="material-symbols-outlined">face</span>';
        } else {
            iconDiv.classList.add('bg-amber-400/20', 'text-amber-500');
            iconDiv.innerHTML = '<span class="material-symbols-outlined">pets</span>';
        }

        const textDiv = document.createElement('div');
        textDiv.classList.add('flex-1');
        const pSide = document.createElement('p');
        pSide.classList.add('text-sm', 'font-bold');
        pSide.textContent = res.side;
        const pTime = document.createElement('p');
        pTime.classList.add('text-[10px]', 'text-slate-500');
        // Simple time ago for now, can be made more dynamic later
        const seconds = Math.floor((new Date() - new Date(res.timestamp)) / 1000);
        if (seconds < 60) {
            pTime.textContent = `${seconds} seconds ago`;
        } else if (seconds < 3600) {
            pTime.textContent = `${Math.floor(seconds / 60)} min ago`;
        } else {
            pTime.textContent = `${Math.floor(seconds / 3600)} hour ago`;
        }
        textDiv.appendChild(pSide);
        textDiv.appendChild(pTime);

        div.appendChild(iconDiv);
        div.appendChild(textDiv);
        recentResultsListElem.appendChild(div);
    });
}

// flipCoin function moved to global scope
function flipCoin() {
    if (!coinFlipper) {
        console.error("Coin flipper element not found. Cannot flip coin.");
        return;
    }
    // playCoinFlipSound(); // Removed as per user request

    // Determine current animation duration
    const currentAnimationDuration = getIsFastModeEnabledCallback() ? fastAnimationDuration : defaultAnimationDuration;
    coinFlipper.style.animationDuration = `${currentAnimationDuration}ms`; // Set directly

    // Remove previous animation classes
    coinFlipper.classList.remove('is-flipping-heads', 'is-flipping-tails');
    // Force reflow to restart animation
    void coinFlipper.offsetWidth;

    // Display "Flipping..." immediately
    if (coinResultText) coinResultText.textContent = 'Flipping...';

    // Determine result randomly (0 for heads, 1 for tails)
    const result = Math.floor(Math.random() * 2); // 0 or 1
    const resultSide = result === 0 ? 'Heads' : 'Tails';

    // Update game state
    totalFlips++;
    if (resultSide === 'Heads') {
        headsCount++;
    } else {
        tailsCount++;
    }

    if (currentStreakSide === resultSide) {
        currentStreak++;
    } else {
        currentStreak = 1;
        currentStreakSide = resultSide;
    }


    // Add animation class immediately to start rotation (only if not fast mode)
    if (currentAnimationDuration > 0) { // Only add animation class if duration is not 0
        if (result === 0) { // Heads
            coinFlipper.classList.add('is-flipping-heads');
        } else { // Tails
            coinFlipper.classList.add('is-flipping-tails');
        }
    }


    // Delay the display of the final result until after the animation completes
    setTimeout(() => {
        if (coinResultText) coinResultText.textContent = `${resultSide}!`;
        if (latestTossResult) latestTossResult.textContent = resultSide;
        if (winnerCoinImage) winnerCoinImage.src = resultSide === 'Heads' ? headsImage : tailsImage;

        // Fast Mode일 때 동전 이미지를 직접 업데이트하고 CSS 3D 관련 속성 초기화
        if (currentAnimationDuration === 0) { // Fast Mode
            // 초기화: Fast Mode에서는 CSS 애니메이션 제어를 비활성화
            coinHeads.style.transform = 'rotateY(0deg)'; // Heads가 항상 앞면을 보도록
            coinTails.style.transform = 'rotateY(180deg)'; // Tails가 항상 뒷면을 보도록 (회전하지 않으므로)
            coinHeads.style.backfaceVisibility = 'visible'; // 강제로 보이도록
            coinTails.style.backfaceVisibility = 'visible'; // 강제로 보이도록

            if (resultSide === 'Heads') {
                coinHeads.style.opacity = '1';
                coinTails.style.opacity = '0';
            } else { // resultSide === 'Tails'
                coinHeads.style.opacity = '0';
                coinTails.style.opacity = '1';
            }
        } else { // Normal mode
            // 일반 모드에서는 CSS 애니메이션에 의해 제어되도록 스타일 초기화
            coinHeads.style.opacity = '';
            coinTails.style.opacity = '';
            coinHeads.style.transform = '';
            coinTails.style.transform = '';
            coinHeads.style.backfaceVisibility = '';
            coinTails.style.backfaceVisibility = '';
        }

        // 예측 결과에 따라 Winner/Loser 라벨 업데이트 (및 Luck Score 업데이트)
        // 디버깅을 위한 console.log 추가
        console.log('--- Luck Score Update Check ---');
        console.log('predictHeadsRadio:', predictHeadsRadio);
        console.log('predictTailsRadio:', predictTailsRadio);
        console.log('winnerLoserLabel:', winnerLoserLabel);
        console.log('luckScoreElem:', luckScoreElem);
        console.log('currentPrediction:', currentPrediction); // 추가 (디버깅용)

        if (currentPrediction && winnerLoserLabel && luckScoreElem) { // currentPrediction과 관련 DOM만 유효성 검사
            const predictedSide = currentPrediction; // currentPrediction 사용
            const isWinner = (predictedSide === resultSide);

            if (isWinner) {
                correctPredictions++;
            } else {
                incorrectPredictions++;
            }

            if (totalFlips > 0) {
                luckScore = Math.round((correctPredictions / totalFlips) * 100);
            } else {
                luckScore = 0;
            }
            luckScoreElem.textContent = `${luckScore}/100`;
            console.log('predictedSide:', predictedSide, 'resultSide:', resultSide, 'isWinner:', isWinner);
            console.log('correctPredictions:', correctPredictions, 'totalFlips:', totalFlips, 'luckScore:', luckScore);

            winnerLoserLabel.textContent = isWinner ? 'WINNER' : 'LOSER';
            winnerLoserLabel.classList.remove('bg-green-500', 'bg-red-500');
            winnerLoserLabel.classList.add(isWinner ? 'bg-green-500' : 'bg-red-500');
        } else {
            console.error('One or more required prediction/luck score elements not found or invalid in flipCoin! currentPrediction:', currentPrediction, 'winnerLoserLabel:', winnerLoserLabel, 'luckScoreElem:', luckScoreElem);
        }
        console.log('------------------------------');

        // 동전 뒤집기 후 winner 영역 표시
        if (winnerAreaDisplay && winnerAreaDisplay.classList.contains('hidden')) {
            winnerAreaDisplay.classList.remove('hidden');
        }
        if (winnerLoserLabel && winnerLoserLabel.classList.contains('hidden')) {
            winnerLoserLabel.classList.remove('hidden');
        }
        if (winnerCoinImage && winnerCoinImage.classList.contains('hidden')) {
            winnerCoinImage.classList.remove('hidden');
        }
        if (latestTossResult && latestTossResult.classList.contains('hidden')) {
            latestTossResult.classList.remove('hidden');
        }
        if (shareBtn && shareBtn.classList.contains('hidden')) { // 공유 버튼 표시
            shareBtn.classList.remove('hidden');
        }


        updateStatsDisplay();
        addRecentResult(resultSide);

        // Add other logic here like updating statistics, recent results list, etc.
    }, currentAnimationDuration); // Delay by animation duration
}

export function triggerCoinFlip() {
    flipCoin();
}

export function initCoinFlip(getFastModeCallback) { // Removed getSoundCallback
    if (getFastModeCallback) {
        getIsFastModeEnabledCallback = getFastModeCallback;
    }
    console.log('Coin Flip initialized!');

    // Assign global DOM element references
    coinFlipper = document.getElementById('coin-flipper');
    coinResultText = document.getElementById('coin-result-text');
    latestTossResult = document.getElementById('latest-toss-result');
    winnerCoinImage = document.getElementById('winner-coin-image');
    totalFlipsCountElem = document.getElementById('total-flips-count');
    headsPercentageElem = document.getElementById('heads-percentage');
    tailsPercentageElem = document.getElementById('tails-percentage');
    headsBarElem = document.getElementById('heads-bar');
    tailsBarElem = document.getElementById('tails-bar');
    currentStreakElem = document.getElementById('current-streak');
    luckScoreElem = document.getElementById('luck-score');
    recentResultsListElem = document.getElementById('recent-results-list');
    coinHeads = document.getElementById('coin-heads'); // Get reference
    coinTails = document.getElementById('coin-tails'); // Get reference

    // Get references for prediction radios and winner/loser label
    predictHeadsRadio = document.getElementById('predict-heads-radio');
    console.log('DEBUG: initCoinFlip - predictHeadsRadio assigned:', predictHeadsRadio); // 추가
    predictTailsRadio = document.getElementById('predict-tails-radio');
    console.log('DEBUG: initCoinFlip - predictTailsRadio assigned:', predictTailsRadio); // 추가
    winnerLoserLabel = document.getElementById('winner-loser-label');
    console.log('DEBUG: initCoinFlip - winnerLoserLabel assigned:', winnerLoserLabel); // 추가
    winnerAreaDisplay = document.getElementById('winner-area-display'); // Get reference for the winner area display
    shareBtn = document.getElementById('share-button'); // Get reference for the share button


    // 예측 라디오 버튼 변경 이벤트 리스너 추가
    if (predictHeadsRadio) {
        predictHeadsRadio.addEventListener('change', () => {
            if (predictHeadsRadio.checked) {
                currentPrediction = 'Heads';
                console.log('Prediction set to Heads');
            }
        });
    }
    if (predictTailsRadio) {
        predictTailsRadio.addEventListener('change', () => {
            if (predictTailsRadio.checked) {
                currentPrediction = 'Tails';
                console.log('Prediction set to Tails');
            }
        });
    }

    // 초기 예측 값 설정
    if (predictHeadsRadio && predictHeadsRadio.checked) {
        currentPrediction = 'Heads';
    } else if (predictTailsRadio && predictTailsRadio.checked) {
        currentPrediction = 'Tails';
    }
    console.log('DEBUG: initCoinFlip - Initial currentPrediction:', currentPrediction); // 추가


    // Set initial opacity to ensure elements are visible before Fast Mode logic
    if (coinHeads) coinHeads.style.opacity = '1';
    if (coinTails) coinTails.style.opacity = '1';

    // 명시적 초기화
    luckScore = 0;
    correctPredictions = 0;
    incorrectPredictions = 0;

    // 초기 Luck Score를 0/100으로 설정 (luckScore가 이미 0으로 초기화되어 있음)
    if (luckScoreElem) {
        luckScoreElem.textContent = '0/100'; // luckScore 변수 직접 참조 대신 '0/100' 문자열 사용
        console.log('luckScoreElem successfully initialized to 0/100');
    } else {
        console.error('luckScoreElem not found in initCoinFlip!');
    }

    // Set initial image paths (already global)
    // headsImage = 'images/heads.png';
    // tailsImage = 'images/heads.png';

    // Set CSS variable for animation duration (This is now redundant as style is set directly)
    // document.documentElement.style.setProperty('--animation-duration', `${defaultAnimationDuration}ms`);

    // Initialize display with default values (removed as per user request)
    // updateStatsDisplay();
    // Clear initial example results and add one if needed, or leave empty (removed as per user request)
    recentResults.length = 0; // Clear example results (retained as it clears the array)
    // addRecentResult('Heads'); // Example initial recent result (removed as per user request)
    // addRecentResult('Tails'); // Example initial recent result (removed as user request)


    const flipCoinButton = document.getElementById('flip-coin-button'); // Get the flip coin button
    if (flipCoinButton) {
        flipCoinButton.addEventListener('click', () => {
            console.log('FLIP COIN button clicked!');
            flipCoin();
        });
    }

    // If clicking the coin directly should also flip, this can be added back.
    // if (coinFlipper) {
    //     coinFlipper.addEventListener('click', () => {
    //         console.log('Coin flipper clicked!');
    //         flipCoin();
    //     });
    // }
}