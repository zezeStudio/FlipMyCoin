# SpinDecide User Guide

## Introduction

Welcome to SpinDecide! This tool provides an interactive roulette wheel to help you make decisions, randomize choices, or simply have fun. You can customize the entries on the wheel, assign weights (ratios) to influence outcomes, track your spin history, and view statistics for different sets of choices.

## Key Features

*   **Customizable Roulette Wheel:** Easily add or remove your own decision options (entries).
*   **Ratio Free Mode:** Assign custom percentage-based probabilities to each entry, giving you fine-grained control over the likelihood of each outcome.
*   **Dynamic Visuals:** A canvas-based rendering engine creates a visually appealing and animated spinning wheel.
*   **Spin History & Statistics:** Automatically track every spin, view a historical log of your entry sets, and see win counts and percentages for each choice.
*   **Reset Entries:** Quickly clear all entries from the wheel to start fresh.
*   **Responsive Design:** Works seamlessly across various devices and screen sizes.

## How to Use SpinDecide

### 1. Entering and Managing Your Choices

Your choices, or "entries," are managed through a text area.

*   **Add Entries:** Type or paste your choices into the main text area. Each line represents a separate entry.
*   **Remove Entries:** Delete lines from the text area. The wheel will update automatically.
*   **Shuffle Entries:** Click the "Shuffle" button to randomly reorder your entries.
*   **Sort Entries:** Click the "Sort" button to arrange your entries alphabetically.

### 2. Ratio Free Mode (Assigning Probabilities)

By default, all entries have an equal chance of being selected. To customize probabilities:

*   **Activate Ratio Free Mode:** Check the "Ratio Free Mode" checkbox.
*   **Assign Ratios:** After each entry, add a colon followed by a number representing its weight or percentage. For example:
    ```
    Option A:70
    Option B:20
    Option C:10
    ```
    The wheel will visually adjust the size of each segment according to these ratios. The spinning logic will also respect these probabilities. If the total of your ratios does not sum to 100, the system will adjust them proportionally.

### 3. Spinning the Wheel

Once your entries are set:

*   **Spin:** Click the "Spin" button. The wheel will animate, and a modal will appear displaying the winning entry.

### 4. Viewing History and Statistics

SpinDecide keeps track of all the unique sets of entries you've spun and their outcomes.

*   **Open History:** Click the "History" button. A modal will appear showing a dropdown menu.
*   **Select a Historical Set:** Use the dropdown menu to choose a previous set of entries you've used.
*   **View Statistics:** For the selected set, you will see:
    *   **Total Spins:** The total number of times that specific set of entries has been spun.
    *   **Win Counts:** How many times each individual entry within that set has won.
    *   **Win Percentages:** The percentage of wins for each entry relative to the total spins for that set.
*   **Close History:** Click the "Close" button on the history modal.

### 5. Resetting Entries

To clear all current entries from the text area and reset the wheel to an empty state:

*   **Reset:** Click the "Reset Entries" button.

## Usage Scenarios

SpinDecide is versatile and can be used for a variety of purposes:

*   **Decision Making:** Can't decide where to eat? List your restaurant options and spin the wheel! Need to choose a task? Put them on the wheel.
*   **Games & Fun:** Randomly select players, assign penalties or rewards in a game, or simply use it for party entertainment.
*   **Learning & Teaching:** Ideal for quizzes, vocabulary selection, or any scenario requiring random item selection in an educational context.
*   **Giveaways & Raffles:** A fair and transparent way to pick winners from a list of participants.
*   **Content Creation:** Generate random topics for writing, art, or streaming.
*   **"What to do" lists:** Feeling bored? List activities and let SpinDecide choose for you!

## Troubleshooting

*   **Wheel not spinning/displaying correctly:** Ensure your entries are formatted correctly (one per line, with optional `Name:Ratio` format). Check the browser console for any JavaScript errors.
*   **Entries disappear after closing history:** Entries should persist unless you explicitly reset them or refresh the page in some specific scenarios (e.g., clearing browser data). Ensure your browser's local storage is enabled.

Enjoy using SpinDecide!