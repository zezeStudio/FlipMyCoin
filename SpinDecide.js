// JavaScript for SpinDecide.html
console.log("SpinDecide.js loaded");

let wheelItems = [];

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
    const sortButton = document.getElementById('sort-button'); // Corrected typo here
    
    const confirmEntriesButton = document.getElementById('confirm-entries-button'); 
    const singleEntryAddButton = document.getElementById('single-entry-add-button'); // New button
    const singleEntryListContainer = document.getElementById('single-entry-list-container'); // New container

    const singleEntryModeToggle = document.getElementById('single-entry-mode-toggle');
    const singleEntryInputContainer = document.getElementById('single-entry-input-container');
    const singleEntryInput = document.getElementById('single-entry-input');

    const ratioFreeModeToggle = document.getElementById('ratio-free-mode-toggle');
    const totalPercentageDisplay = document.getElementById('total-percentage-display');

    const spinResultModal = document.getElementById('spin-result-modal');
    const spinResultText = document.getElementById('spin-result-text');
    const spinResultCloseButton = document.getElementById('spin-result-close-button');
    const spinResultDisplayArea = document.getElementById('spin-result-display-area');
    

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

    // --- Helper Functions ---
    // This function parses a raw textarea string into an array of {name, ratio} objects.
    // It is designed to be called when the textarea content changes.
    // It does NOT filter out invalid entries; it just parses what's there.
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
        
        // New: Update the individual entry list if in Single Entry Mode
        if (isSingleEntryMode) {
            renderSingleEntryList();
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
        // Only disable if numEntries > MAX_ENTRIES, not if numEntries == MAX_ENTRIES
        if (numEntries > MAX_ENTRIES) { // Corrected: numEntries >= MAX_ENTRIES for preventing add, > MAX_ENTRIES for disabling confirm button
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

        let currentStartAngleDegrees = 0; // Use degrees for internal calculations

        const total = items.reduce((s, item) => s + (item.percent || 0), 0);
        // Handle case where total is 0 to avoid division by zero
        // This scenario should ideally be prevented by getEntries() filtering or validation
        if (total === 0 && count > 0) {
            console.warn("Total percentage is zero, but entries exist. Displaying equal slices.");
            items.forEach(item => item.percent = 1); // Fallback to equal slices
            // Recalculate total if we forced equal slices
            total = count;
        }


        items.forEach((item, i) => {
            const sliceAngleDegrees = (item.percent / total) * 360; // Calculate slice angle in degrees
            const endAngleDegrees = currentStartAngleDegrees + sliceAngleDegrees;

            // Convert angles to radians for ctx.arc
            const startAngleRadians = currentStartAngleDegrees * (Math.PI / 180);
            const endAngleRadians = endAngleDegrees * (Math.PI / 180);

            // 🎨 영역
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngleRadians, endAngleRadians); // Use radians for arc
            ctx.closePath();

            // Use the HSL color scheme provided by the user
            ctx.fillStyle = wheelColors[i % wheelColors.length]; // Cycle through defined wheel colors
            ctx.fill();

            // ===== 텍스트 중앙 정확 배치 =====
            const midAngleDegrees = currentStartAngleDegrees + sliceAngleDegrees / 2;
            const midAngleRadians = midAngleDegrees * (Math.PI / 180); // Convert mid angle to radians for trig functions
            const textR = radius * 0.65;

            ctx.save();
            ctx.translate(
                center + Math.cos(midAngleRadians) * textR, // Use radians for trig
                center + Math.sin(midAngleRadians) * textR  // Use radians for trig
            );

            ctx.rotate(midAngleRadians); // Use radians for rotation

            // 아래 반원은 뒤집기
            if (midAngleDegrees > 90 && midAngleDegrees < 270) { // Check in degrees
                ctx.rotate(Math.PI); // Rotate by 180 degrees (PI radians)
            }

            const baseSize = radius / 10;
            ctx.font = `bold ${baseSize * (item.scale || 1)}px Arial`;
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(item.text, 0, 0);

            // Add underline for '6' and '9'
            if (item.text === '6' || item.text === '9') {
                const textWidth = ctx.measureText(item.text).width;
                const underlineThickness = baseSize / 10; // 10% of font size for thickness
                const underlineOffset = baseSize * 0.75; // Offset below baseline

                ctx.save();
                ctx.beginPath();
                // Adjust position for underline: move to the start of text, then down by offset
                ctx.moveTo(-textWidth / 2, underlineOffset);
                ctx.lineTo(textWidth / 2, underlineOffset);
                ctx.lineWidth = underlineThickness;
                ctx.strokeStyle = ctx.fillStyle; // Same color as text
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();

            currentStartAngleDegrees = endAngleDegrees; // Update for next segment
        });
    }

    function spinWheel() {
        let entries = getValidWheelEntries();
        const numEntries = entries.length;

        if (numEntries < MIN_ENTRIES) {
            alert(`Please add at least ${MIN_ENTRIES} entries to spin the wheel.`);
            return;
        }

        // Check confirmation state
        if (!isConfirmed) {
            alert('Please confirm your entries before spinning the wheel.');
            return;
        }

        const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';
        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';

        // Force equal ratios if in Single Entry Mode for spinning logic
        if (isSingleEntryMode) {
            entries = entries.map(entry => ({ ...entry, ratio: 1 }));
        }
        
        // Only check for 100% total if Ratio Free Mode is ON and Single Entry Mode is OFF
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

        const anglePerRatioUnit = 360 / totalRatio; // Angle per unit of ratio

        // Calculate the exact angle range for the winning segment
        let winningSegmentStartAngle = 0;
        for (let i = 0; i < winningIndex; i++) {
            winningSegmentStartAngle += entries[i].ratio * anglePerRatioUnit;
        }
        const winningSegmentEndAngle = winningSegmentStartAngle + (winningEntry.ratio * anglePerRatioUnit);

        // Choose a random angle within the winning segment for the pointer to land on
        // This ensures the random angle is strictly within the segment
        const randomAngleWithinSegment = Math.random() * (winningEntry.ratio * anglePerRatioUnit);
        const targetLandingAngle = winningSegmentStartAngle + randomAngleWithinSegment;

        const fullRotationsForEffect = 5; // Ensure at least 5 full spins
        // Calculate the base rotation needed to bring the targetLandingAngle under the 12 o'clock pointer (270 degrees from 3 o'clock)
        let rotationToAlign = 270 - targetLandingAngle;
        // Normalize rotationToAlign to be between 0 and 360 degrees
        rotationToAlign = (rotationToAlign % 360 + 360) % 360; 
        
        // Add full rotations for visual effect and current wheel position
        const finalRotation = currentRotation + (fullRotationsForEffect * 360) + rotationToAlign - (currentRotation % 360);

        // Generate a random spin duration
        const spinDuration = Math.random() * (MAX_SPIN_DURATION - MIN_SPIN_DURATION) + MIN_SPIN_DURATION; // in ms
        const spinDurationSeconds = spinDuration / 1000; // in seconds

        spinnerWheel.style.transition = `transform ${spinDurationSeconds}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        spinnerWheel.style.transform = `rotate(${finalRotation}deg)`;
        currentRotation = finalRotation; // Accumulate rotation for next spin

        setTimeout(() => {
            let formattedWinningEntry = winningEntry.name;
            if (winningEntry.name === '6' || winningEntry.name === '9') {
                formattedWinningEntry = `<u>${winningEntry.name}</u>`;
            }

            if (spinResultText) {
                spinResultText.innerHTML = formattedWinningEntry; // Use innerHTML
            } else {
                console.error("Error: spinResultText element not found in setTimeout callback.");
            }
            spinResultModal.classList.remove('hidden');
            
            // NEW: Update the new display area
            if (spinResultDisplayArea) {
                let formattedDisplayEntry = winningEntry.name;
                if (winningEntry.name === '6' || winningEntry.name === '9') {
                    formattedDisplayEntry = `<u>${winningEntry.name}</u>`;
                }
                spinResultDisplayArea.innerHTML = `Winner: ${formattedDisplayEntry}`; // Use innerHTML
                spinResultDisplayArea.classList.remove('hidden');
            }
            
            spinButton.disabled = false;
            spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
            spinnerWheel.style.transition = 'none';
        }, spinDuration); // Match animation duration
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
}

    else {
                currentMagnifiedSegmentCtx.clearRect(0, 0, currentMagnifiedSegmentCanvas.width, currentMagnifiedSegmentCanvas.height);
                currentMagnifiedSegmentCtx.fillStyle = '#fff';
                currentMagnifiedSegmentCtx.font = '24px Arial';
                currentMagnifiedSegmentCtx.textAlign = 'center';
                currentMagnifiedSegmentCtx.textBaseline = 'middle';
                currentMagnifiedSegmentCtx.fillText('Spin to see result!', currentMagnifiedSegmentCanvas.width / 2, currentMagnifiedSegmentCanvas.height / 2);
            }
            // Re-attach event listeners since elements are now local to function scope
            currentMagnifiedSegmentCloseButton.onclick = () => { currentMagnifiedSegmentModal.classList.add('hidden'); };
            currentMagnifiedSegmentModal.onclick = (event) => {
                if (event.target === currentMagnifiedSegmentModal) {
                    currentMagnifiedSegmentModal.classList.add('hidden');
                }
            };
        } else {
            console.error('One or more magnified segment modal elements not found when toggleZoom was called.');
        }
    }

    // Function for the new + Add Entry button (when Single Entry Mode is ON)
    function addSingleEntry() {
        // Use wheelItems.length directly as wheelItems is the source of truth for all entries
        if (wheelItems.length >= MAX_ENTRIES) {
            alert(`You can add a maximum of ${MAX_ENTRIES} entries.`);
            return;
        }
        // If confirmed, cannot add new entries
        if (isConfirmed) {
            alert('Please cancel confirmation to add new entries.');
            return;
        }

        let newEntryText = singleEntryInput.value.trim();
        if (newEntryText) {
            let newEntryName = newEntryText;
            // In Single Entry Mode, ratio is always 1, regardless of Ratio Free Mode state.
            // We just need to ensure to parse only the name part if user includes ':'
            if (newEntryText.includes(':')) {
                newEntryName = newEntryText.split(':')[0].trim();
            }

            wheelItems.push({ name: newEntryName, ratio: 1 }); // Always ratio 1 in single entry mode
            singleEntryInput.value = '';
            syncTextareaWithWheelItems();
            singleEntryInput.focus();
        } else {
            alert('Please enter an entry in the single input field.');
        }
    }

    // Function for the Confirm / Cancel button
    function handleConfirmEntries() {
        const entries = getValidWheelEntries();
        const numEntries = entries.length;

        if (!isConfirmed) { // If currently in 'confirm' state (i.e., not yet confirmed)
            if (numEntries < MIN_ENTRIES) {
                alert(`Please add at least ${MIN_ENTRIES} entries before confirming.`);
                return;
            }

            // If Ratio Free Mode is ON and not in Single Entry Mode, check total percentage
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
        
        isConfirmed = !isConfirmed; // Toggle confirmation state

        if (isConfirmed) { // State becomes CONFIRMED
            entriesTextarea.readOnly = true;
            entriesTextarea.style.backgroundColor = 'var(--background-light)'; // Indicate read-only visually
            entriesTextarea.style.opacity = '0.7';

            shuffleButton.disabled = true;
            sortButton.disabled = true;
            shuffleButton.classList.add('opacity-50', 'cursor-not-allowed');
            sortButton.classList.add('opacity-50', 'cursor-not-allowed');

            confirmEntriesButton.innerHTML = `<span class="material-symbols-outlined">close</span> Cancel`;
            confirmEntriesButton.classList.remove('bg-primary');
            confirmEntriesButton.classList.add('bg-red-500');

            // Only enable spin button if entries are valid
            if (entries.length >= MIN_ENTRIES) {
                spinButton.disabled = false; 
                spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        } else { // State becomes NOT CONFIRMED (cancelled)
            // If Single Entry Mode is ON, keep textarea read-only, otherwise make it editable
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

            spinButton.disabled = true; // Disable spin button
            spinButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        updateEntriesCount(); // Re-evaluate spin button state based on entry count and confirmation status
        generateWheel(); // Re-generate wheel for visual updates if any
        updateTotalPercentageDisplay(); // Update total percentage display
    }


    // --- Toggle Logic ---
    function toggleSingleEntryMode() {
        // If entries were confirmed, reset the confirmation state when toggling mode
        if (isConfirmed) {
            resetConfirmButtonState();
        }
        // Clear and hide the spin result display area when mode is toggled
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

        // Toggle visibility of singleEntryAddButton and singleEntryListContainer
        singleEntryAddButton.classList.toggle('hidden', !newIsToggled);
        singleEntryListContainer.classList.toggle('hidden', !newIsToggled); // This line is crucial for visibility

        // Clear textarea content and internal wheelItems upon mode change
        entriesTextarea.value = '';
        wheelItems = []; // Clear internal wheel items

        if (newIsToggled) { // Toggled to ON (single entry mode)
            // Visually indicate read-only textarea
            entriesTextarea.style.backgroundColor = 'var(--background-light)';
            entriesTextarea.style.opacity = '0.7';
            singleEntryInput.focus();

            // When Single Entry Mode is ON, Ratio Free Mode is disabled and forced to OFF
            // Check if Ratio Free Mode was ON before disabling it
            const wasRatioFreeModeOn = ratioFreeModeToggle.dataset.toggled === 'true';
            ratioFreeModeToggle.disabled = true;
            ratioFreeModeToggle.dataset.toggled = 'false'; // Force OFF state
            ratioFreeModeToggle.classList.remove('bg-primary');
            ratioFreeModeToggle.classList.add('bg-primary/30');
            ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');
            document.getElementById('ratio-free-desc').textContent = 'Forced to equal proportions'; // Update description
            singleEntryInput.placeholder = 'Enter one entry'; // Ratio Free Mode is off, so just name
            totalPercentageDisplay.classList.add('hidden'); // Hide total percentage

            // Alert user if Ratio Free Mode was disabled
            if (wasRatioFreeModeOn) {
                alert('Single Entry Mode is ON. Ratio Free Mode has been disabled.');
            }

            // The 'wheelItems' will be empty from clearing the textarea, so re-sync
            syncTextareaWithWheelItems();
            renderSingleEntryList(); // Render entries when entering Single Entry Mode
        } else { // Toggled to OFF (multi-line mode)
            entriesTextarea.style.backgroundColor = '';
            entriesTextarea.style.opacity = '1';
            entriesTextarea.focus();

            // Enable Ratio Free Mode toggle and set to OFF state
            ratioFreeModeToggle.disabled = false;
            ratioFreeModeToggle.dataset.toggled = 'false'; // Force OFF state
            ratioFreeModeToggle.classList.remove('bg-primary'); // Visual off
            ratioFreeModeToggle.classList.add('bg-primary/30'); // Visual off
            ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full'); // Visual off
            document.getElementById('ratio-free-desc').textContent = 'Define custom ratios for entries'; // Restore description
            
            // Set placeholder based on Ratio Free Mode status (which is now forced OFF)
            singleEntryInput.placeholder = 'Enter one entry';
            entriesTextarea.placeholder = 'Type entries here... (one per line)';

            // confirmEntriesButton should always be visible, so explicitly show it here when exiting single entry mode
            confirmEntriesButton.classList.remove('hidden'); 

            // The 'wheelItems' will be empty from clearing the textarea, so re-sync
            syncTextareaWithWheelItems();
            singleEntryListContainer.innerHTML = ''; // Clear visual list when exiting Single Entry Mode
        }
        generateWheel(); 
    }

    function toggleRatioFreeMode() {
        // If entries were confirmed, reset the confirmation state when toggling mode
        if (isConfirmed) {
            resetConfirmButtonState();
        }
        // Clear and hide the spin result display area when mode is toggled
        if (spinResultDisplayArea) {
            spinResultDisplayArea.textContent = '';
            spinResultDisplayArea.classList.add('hidden');
        }

        const isToggledBeforeClick = ratioFreeModeToggle.dataset.toggled === 'true';
        const newIsToggled = !isToggledBeforeClick;

        // If Single Entry Mode is ON, this toggle is disabled, so return
        if (singleEntryModeToggle.dataset.toggled === 'true') {
            return;
        }

        ratioFreeModeToggle.dataset.toggled = newIsToggled;
        
        ratioFreeModeToggle.classList.toggle('bg-primary', newIsToggled);
        ratioFreeModeToggle.classList.toggle('bg-primary/30', !newIsToggled);
        ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', newIsToggled);

        // Update entriesTextarea placeholder
        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true'; // Should be false here
        if (!isSingleEntryMode) { // Only relevant if not in single entry mode (textarea is editable)
            if (newIsToggled) { // Toggled to ON (ratio free mode)
                entriesTextarea.placeholder = 'Enter Name:Percentage (e.g., "Apple:20", "Banana:30")';
            } else { // Toggled to OFF (equal ratio mode)
                entriesTextarea.placeholder = 'Type entries here... (one per line)';
            }
        }
        
        // Clear textarea content and internal wheelItems upon mode change
        entriesTextarea.value = '';
        wheelItems = []; // Clear internal wheelItems

        // Re-render the wheel and update textarea display based on new mode
        // After clearing, wheelItems is empty, so re-sync
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

    if (entriesTextarea) {
        entriesTextarea.addEventListener('input', () => {
            let currentEntries = entriesTextarea.value.split('\n');
            let nonEmptyEntries = currentEntries.filter(entry => entry.trim() !== '');

            if (nonEmptyEntries.length > MAX_ENTRIES) {
                // Truncate entries to MAX_ENTRIES
                let truncatedEntries = nonEmptyEntries.slice(0, MAX_ENTRIES);
                // Preserve ratio information if available
                const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';
                entriesTextarea.value = truncatedEntries.join('\n');

                alert(`You can only have a maximum of ${MAX_ENTRIES} active entries. Excess entries have been removed.`);
                wheelItems = parseTextareaToWheelItems(entriesTextarea.value); // Update wheelItems after truncating textarea
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
    // Get initial toggle states from HTML data-toggled attributes
    let initialSingleEntryModeToggled = singleEntryModeToggle.dataset.toggled === 'true';
    let initialRatioFreeModeToggled = ratioFreeModeToggle.dataset.toggled === 'true';

    // Initialize Single Entry Mode toggle visuals
    singleEntryModeToggle.classList.toggle('bg-primary', initialSingleEntryModeToggled);
    singleEntryModeToggle.classList.toggle('bg-primary/30', !initialSingleEntryModeToggled);
    singleEntryModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', initialSingleEntryModeToggled);

    // Initialize Ratio Free Mode toggle visuals
    ratioFreeModeToggle.classList.toggle('bg-primary', initialRatioFreeModeToggled);
    ratioFreeModeToggle.classList.toggle('bg-primary/30', !initialRatioFreeModeToggled);
    ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', initialRatioFreeModeToggled);


    // Apply initial single entry mode state
    singleEntryInputContainer.classList.toggle('hidden', !initialSingleEntryModeToggled);
    entriesTextarea.readOnly = initialSingleEntryModeToggled;
    singleEntryAddButton.classList.toggle('hidden', !initialSingleEntryModeToggled); // Initial visibility for new add button
    singleEntryListContainer.classList.toggle('hidden', !initialSingleEntryModeToggled); // Initial visibility for entry list

    if (initialSingleEntryModeToggled) { // Single Entry Mode is ON
        entriesTextarea.style.backgroundColor = 'var(--background-light)';
        entriesTextarea.style.opacity = '0.7';

        ratioFreeModeToggle.disabled = true;
        ratioFreeModeToggle.dataset.toggled = 'false'; // Ensure it's OFF
        ratioFreeModeToggle.classList.remove('bg-primary');
        ratioFreeModeToggle.classList.add('bg-primary/30');
        ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');
        document.getElementById('ratio-free-desc').textContent = 'Forced to equal proportions';
        singleEntryInput.placeholder = 'Enter one entry';
        totalPercentageDisplay.classList.add('hidden');
        renderSingleEntryList(); // Render entries initially if in Single Entry Mode
        // confirmEntriesButton is always visible in its original position.
    } else { // Single Entry Mode is OFF (multi-line mode)
        entriesTextarea.style.backgroundColor = '';
        entriesTextarea.style.opacity = '1';
        ratioFreeModeToggle.disabled = false;
        document.getElementById('ratio-free-desc').textContent = 'Define custom ratios for entries';
        
        // When Single Entry Mode is OFF, Ratio Free Mode must be OFF by default
        ratioFreeModeToggle.dataset.toggled = 'false'; // Force OFF state
        ratioFreeModeToggle.classList.remove('bg-primary');
        ratioFreeModeToggle.classList.add('bg-primary/30');
        ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');

        // Set placeholder based on Ratio Free Mode status (which is now forced OFF)
        singleEntryInput.placeholder = 'Enter one entry';
        entriesTextarea.placeholder = 'Type entries here... (one per line)';
        // confirmEntriesButton is always visible now.
    }
    // Initialize isConfirmed state
    isConfirmed = false;
    // Initial disable spin button
    spinButton.disabled = true;
    spinButton.classList.add('opacity-50', 'cursor-not-allowed');

    // Make sure shuffle/sort buttons are enabled initially
    shuffleButton.disabled = false;
    sortButton.disabled = false;
    shuffleButton.classList.remove('opacity-50', 'cursor-not-allowed');
    sortButton.classList.remove('opacity-50', 'cursor-not-allowed');


    wheelItems = parseTextareaToWheelItems(entriesTextarea.value); // Initialize wheelItems from textarea content
    syncTextareaWithWheelItems(); // This will call generateWheel, updateEntriesCount, updateTotalPercentageDisplay
});