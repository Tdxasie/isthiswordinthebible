const bibleWords = new Set();
const bibleWordToVerses = new Map();
const bibleWordFrequency = new Map();

function indexBible() {
    for (const book of bibleData.books) {
        for (const chapter of book.chapters) {
            for (const verse of chapter.verses) {
                const words = verse.text.toLowerCase().match(/(?<![\p{L}\p{N}])([\p{L}\p{N}]+)(?![\p{L}\p{N}])/gu);
                if (!words) continue;

                for (const word of words) {
                    if (!bibleWordToVerses.has(word)) {
                        bibleWordToVerses.set(word, []);
                        bibleWordFrequency.set(word, 0);
                    }
                    bibleWordToVerses.get(word).push({
                        ref: verse.name,
                        text: verse.text
                    });
                    bibleWordFrequency.set(word, bibleWordFrequency.get(word) + 1);
                    bibleWords.add(word);
                }
            }
        }
    }
    console.log(`Bible indexed with ${bibleWords.size} unique words`);
}

// Adjustable thresholds
const rarityThresholds = {
    veryRare: 1,     // Appears only once
    rare: 3,         // Appears 2–3 times
    uncommon: 10     // Appears 4–10 times
    // Common is anything above
};

function getFrequencyColorClass(word) {
    const frequency = bibleWordFrequency.get(word) || 0;

    if (frequency <= rarityThresholds.veryRare) return 'rarity-legendary';
    if (frequency <= rarityThresholds.rare) return 'rarity-rare';
    if (frequency <= rarityThresholds.uncommon) return 'rarity-uncommon';
    return 'rarity-common';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    indexBible();
});

function analyzeText() {
    const input = document.getElementById('textInput').value.trim();
    const resultsDiv = document.getElementById('results');
    const statsDiv = document.getElementById('stats');
    
    if (!input) {
        resultsDiv.innerHTML = '<div class="loading">Entrez le texte à analyser</div>';
        statsDiv.style.display = 'none';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading">Analyse du texte...</div>';
    statsDiv.style.display = 'none';
    
    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
        const result = highlightBibleWords(input);
        resultsDiv.innerHTML = result.highlightedText;
        
        // Update stats with animation
        updateStats(result);
        
        statsDiv.style.display = 'flex';
        
        // Show frequency legend
        showFrequencyLegend();
    });
}

// Poids associés aux classes de rareté
const rarityWeights = {
    "rarity-legendary": 5,
    "rarity-rare": 3,
    "rarity-uncommon": 2,
    "rarity-common": 1,
    "rarity-cursed": -4
};

function updateStats(result) {
    const totalWordsEl = document.getElementById('totalWords');
    const bibleWordsEl = document.getElementById('bibleWords');
    const percentageEl = document.getElementById('percentage');

    animateNumber(totalWordsEl, parseInt(totalWordsEl.textContent) || 0, result.totalWords);
    animateNumber(bibleWordsEl, parseInt(bibleWordsEl.textContent) || 0, result.bibleWordsCount);

    let positiveScore = 0;
    let penaltyScore = 0;

    for (const [rarityClass, count] of Object.entries(result.rarityCounts)) {
        const weight = rarityWeights[rarityClass] || 0;
        if (weight > 0) {
            positiveScore += count * weight;
        } else if (weight < 0) {
            penaltyScore += count * Math.abs(weight);
        }
    }

    let holiness = 100;
    if (positiveScore > 0) {
        const corruption = Math.min(penaltyScore / positiveScore, 1); // cap at 100% corruption
        holiness = Math.round((1 - corruption) * 100);
    } else if (penaltyScore > 0) {
        holiness = 0; // Only cursed words
    }

    animateNumber(percentageEl, 0, holiness, "%");
}

function animateNumber(element, start, end, suffix="") {
    const duration = 500;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function highlightBibleWords(text) {
    const tokens = text.match(/(?<![\p{L}\p{N}])([\p{L}\p{N}]+)(?![\p{L}\p{N}])|[^\p{L}\p{N}\s]+|\s+/gu) || [];
    let highlightedText = '';
    let totalWords = 0;
    let bibleWordsCount = 0;
    let rarityCounts = {
        "rarity-legendary": 0,
        "rarity-rare": 0,
        "rarity-uncommon": 0,
        "rarity-common": 0,
        "rarity-cursed": 0
    };

    for (const token of tokens) {
        if (/^[\p{L}\p{N}]+$/u.test(token)) {
            totalWords++;
            const lowerToken = token.toLowerCase();

            if (bibleWords.has(lowerToken)) {
                bibleWordsCount++;
                const frequencyClass = getFrequencyColorClass(lowerToken); // returns class name like 'rarity-rare'
                rarityCounts[frequencyClass] = (rarityCounts[frequencyClass] || 0) + 1;
                const frequency = bibleWordFrequency.get(lowerToken);
                
                // Escape quotes for onclick handler
                const escapedWord = lowerToken.replace(/'/g, "\\'");
                const escapedToken = token.replace(/'/g, "\\'");
                
                highlightedText += `<span class="bible-word ${frequencyClass}" onclick="showVerses('${escapedWord}', '${escapedToken}')" title="Rareté: ${frequency} occurrences - Cliquez pour voir les versets">${token}</span>`;
            } else {
                rarityCounts["rarity-cursed"] = (rarityCounts["rarity-cursed"] || 0) + 1;
                highlightedText += `<span class="bible-word rarity-cursed" title="MAUDIT" style="cursor: pointer;" onclick="window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')">${token}</span>`;
            }
        } else {
            highlightedText += token;
        }
    }

    return {
        highlightedText,
        totalWords,
        bibleWordsCount,
        rarityCounts     // ← nécessaire pour le score pondéré
    };
}
