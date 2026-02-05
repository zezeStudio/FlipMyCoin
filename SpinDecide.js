// JavaScript for SpinDecide.html
console.log("SpinDecide.js loaded");

let wheelItems = [];
let rouletteHistory = {}; // For statistics and history

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const spindecideGuideNavLink = document.getElementById('spindecide-guide-nav-link');
    const spindecideGuideModal = document.getElementById('spindecide-guide-modal');
    const spindecideModalCloseButton = document.getElementById('spindecide-modal-close-button');

    const spinnerWheel = document.getElementById('spinner-wheel');
    const wheelTextCanvas = document.getElementById('wheel-text-canvas');
    const canvasContext = wheelTextCanvas ? wheelTextCanvas.getContext('2d') : null;
    const entriesTextarea = document.getElementById('entries-textarea');
    const entriesCountElem = document.getElementById('entries-count');
    const spinButton = document.getElementById('spin-button');
    const shuffleButton = document.getElementById('shuffle-button');
    const sortButton = document.getElementById('sort-button');
    
    const confirmEntriesButton = document.getElementById('confirm-entries-button'); 
    const singleEntryAddButton = document.getElementById('single-entry-add-button');
    const singleEntryListContainer = document.getElementById('single-entry-list-container');

    const singleEntryModeToggle = document.getElementById('single-entry-mode-toggle');
    const singleEntryInputContainer = document.getElementById('single-entry-input-container');
    const singleEntryInput = document.getElementById('single-entry-input');

    const ratioFreeModeToggle = document.getElementById('ratio-free-mode-toggle');
    const totalPercentageDisplay = document.getElementById('total-percentage-display');

    const spinResultModal = document.getElementById('spin-result-modal');
    const spinResultText = document.getElementById('spin-result-text');
    const spinResultCloseButton = document.getElementById('spin-result-close-button');
    const spinResultDisplayArea = document.getElementById('spin-result-display-area');

    // History and Statistics Elements
    const historyButton = document.getElementById('history-button');
    const historyModal = document.getElementById('history-modal');
    const historyModalCloseButton = document.getElementById('history-modal-close-button');
    const statsTotalSpins = document.getElementById('stats-total-spins');
    const statsList = document.getElementById('stats-list');
    const statsResetButton = document.getElementById('stats-reset-button');
    

    // --- Configuration ---
    const wheelColors = [
        '#ef4444', // red-500
        '#f97316', // orange-500
        '#f4d125', // yellow-500 - Adjusted from tailwind.config's primary
        '#22c55e', // green-500
        '#06b6d4', // cyan-500
        '#3b82f6', // blue-500
        '#a855f7', // purple-500
        '#ec4899'  // pink-500
    ];

    const MIN_ENTRIES = 2; // Minimum number of entries required
    const MAX_ENTRIES = 10; // Maximum number of entries allowed

    const MIN_SPIN_DURATION = 2000; // Minimum spin duration in milliseconds (2 seconds)
    const MAX_SPIN_DURATION = 4000; // Maximum spin duration in milliseconds (4 seconds)

    let currentRotation = 0; // To keep track of the wheel's current rotation for smooth transitions
    let isConfirmed = false; // New state variable for entry confirmation

    // --- History & Statistics Functions ---
    function getSetKey(items) {
        if (!items || items.length === 0) {
            return '';
        }
        return items
            .map(i => i.name)
            .sort() // Sort alphabetically to treat same set of items as one key
            .join('|');
    }

    function updateStatsUI() {
        const validEntries = getValidWheelEntries();
        const key = getSetKey(validEntries);
        const stats = rouletteHistory[key];

        if (!stats || stats.total === 0) {
            statsTotalSpins.textContent = '0';
            statsList.innerHTML = `<p class="text-center text-slate-500 p-4">No spins recorded for this set of entries yet.</p>`;
            return;
        }

        statsTotalSpins.textContent = stats.total;
        
        // Sort entries by win count, descending
        const sortedEntries = validEntries
            .map(entry => ({
                name: entry.name,
                count: stats.results[entry.name] || 0
            }))
            .sort((a, b) => b.count - a.count);

        statsList.innerHTML = sortedEntries.map(entry => {
            const percentage = ((entry.count / stats.total) * 100).toFixed(1);
            return `
                <div class="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div class="flex-1 truncate font-semibold">${entry.name}</div>
                    <div class="w-1/4 text-center text-primary font-bold">${entry.count} wins</div>
                    <div class="w-1/4 text-right text-slate-500">${percentage}%</div>
                </div>
            `;
        }).join('');
    }

    function resetCurrentStats() {
        const key = getSetKey(getValidWheelEntries());
        if (rouletteHistory[key]) {
            delete rouletteHistory[key];
            localStorage.setItem('rouletteHistory', JSON.stringify(rouletteHistory));
            updateStatsUI();
            alert('Statistics for the current set of entries have been reset.');
        } else {
            alert('There are no statistics to reset for the current entries.');
        }
    }


    // --- Helper Functions ---
    function parseTextareaToWheelItems(textareaValue) {
        const rawLines = textareaValue.split('\n'); // DO NOT TRIM YET
        const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';

        return rawLines.map(line => { // Use 'line' for original input
            const trimmedLine = line.trim(); // Trim for internal parsing
            let name = trimmedLine;
            let ratio = 1;

            let explicitRatio = false;
            if (isRatioFreeMode) {
                const parts = trimmedLine.split(':');
                if (parts.length > 1) {
                    name = parts[0].trim();
                    const parsedRatio = parseInt(parts[1].trim(), 10);
                    if (!isNaN(parsedRatio) && parsedRatio >= 0 && parsedRatio <= 100) {
                        ratio = parsedRatio;
                        explicitRatio = true; // Ratio was explicitly provided and valid
                    } else {
                        ratio = 1; // Invalid ratio specified, default to 1 for calculation
                        explicitRatio = true; // User tried to input a ratio, even if invalid
                        console.warn(`Invalid percentage for entry "${trimmedLine}". Defaulting to 1 for calculation.`);
                    }
                } else {
                    ratio = 1; // No ratio specified, default to 1
                    // explicitRatio remains false
                }
            }
            return { name, ratio, explicitRatio, rawInput: line }; // Store original 'line' as rawInput
        });
    }

    // Returns only valid entries that should be displayed on the wheel and used for spinning logic
    function getValidWheelEntries() {
        return wheelItems.filter(entry => entry.name !== '' && entry.ratio > 0);
    }

    // Helper function to reset the Confirm Entries button and related states
    function resetConfirmButtonState() {
        if (isConfirmed) { // Only reset if currently confirmed
            isConfirmed = false;
            confirmEntriesButton.innerHTML = `<span class="material-symbols-outlined">check</span> Confirm Entries`;
            confirmEntriesButton.classList.remove('bg-red-500');
            confirmEntriesButton.classList.add('bg-primary');
            confirmEntriesButton.dataset.action = 'confirm'; // Reset data-action attribute
            // Re-enable shuffle/sort buttons
            shuffleButton.disabled = false;
            sortButton.disabled = false;
            shuffleButton.classList.remove('opacity-50', 'cursor-not-allowed');
            sortButton.classList.remove('opacity-50', 'cursor-not-allowed');
            // Disable spin button
            spinButton.disabled = true;
            spinButton.classList.add('opacity-50', 'cursor-not-allowed');

            // If Single Entry Mode is OFF (i.e., we are in multi-line mode and textarea is editable)
            // make sure textarea is editable and its background is reset
            const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';
            if (!isSingleEntryMode) {
                entriesTextarea.readOnly = false;
                entriesTextarea.style.backgroundColor = '';
                entriesTextarea.style.opacity = '1';
            }
        }
        // NEW: Clear and hide the spin result display area
        if (spinResultDisplayArea) {
            spinResultDisplayArea.textContent = '';
            spinResultDisplayArea.classList.add('hidden');
        }
        updateEntriesCount(); // Call this to ensure spin button state is correct after reset
    }

    // Renders the list of individual entries in Single Entry Mode
    function renderSingleEntryList() {
        if (!singleEntryListContainer) return;

        singleEntryListContainer.innerHTML = ''; // Clear existing entries
        // Explicitly remove conflicting initial classes from HTML
        singleEntryListContainer.classList.remove('flex-col', 'gap-2', 'mt-4'); // Remove potentially conflicting classes
        // Add the correct classes for horizontal flow and wrapping
        singleEntryListContainer.classList.add('flex', 'flex-wrap', 'gap-2', 'mt-2'); // Add gap and top margin for spacing

        wheelItems.forEach((entry, index) => {
            const entryWrapper = document.createElement('div'); // A wrapper for each entry + delete button
            entryWrapper.classList.add(
                'flex', 'items-center', // Align text and delete button horizontally
                'bg-slate-100', 'dark:bg-slate-700',
                'text-slate-900', 'dark:text-white',
                'rounded-full', // Make it pill-shaped
                'px-2', 'py-0.5', // Compact padding, adjusted for better fit
                'text-sm', // Smaller font size for the entry text
                'font-medium',
                'whitespace-nowrap' // Prevent entry text from wrapping within itself
            );
            entryWrapper.setAttribute('data-index', index);

            const entryText = document.createElement('span');
            entryText.textContent = entry.name;
            // entryText.classList.add('truncate'); // No need for truncate if wrapping is handled by flex-wrap

            const deleteButton = document.createElement('button');
            deleteButton.classList.add(
                'ml-1', // Small margin between text and delete icon
                'p-0.5', // Smaller padding for the delete button
                'rounded-full',
                'hover:bg-red-500/20', 'transition-colors'
            );
            deleteButton.innerHTML = `<span class="material-symbols-outlined text-red-500 text-xs">close</span>`; // Even smaller icon
            deleteButton.addEventListener('click', (event) => {
                const itemIndex = parseInt(event.currentTarget.closest('[data-index]').dataset.index);
                deleteSingleEntry(itemIndex);
            });

            entryWrapper.appendChild(entryText);
            entryWrapper.appendChild(deleteButton);
            singleEntryListContainer.appendChild(entryWrapper);
        });
    }

    // Deletes an entry from the wheelItems array and updates the UI
    function deleteSingleEntry(indexToDelete) {
        if (isConfirmed) {
            alert('Please cancel confirmation to delete entries.');
            return;
        }
        wheelItems.splice(indexToDelete, 1); // Remove entry from array
        syncTextareaWithWheelItems(); // Update textarea, wheel, and re-render list
    }

    // Syncs the textarea content with the current wheelItems array
    function syncTextareaWithWheelItems() {
        const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';
        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';

        let textValue;
        if (isRatioFreeMode && !isSingleEntryMode) {
            // In Ratio Free Mode, display the raw input from the user
            textValue = wheelItems.map(entry => entry.rawInput).join('\n');
        } else {
            // In default mode, just display the name
            textValue = wheelItems.map(entry => entry.name).join('\n');
        }
        
        entriesTextarea.value = textValue;
        updateEntriesCount();
        generateWheel();
        updateTotalPercentageDisplay();
        
        if (isSingleEntryMode) {
            renderSingleEntryList();
        }

        // Update stats UI if modal is open
        if (historyModal && !historyModal.classList.contains('hidden')) {
            updateStatsUI();
        }
    }

    function updateEntriesCount() {
        // Only count entries with a ratio > 0, as these are the ones that participate in the wheel
        const numEntries = getValidWheelEntries().length;

        entriesCountElem.textContent = `${numEntries} Entries`;

        // Update color based on min/max entries
        if (numEntries < MIN_ENTRIES || numEntries > MAX_ENTRIES) {
            entriesCountElem.classList.remove('text-primary');
            entriesCountElem.classList.add('text-red-500');
        } else {
            entriesCountElem.classList.remove('text-red-500');
            entriesCountElem.classList.add('text-primary');
        }

        // Disable/Enable spin button based on entry count AND confirmation status
        if (numEntries < MIN_ENTRIES || !isConfirmed) {
            spinButton.disabled = true;
            spinButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            spinButton.disabled = false;
            spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        // Disable/Enable add single entry button based on max entry count
        if (numEntries >= MAX_ENTRIES) {
            singleEntryAddButton.disabled = true;
            singleEntryAddButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            singleEntryAddButton.disabled = false;
            singleEntryAddButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        // Disable/Enable confirm entries button based on max entry count
        if (numEntries > MAX_ENTRIES) { 
             confirmEntriesButton.disabled = true;
             confirmEntriesButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
             confirmEntriesButton.disabled = false;
             confirmEntriesButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    function updateTotalPercentageDisplay() {
        const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';
        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';

        if (!isRatioFreeMode || isSingleEntryMode) { 
            totalPercentageDisplay.classList.add('hidden');
            return;
        }

        totalPercentageDisplay.classList.remove('hidden');
        const totalPercentage = getValidWheelEntries().reduce((sum, entry) => sum + entry.ratio, 0);

        totalPercentageDisplay.textContent = `Total: ${totalPercentage}%`;
        if (totalPercentage === 100) {
            totalPercentageDisplay.classList.remove('text-red-500');
            totalPercentageDisplay.classList.add('text-primary');
        } else {
            totalPercentageDisplay.classList.remove('text-primary');
            totalPercentageDisplay.classList.add('text-red-500');
        }
    }

    function generateWheel() {
        const canvas = wheelTextCanvas;
        const ctx = canvasContext;

        if (!ctx || !canvas) return;

        const size = spinnerWheel.offsetWidth;
        canvas.width = size;
        canvas.height = size;

        const center = size / 2;
        const radius = center;

        ctx.clearRect(0, 0, size, size);

        let entriesToDraw = getValidWheelEntries();
        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';

        if (isSingleEntryMode) {
            entriesToDraw = entriesToDraw.map(entry => ({ ...entry, ratio: 1 }));
        }

        const items = entriesToDraw.map(entry => ({
            text: entry.name,
            percent: entry.ratio,
            scale: 1
        }));

        const count = items.length;
        if (count === 0) {
            spinnerWheel.style.background = 'conic-gradient(#1e293b, #334155)';
            return;
        }
        spinnerWheel.style.background = 'none';

        let currentStartAngleDegrees = 0;

        const total = items.reduce((s, item) => s + (item.percent || 0), 0);
        if (total === 0 && count > 0) {
            console.warn("Total percentage is zero, but entries exist. Displaying equal slices.");
            items.forEach(item => item.percent = 1);
            total = count;
        }


        items.forEach((item, i) => {
            const sliceAngleDegrees = (item.percent / total) * 360;
            const endAngleDegrees = currentStartAngleDegrees + sliceAngleDegrees;

            const startAngleRadians = currentStartAngleDegrees * (Math.PI / 180);
            const endAngleRadians = endAngleDegrees * (Math.PI / 180);

            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngleRadians, endAngleRadians);
            ctx.closePath();

            ctx.fillStyle = wheelColors[i % wheelColors.length];
            ctx.fill();

            const midAngleDegrees = currentStartAngleDegrees + sliceAngleDegrees / 2;
            const midAngleRadians = midAngleDegrees * (Math.PI / 180);
            const textR = radius * 0.65;

            ctx.save();
            ctx.translate(
                center + Math.cos(midAngleRadians) * textR,
                center + Math.sin(midAngleRadians) * textR
            );

            ctx.rotate(midAngleRadians);

            if (midAngleDegrees > 90 && midAngleDegrees < 270) {
                ctx.rotate(Math.PI);
            }

            const baseSize = radius / 10;
            ctx.font = `bold ${baseSize * (item.scale || 1)}px Arial`;
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(item.text, 0, 0);

            if (item.text === '6' || item.text === '9') {
                const textWidth = ctx.measureText(item.text).width;
                const underlineThickness = baseSize / 10;
                const underlineOffset = baseSize * 0.75;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(-textWidth / 2, underlineOffset);
                ctx.lineTo(textWidth / 2, underlineOffset);
                ctx.lineWidth = underlineThickness;
                ctx.strokeStyle = ctx.fillStyle;
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();

            currentStartAngleDegrees = endAngleDegrees;
        });
    }

    function spinWheel() {
        let entries = getValidWheelEntries();
        const numEntries = entries.length;

        if (numEntries < MIN_ENTRIES) {
            alert(`Please add at least ${MIN_ENTRIES} entries to spin the wheel.`);
            return;
        }

        if (!isConfirmed) {
            alert('Please confirm your entries before spinning the wheel.');
            return;
        }

        const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';
        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';

        if (isSingleEntryMode) {
            entries = entries.map(entry => ({ ...entry, ratio: 1 }));
        }
        
        if (isRatioFreeMode && !isSingleEntryMode) {
            const totalPercentage = entries.reduce((sum, entry) => sum + entry.ratio, 0);
            if (totalPercentage !== 100) {
                alert('In Ratio Free Mode, the total percentage of entries must sum to 100% to spin the wheel.');
                return;
            }
        }

        spinButton.disabled = true;
        spinButton.classList.add('opacity-50', 'cursor-not-allowed');

        const totalRatio = entries.reduce((sum, entry) => sum + entry.ratio, 0);
        
        let randomValue = Math.random() * totalRatio;
        let winningIndex = -1;
        let cumulativeRatio = 0;
        for (let i = 0; i < entries.length; i++) {
            cumulativeRatio += entries[i].ratio;
            if (randomValue < cumulativeRatio) {
                winningIndex = i;
                break;
            }
        }
        const winningEntry = entries[winningIndex];

        if (winningIndex === -1) {
            console.error("Weighted random selection failed to find a winning entry.");
            alert("Could not determine a winner. Please check your entries.");
            spinButton.disabled = false;
            spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
            return;
        }

        const anglePerRatioUnit = 360 / totalRatio;

        let winningSegmentStartAngle = 0;
        for (let i = 0; i < winningIndex; i++) {
            winningSegmentStartAngle += entries[i].ratio * anglePerRatioUnit;
        }
        const winningSegmentEndAngle = winningSegmentStartAngle + (winningEntry.ratio * anglePerRatioUnit);

        const randomAngleWithinSegment = Math.random() * (winningEntry.ratio * anglePerRatioUnit);
        const targetLandingAngle = winningSegmentStartAngle + randomAngleWithinSegment;

        const fullRotationsForEffect = 5;
        let rotationToAlign = 270 - targetLandingAngle;
        rotationToAlign = (rotationToAlign % 360 + 360) % 360; 
        
        const finalRotation = currentRotation + (fullRotationsForEffect * 360) + rotationToAlign - (currentRotation % 360);

        const spinDuration = Math.random() * (MAX_SPIN_DURATION - MIN_SPIN_DURATION) + MIN_SPIN_DURATION;
        const spinDurationSeconds = spinDuration / 1000;

        spinnerWheel.style.transition = `transform ${spinDurationSeconds}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        spinnerWheel.style.transform = `rotate(${finalRotation}deg)`;
        currentRotation = finalRotation;

        setTimeout(() => {
            // --- Update History & Statistics ---
            const key = getSetKey(entries);
            if (!rouletteHistory[key]) {
                rouletteHistory[key] = { total: 0, results: {} };
            }
            rouletteHistory[key].total++;
            const winnerName = winningEntry.name;
            rouletteHistory[key].results[winnerName] = (rouletteHistory[key].results[winnerName] || 0) + 1;
            localStorage.setItem('rouletteHistory', JSON.stringify(rouletteHistory));
            // --- End Update ---

            let formattedWinningEntry = winnerName;
            if (winnerName === '6' || winnerName === '9') {
                formattedWinningEntry = `<u>${winnerName}</u>`;
            }

            if (spinResultText) {
                spinResultText.innerHTML = formattedWinningEntry;
            } else {
                console.error("Error: spinResultText element not found in setTimeout callback.");
            }
            spinResultModal.classList.remove('hidden');
            
            if (spinResultDisplayArea) {
                let formattedDisplayEntry = winnerName;
                if (winnerName === '6' || winnerName === '9') {
                    formattedDisplayEntry = `<u>${winnerName}</u>`;
                }
                spinResultDisplayArea.innerHTML = `Winner: ${formattedDisplayEntry}`;
                spinResultDisplayArea.classList.remove('hidden');
            }
            
            spinButton.disabled = false;
            spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
            spinnerWheel.style.transition = 'none';

            // Update stats UI if modal is open
            if (historyModal && !historyModal.classList.contains('hidden')) {
                updateStatsUI();
            }

        }, spinDuration);
    }

    function shuffleEntries() {
        if (isConfirmed) return;

        for (let i = wheelItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wheelItems[i], wheelItems[j]] = [wheelItems[j], wheelItems[i]];
        }

        syncTextareaWithWheelItems();
    }

    function sortEntries() {
        if (isConfirmed) return;

        wheelItems.sort((a, b) => a.name.localeCompare(b.name));
        syncTextareaWithWheelItems();
    }

    function addSingleEntry() {
        if (wheelItems.length >= MAX_ENTRIES) {
            alert(`You can add a maximum of ${MAX_ENTRIES} entries.`);
            return;
        }
        if (isConfirmed) {
            alert('Please cancel confirmation to add new entries.');
            return;
        }

        let newEntryText = singleEntryInput.value.trim();
        if (newEntryText) {
            let newEntryName = newEntryText;
            if (newEntryText.includes(':')) {
                newEntryName = newEntryText.split(':')[0].trim();
            }

            wheelItems.push({ name: newEntryName, ratio: 1 });
            singleEntryInput.value = '';
            syncTextareaWithWheelItems();
            singleEntryInput.focus();
        } else {
            alert('Please enter an entry in the single input field.');
        }
    }

    function handleConfirmEntries() {
        const entries = getValidWheelEntries();
        const numEntries = entries.length;

        if (!isConfirmed) {
            if (numEntries < MIN_ENTRIES) {
                alert(`Please add at least ${MIN_ENTRIES} entries before confirming.`);
                return;
            }

            const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';
            const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';
            if (isRatioFreeMode && !isSingleEntryMode) {
                const totalPercentage = entries.reduce((sum, entry) => sum + entry.ratio, 0);
                if (totalPercentage !== 100) {
                    alert('In Ratio Free Mode, the total percentage of entries must sum to 100% before confirming.');
                    return;
                }
            }
        }
        
        isConfirmed = !isConfirmed;

        if (isConfirmed) {
            entriesTextarea.readOnly = true;
            entriesTextarea.style.backgroundColor = 'var(--background-light)';
            entriesTextarea.style.opacity = '0.7';

            shuffleButton.disabled = true;
            sortButton.disabled = true;
            shuffleButton.classList.add('opacity-50', 'cursor-not-allowed');
            sortButton.classList.add('opacity-50', 'cursor-not-allowed');

            confirmEntriesButton.innerHTML = `<span class="material-symbols-outlined">close</span> Cancel`;
            confirmEntriesButton.classList.remove('bg-primary');
            confirmEntriesButton.classList.add('bg-red-500');

            if (entries.length >= MIN_ENTRIES) {
                spinButton.disabled = false; 
                spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        } else {
            const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';
            if (!isSingleEntryMode) {
                entriesTextarea.readOnly = false;
                entriesTextarea.style.backgroundColor = '';
                entriesTextarea.style.opacity = '1';
            }
            shuffleButton.disabled = false;
            sortButton.disabled = false;
            shuffleButton.classList.remove('opacity-50', 'cursor-not-allowed');
            sortButton.classList.remove('opacity-50', 'cursor-not-allowed');

            confirmEntriesButton.innerHTML = `<span class="material-symbols-outlined">check</span> Confirm Entries`;
            confirmEntriesButton.classList.remove('bg-red-500');
            confirmEntriesButton.classList.add('bg-primary');

            spinButton.disabled = true;
            spinButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        updateEntriesCount();
        generateWheel();
        updateTotalPercentageDisplay();
    }


    // --- Toggle Logic ---
    function toggleSingleEntryMode() {
        if (isConfirmed) {
            resetConfirmButtonState();
        }
        if (spinResultDisplayArea) {
            spinResultDisplayArea.textContent = '';
            spinResultDisplayArea.classList.add('hidden');
        }

        const isToggledBeforeClick = singleEntryModeToggle.dataset.toggled === 'true';
        const newIsToggled = !isToggledBeforeClick;

        singleEntryModeToggle.dataset.toggled = newIsToggled;
        
        singleEntryModeToggle.classList.toggle('bg-primary', newIsToggled);
        singleEntryModeToggle.classList.toggle('bg-primary/30', !newIsToggled);
        singleEntryModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', newIsToggled);

        singleEntryInputContainer.classList.toggle('hidden', !newIsToggled);
        entriesTextarea.readOnly = newIsToggled;

        singleEntryAddButton.classList.toggle('hidden', !newIsToggled);
        singleEntryListContainer.classList.toggle('hidden', !newIsToggled);

        entriesTextarea.value = '';
        wheelItems = [];

        if (newIsToggled) {
            entriesTextarea.style.backgroundColor = 'var(--background-light)';
            entriesTextarea.style.opacity = '0.7';
            singleEntryInput.focus();

            const wasRatioFreeModeOn = ratioFreeModeToggle.dataset.toggled === 'true';
            ratioFreeModeToggle.disabled = true;
            ratioFreeModeToggle.dataset.toggled = 'false';
            ratioFreeModeToggle.classList.remove('bg-primary');
            ratioFreeModeToggle.classList.add('bg-primary/30');
            ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');
            document.getElementById('ratio-free-desc').textContent = 'Forced to equal proportions';
            singleEntryInput.placeholder = 'Enter one entry';
            totalPercentageDisplay.classList.add('hidden');

            if (wasRatioFreeModeOn) {
                alert('Single Entry Mode is ON. Ratio Free Mode has been disabled.');
            }

            syncTextareaWithWheelItems();
            renderSingleEntryList();
        } else {
            entriesTextarea.style.backgroundColor = '';
            entriesTextarea.style.opacity = '1';
            entriesTextarea.focus();

            ratioFreeModeToggle.disabled = false;
            ratioFreeModeToggle.dataset.toggled = 'false';
            ratioFreeModeToggle.classList.remove('bg-primary');
            ratioFreeModeToggle.classList.add('bg-primary/30');
            ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');
            document.getElementById('ratio-free-desc').textContent = 'Define custom ratios for entries';
            
            singleEntryInput.placeholder = 'Enter one entry';
            entriesTextarea.placeholder = 'Type entries here... (one per line)';

            confirmEntriesButton.classList.remove('hidden'); 

            syncTextareaWithWheelItems();
            singleEntryListContainer.innerHTML = '';
        }
        generateWheel(); 
    }

    function toggleRatioFreeMode() {
        if (isConfirmed) {
            resetConfirmButtonState();
        }
        if (spinResultDisplayArea) {
            spinResultDisplayArea.textContent = '';
            spinResultDisplayArea.classList.add('hidden');
        }

        const isToggledBeforeClick = ratioFreeModeToggle.dataset.toggled === 'true';
        const newIsToggled = !isToggledBeforeClick;

        if (singleEntryModeToggle.dataset.toggled === 'true') {
            return;
        }

        ratioFreeModeToggle.dataset.toggled = newIsToggled;
        
        ratioFreeModeToggle.classList.toggle('bg-primary', newIsToggled);
        ratioFreeModeToggle.classList.toggle('bg-primary/30', !newIsToggled);
        ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', newIsToggled);

        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';
        if (!isSingleEntryMode) {
            if (newIsToggled) {
                entriesTextarea.placeholder = 'Enter Name:Percentage (e.g., "Apple:20", "Banana:30")';
            } else {
                entriesTextarea.placeholder = 'Type entries here... (one per line)';
            }
        }
        
        entriesTextarea.value = '';
        wheelItems = [];

        syncTextareaWithWheelItems();
    }

    // --- Event Listeners ---
    if (spindecideGuideNavLink) {
        spindecideGuideNavLink.addEventListener('click', (event) => {
            event.preventDefault();
            spindecideGuideModal.classList.remove('hidden');
        });
    }

    if (spindecideModalCloseButton) {
        spindecideModalCloseButton.addEventListener('click', () => {
            spindecideGuideModal.classList.add('hidden');
        });
    }

    if (spindecideGuideModal) {
        spindecideGuideModal.addEventListener('click', (event) => {
            if (event.target === spindecideGuideModal) {
                spindecideGuideModal.classList.add('hidden');
            }
        });
    }

    if (historyButton) {
        historyButton.addEventListener('click', () => {
            updateStatsUI();
            historyModal.classList.remove('hidden');
        });
    }
    if (historyModalCloseButton) {
        historyModalCloseButton.addEventListener('click', () => {
            historyModal.classList.add('hidden');
        });
    }
    if (historyModal) {
        historyModal.addEventListener('click', (event) => {
            if (event.target === historyModal) {
                historyModal.classList.add('hidden');
            }
        });
    }
    if (statsResetButton) {
        statsResetButton.addEventListener('click', resetCurrentStats);
    }


    if (entriesTextarea) {
        entriesTextarea.addEventListener('input', () => {
            let currentEntries = entriesTextarea.value.split('\n');
            let nonEmptyEntries = currentEntries.filter(entry => entry.trim() !== '');

            if (nonEmptyEntries.length > MAX_ENTRIES) {
                let truncatedEntries = nonEmptyEntries.slice(0, MAX_ENTRIES);
                entriesTextarea.value = truncatedEntries.join('\n');

                alert(`You can only have a maximum of ${MAX_ENTRIES} active entries. Excess entries have been removed.`);
                wheelItems = parseTextareaToWheelItems(entriesTextarea.value);
                syncTextareaWithWheelItems();
                return; 
            }
            wheelItems = parseTextareaToWheelItems(entriesTextarea.value);
            syncTextareaWithWheelItems();
        });
    }

    if (spinButton) {
        spinButton.addEventListener('click', spinWheel);
    }

    if (shuffleButton) {
        shuffleButton.addEventListener('click', shuffleEntries);
    }

    if (sortButton) {
        sortButton.addEventListener('click', sortEntries);
    }

    if (confirmEntriesButton) {
        confirmEntriesButton.addEventListener('click', handleConfirmEntries);
    }

    if (singleEntryAddButton) {
        singleEntryAddButton.addEventListener('click', addSingleEntry);
    }

    if (singleEntryModeToggle) {
        singleEntryModeToggle.addEventListener('click', toggleSingleEntryMode);
    }

    if (ratioFreeModeToggle) {
        ratioFreeModeToggle.addEventListener('click', toggleRatioFreeMode);
    }

    if (spinResultCloseButton) {
        spinResultCloseButton.addEventListener('click', () => {
            spinResultModal.classList.add('hidden');
        });
    }

    if (spinResultModal) {
        spinResultModal.addEventListener('click', (event) => {
            if (event.target === spinResultModal) {
                spinResultModal.classList.add('hidden');
            }
        });
    }

    // --- Initial Setup ---
    rouletteHistory = JSON.parse(localStorage.getItem('rouletteHistory')) || {};

    let initialSingleEntryModeToggled = singleEntryModeToggle.dataset.toggled === 'true';
    let initialRatioFreeModeToggled = ratioFreeModeToggle.dataset.toggled === 'true';

    singleEntryModeToggle.classList.toggle('bg-primary', initialSingleEntryModeToggled);
    singleEntryModeToggle.classList.toggle('bg-primary/30', !initialSingleEntryModeToggled);
    singleEntryModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', initialSingleEntryModeToggled);

    ratioFreeModeToggle.classList.toggle('bg-primary', initialRatioFreeModeToggled);
    ratioFreeModeToggle.classList.toggle('bg-primary/30', !initialRatioFreeModeToggled);
    ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', initialRatioFreeModeToggled);


    singleEntryInputContainer.classList.toggle('hidden', !initialSingleEntryModeToggled);
    entriesTextarea.readOnly = initialSingleEntryModeToggled;
    singleEntryAddButton.classList.toggle('hidden', !initialSingleEntryModeToggled);
    singleEntryListContainer.classList.toggle('hidden', !initialSingleEntryModeToggled);

    if (initialSingleEntryModeToggled) {
        entriesTextarea.style.backgroundColor = 'var(--background-light)';
        entriesTextarea.style.opacity = '0.7';

        ratioFreeModeToggle.disabled = true;
        ratioFreeModeToggle.dataset.toggled = 'false';
        ratioFreeModeToggle.classList.remove('bg-primary');
        ratioFreeModeToggle.classList.add('bg-primary/30');
        ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');
        document.getElementById('ratio-free-desc').textContent = 'Forced to equal proportions';
        singleEntryInput.placeholder = 'Enter one entry';
        totalPercentageDisplay.classList.add('hidden');
        renderSingleEntryList();
    } else {
        entriesTextarea.style.backgroundColor = '';
        entriesTextarea.style.opacity = '1';
        ratioFreeModeToggle.disabled = false;
        document.getElementById('ratio-free-desc').textContent = 'Define custom ratios for entries';
        
        ratioFreeModeToggle.dataset.toggled = 'false';
        ratioFreeModeToggle.classList.remove('bg-primary');
        ratioFreeModeToggle.classList.add('bg-primary/30');
        ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');

        singleEntryInput.placeholder = 'Enter one entry';
        entriesTextarea.placeholder = 'Type entries here... (one per line)';
    }
    isConfirmed = false;
    spinButton.disabled = true;
    spinButton.classList.add('opacity-50', 'cursor-not-allowed');

    shuffleButton.disabled = false;
    sortButton.disabled = false;
    shuffleButton.classList.remove('opacity-50', 'cursor-not-allowed');
    sortButton.classList.remove('opacity-50', 'cursor-not-allowed');


    wheelItems = parseTextareaToWheelItems(entriesTextarea.value);
    syncTextareaWithWheelItems();
});