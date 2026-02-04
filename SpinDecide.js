// JavaScript for SpinDecide.html
console.log("SpinDecide.js loaded");

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
    // Renamed from addEntryButton
    const confirmEntriesButton = document.getElementById('confirm-entries-button'); 
    const addSingleEntryButton = document.getElementById('add-single-entry-button'); // New button

    const singleEntryModeToggle = document.getElementById('single-entry-mode-toggle');
    const singleEntryInputContainer = document.getElementById('single-entry-input-container');
    const singleEntryInput = document.getElementById('single-entry-input');

    const ratioFreeModeToggle = document.getElementById('ratio-free-mode-toggle');
    const totalPercentageDisplay = document.getElementById('total-percentage-display');

    const spinResultModal = document.getElementById('spin-result-modal');
    const spinResultText = document.getElementById('spin-result-text');
    const spinResultCloseButton = document.getElementById('spin-result-close-button');

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

    let currentRotation = 0; // To keep track of the wheel's current rotation for smooth transitions
    let isConfirmed = false; // New state variable for entry confirmation

    // --- Helper Functions ---
    function getEntries() {
        const rawEntries = entriesTextarea.value.split('\n')
                                 .map(entry => entry.trim())
                                 .filter(entry => entry !== '');

        const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';

        return rawEntries.map(rawEntry => {
            let name = rawEntry;
            let ratio = 1; // Default to 1 for equal distribution or if ratio parsing fails

            if (isRatioFreeMode) {
                const parts = rawEntry.split(':');
                if (parts.length > 1) {
                    name = parts[0].trim();
                    const parsedRatio = parseInt(parts[1].trim(), 10);
                    if (!isNaN(parsedRatio) && parsedRatio >= 0 && parsedRatio <= 100) { // Validate percentage
                        ratio = parsedRatio;
                    } else {
                        ratio = 0; 
                        console.warn(`Invalid percentage for entry "${rawEntry}". Must be between 0 and 100.`);
                    }
                } else {
                    ratio = 0; // If ratio-free mode is on, but no ratio specified for an entry
                }
            }
            return { name, ratio };
        }).filter(entry => entry.name !== '' && entry.ratio > 0); // Filter out entries with empty names or 0 ratio
    }

    function updateEntriesTextarea(entries) {
        const isRatioFreeMode = ratioFreeModeToggle.dataset.toggled === 'true';
        let textValue;

        if (isRatioFreeMode) {
            textValue = entries.map(entry => `${entry.name}:${entry.ratio}`).join('\n');
        } else {
            textValue = entries.map(entry => entry.name).join('\n');
        }
        
        entriesTextarea.value = textValue;
        updateEntriesCount();
        generateWheel(); // Regenerate wheel whenever entries change
        updateTotalPercentageDisplay(); // Update total percentage display
    }

    function updateEntriesCount() {
        const entries = getEntries();
        const numEntries = entries.length;

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
            addSingleEntryButton.disabled = true;
            addSingleEntryButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            addSingleEntryButton.disabled = false;
            addSingleEntryButton.classList.remove('opacity-50', 'cursor-not-allowed');
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
        const entries = getEntries();
        const totalPercentage = entries.reduce((sum, entry) => sum + entry.ratio, 0);

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

        const rawEntries = getEntries();
        const items = rawEntries.map(entry => ({
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

        let currentStartAngle = 0;

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
            const sliceAngle = (item.percent / total) * Math.PI * 2;
            const endAngle = currentStartAngle + sliceAngle;

            // 🎨 영역
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, currentStartAngle, endAngle);
            ctx.closePath();

            // Use the HSL color scheme provided by the user
            ctx.fillStyle = `hsl(${i * 360 / items.length},70%,55%)`;
            ctx.fill();

            // ===== 텍스트 중앙 정확 배치 =====
            const mid = currentStartAngle + sliceAngle / 2;
            const textR = radius * 0.65;

            ctx.save();
            ctx.translate(
                center + Math.cos(mid) * textR,
                center + Math.sin(mid) * textR
            );

            ctx.rotate(mid);

            // 아래 반원은 뒤집기
            if (mid > Math.PI / 2 && mid < Math.PI * 1.5) {
                ctx.rotate(Math.PI);
            }

            const baseSize = radius / 10;
            ctx.font = `bold ${baseSize * (item.scale || 1)}px Arial`;
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(item.text, 0, 0);
            ctx.restore();

            currentStartAngle = endAngle;
        });
    }

    function spinWheel() {
        let entries = getEntries();
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

        const anglePerUnit = 360 / totalRatio;
        let startAngleOfWinningSegment = 0;
        for(let i = 0; i < winningIndex; i++) {
            startAngleOfWinningSegment += entries[i].ratio * anglePerUnit;
        }
        const endAngleOfWinningSegment = startAngleOfWinningSegment + (winningEntry.ratio * anglePerUnit);
        const centerAngleOfWinningSegment = startAngleOfWinningSegment + (winningEntry.ratio * anglePerUnit / 2);

        const randomOffset = (Math.random() - 0.5) * (winningEntry.ratio * anglePerUnit * 0.8);
        const targetRotation = 360 - centerAngleOfWinningSegment;
        
        const fullRotations = 5;
        const finalRotation = currentRotation + (fullRotations * 360) + targetRotation + randomOffset - (currentRotation % 360);
        
        spinnerWheel.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        spinnerWheel.style.transform = `rotate(${finalRotation}deg)`;
        currentRotation = finalRotation;

        setTimeout(() => {
            if (spinResultText) {
                spinResultText.textContent = winningEntry.name;
            } else {
                console.error("Error: spinResultText element not found in setTimeout callback.");
            }
            spinResultModal.classList.remove('hidden');
            spinButton.disabled = false;
            spinButton.classList.remove('opacity-50', 'cursor-not-allowed');
            spinnerWheel.style.transition = 'none';
        }, 5000); // Match animation duration
    }

    function shuffleEntries() {
        if (isConfirmed) { 
            alert('Please cancel confirmation to shuffle entries.');
            return;
        }
        let entries = getEntries();
        if (entries.length === 0) return;
        // If single entry mode is on, ratios are equal. Shuffle names, ratios stay 1.
        const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';
        if (isSingleEntryMode) {
             entries = entries.map(entry => ({ name: entry.name, ratio: 1 })); // Ensure ratios are 1 for shuffle if Single Entry Mode is ON
        }

        for (let i = entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [entries[i], entries[j]] = [entries[j], entries[i]]; // ES6 swap
        }
        updateEntriesTextarea(entries);
    }

    function sortEntries() {
        if (isConfirmed) { 
            alert('Please cancel confirmation to sort entries.');
            return;
        }
        let entries = getEntries();
        if (entries.length === 0) return;
        // Sort by name. Ratios remain tied to their original names after sort.
        entries.sort((a, b) => a.name.localeCompare(b.name));
        updateEntriesTextarea(entries);
    }

    // Function for the new + Add Entry button (when Single Entry Mode is ON)
    function addSingleEntry() {
        let entries = getEntries();
        const numEntries = entries.length;

        if (numEntries >= MAX_ENTRIES) {
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

            entries.push({ name: newEntryName, ratio: 1 }); // Always ratio 1 in single entry mode
            singleEntryInput.value = '';
            updateEntriesTextarea(entries);
            singleEntryInput.focus();
        } else {
            alert('Please enter an entry in the single input field.');
        }
    }

    // Function for the Confirm / Cancel button
    function handleConfirmEntries() {
        const entries = getEntries();
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
            // If in Single Entry Mode, disable the add single entry button
            const isSingleEntryMode = singleEntryModeToggle.dataset.toggled === 'true';
            if (isSingleEntryMode) {
                addSingleEntryButton.disabled = true;
                addSingleEntryButton.classList.add('opacity-50', 'cursor-not-allowed');
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

            // If in Single Entry Mode, re-enable add single entry button
            if (isSingleEntryMode) {
                addSingleEntryButton.disabled = false;
                addSingleEntryButton.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
        updateEntriesCount(); // Re-evaluate spin button state based on entry count and confirmation status
        generateWheel(); // Re-generate wheel for visual updates if any
        updateTotalPercentageDisplay(); // Update total percentage display
    }


    // --- Toggle Logic ---
    function toggleSingleEntryMode() {
        const isToggledBeforeClick = singleEntryModeToggle.dataset.toggled === 'true';
        const newIsToggled = !isToggledBeforeClick;

        singleEntryModeToggle.dataset.toggled = newIsToggled;
        
        singleEntryModeToggle.classList.toggle('bg-primary', newIsToggled);
        singleEntryModeToggle.classList.toggle('bg-primary/30', !newIsToggled);
        singleEntryModeToggle.querySelector('.toggle-switch-handle').classList.toggle('translate-x-full', newIsToggled);

        singleEntryInputContainer.classList.toggle('hidden', !newIsToggled);
        entriesTextarea.readOnly = newIsToggled;

        // Show/hide addSingleEntryButton based on Single Entry Mode state
        addSingleEntryButton.classList.toggle('hidden', !newIsToggled);
        // Show/hide confirmEntriesButton based on Single Entry Mode state
        confirmEntriesButton.classList.toggle('hidden', newIsToggled);


        if (newIsToggled) { // Toggled to ON (single entry mode)
            // Visually indicate read-only textarea
            entriesTextarea.style.backgroundColor = 'var(--background-light)';
            entriesTextarea.style.opacity = '0.7';
            singleEntryInput.focus();

            // When Single Entry Mode is ON, Ratio Free Mode is disabled and forced to OFF
            ratioFreeModeToggle.disabled = true;
            // Force Ratio Free Mode to OFF (equal ratio)
            ratioFreeModeToggle.dataset.toggled = 'false';
            ratioFreeModeToggle.classList.remove('bg-primary');
            ratioFreeModeToggle.classList.add('bg-primary/30');
            ratioFreeModeToggle.querySelector('.toggle-switch-handle').classList.remove('translate-x-full');
            document.getElementById('ratio-free-desc').textContent = 'Forced to equal proportions'; // Update description
            singleEntryInput.placeholder = 'Enter one entry'; // Ratio Free Mode is off, so just name
            totalPercentageDisplay.classList.add('hidden'); // Hide total percentage

            // Ensure isConfirmed is reset when switching to Single Entry Mode
            isConfirmed = false;
            // And update confirmEntriesButton visuals back to confirm state
            confirmEntriesButton.innerHTML = `<span class="material-symbols-outlined">check</span> Confirm Entries`;
            confirmEntriesButton.classList.remove('bg-red-500');
            confirmEntriesButton.classList.add('bg-primary');
            shuffleButton.disabled = false; // Re-enable shuffle/sort
            sortButton.disabled = false;
            shuffleButton.classList.remove('opacity-50', 'cursor-not-allowed');
            sortButton.classList.remove('opacity-50', 'cursor-not-allowed');
            spinButton.disabled = true; // Disable spin button
            spinButton.classList.add('opacity-50', 'cursor-not-allowed');

            // Revert all entries to equal proportions (ratio 1) and update textarea
            let entries = getEntries().map(entry => ({ name: entry.name, ratio: 1 }));
            updateEntriesTextarea(entries); // This also calls generateWheel and updateTotalPercentageDisplay

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

            // Reset isConfirmed when leaving Single Entry Mode
            isConfirmed = false;
            // And update confirmEntriesButton visuals back to confirm state
            confirmEntriesButton.innerHTML = `<span class="material-symbols-outlined">check</span> Confirm Entries`;
            confirmEntriesButton.classList.remove('bg-red-500');
            confirmEntriesButton.classList.add('bg-primary');
            shuffleButton.disabled = false; // Re-enable shuffle/sort
            sortButton.disabled = false;
            shuffleButton.classList.remove('opacity-50', 'cursor-not-allowed');
            sortButton.classList.remove('opacity-50', 'cursor-not-allowed');
            spinButton.disabled = true; // Disable spin button
            spinButton.classList.add('opacity-50', 'cursor-not-allowed');
            addSingleEntryButton.classList.add('hidden'); // Hide add single entry button
            confirmEntriesButton.classList.remove('hidden'); // Show confirm entries button

            updateEntriesTextarea(getEntries()); // Re-render with default ratio 1
        }
        generateWheel(); 
    }

    function toggleRatioFreeMode() {
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
        
        // Re-render the wheel and update textarea display based on new mode
        const entries = getEntries();
        updateEntriesTextarea(entries);
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
                updateEntriesCount();
                generateWheel();
                updateTotalPercentageDisplay();
                return; 
            }
            updateEntriesCount();
            generateWheel();
            updateTotalPercentageDisplay();
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

    if (addSingleEntryButton) {
        addSingleEntryButton.addEventListener('click', addSingleEntry);
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
    if (initialSingleEntryModeToggled) {
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
        addSingleEntryButton.classList.remove('hidden'); // Show add single entry button
        confirmEntriesButton.classList.add('hidden'); // Hide confirm entries button
    } else { // Single Entry Mode is OFF
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
        addSingleEntryButton.classList.add('hidden'); // Hide add single entry button
        confirmEntriesButton.classList.remove('hidden'); // Show confirm entries button
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


    generateWheel();
    updateEntriesCount();
    updateTotalPercentageDisplay();
});
