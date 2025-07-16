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
    
    // Calculate frequency percentiles for color mapping
    calculateFrequencyPercentiles();
    console.log(`Bible indexed with ${bibleWords.size} unique words`);
}

// Calculate frequency percentiles for color mapping
let frequencyPercentiles = [];
function calculateFrequencyPercentiles() {
    const frequencies = Array.from(bibleWordFrequency.values()).sort((a, b) => a - b);
    frequencyPercentiles = [
        frequencies[Math.floor(frequencies.length * 0.1)],   // 10th percentile
        frequencies[Math.floor(frequencies.length * 0.25)],  // 25th percentile
        frequencies[Math.floor(frequencies.length * 0.5)],   // 50th percentile
        frequencies[Math.floor(frequencies.length * 0.75)],  // 75th percentile
        frequencies[Math.floor(frequencies.length * 0.9)],   // 90th percentile
        frequencies[Math.floor(frequencies.length * 0.95)],  // 95th percentile
        frequencies[Math.floor(frequencies.length * 0.99)]   // 99th percentile
    ];
}

// Get color class based on word frequency
function getFrequencyColorClass(word) {
    const frequency = bibleWordFrequency.get(word) || 0;
    
    if (frequency >= frequencyPercentiles[6]) return 'frequency-ultra-high';    // 99th+ percentile - Ultra rare/important
    if (frequency >= frequencyPercentiles[5]) return 'frequency-very-high';     // 95th+ percentile - Very high
    if (frequency >= frequencyPercentiles[4]) return 'frequency-high';          // 90th+ percentile - High
    if (frequency >= frequencyPercentiles[3]) return 'frequency-medium-high';   // 75th+ percentile - Medium-high
    if (frequency >= frequencyPercentiles[2]) return 'frequency-medium';        // 50th+ percentile - Medium
    if (frequency >= frequencyPercentiles[1]) return 'frequency-medium-low';    // 25th+ percentile - Medium-low
    if (frequency >= frequencyPercentiles[0]) return 'frequency-low';           // 10th+ percentile - Low
    return 'frequency-very-low';                                                // Bottom 10% - Very low
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

function updateStats(result) {
    const totalWordsEl = document.getElementById('totalWords');
    const bibleWordsEl = document.getElementById('bibleWords');
    const percentageEl = document.getElementById('percentage');
    
    // Animate numbers
    animateNumber(totalWordsEl, parseInt(totalWordsEl.textContent) || 0, result.totalWords);
    animateNumber(bibleWordsEl, parseInt(bibleWordsEl.textContent) || 0, result.bibleWordsCount);
    
    const percentage = result.totalWords > 0 ? Math.round((result.bibleWordsCount / result.totalWords) * 100) : 0;
    percentageEl.textContent = percentage + '%';
}

function animateNumber(element, start, end) {
    const duration = 500;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
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
    let frequencyStats = {
        'very-low': 0,
        'low': 0,
        'medium-low': 0,
        'medium': 0,
        'medium-high': 0,
        'high': 0,
        'very-high': 0,
        'ultra-high': 0
    };

    for (const token of tokens) {
        if (/^[\p{L}\p{N}]+$/u.test(token)) {
            totalWords++;
            const lowerToken = token.toLowerCase();

            if (bibleWords.has(lowerToken)) {
                bibleWordsCount++;
                const frequencyClass = getFrequencyColorClass(lowerToken);
                const frequency = bibleWordFrequency.get(lowerToken);
                
                // Update frequency stats
                const statKey = frequencyClass.replace('frequency-', '');
                frequencyStats[statKey]++;

                // Escape quotes for onclick handler
                const escapedWord = lowerToken.replace(/'/g, "\\'");
                const escapedToken = token.replace(/'/g, "\\'");
                
                highlightedText += `<span class="bible-word ${frequencyClass}" onclick="showVerses('${escapedWord}', '${escapedToken}')" title="Fréquence: ${frequency} occurrences - Cliquez pour voir les versets">${token}</span>`;
            } else {
                highlightedText += token;
            }
        } else {
            highlightedText += token;
        }
    }

    return {
        highlightedText,
        totalWords,
        bibleWordsCount,
        frequencyStats
    };
}

let currentWordVerses = [];
let currentDisplayedCount = 0;
const VERSES_PER_PAGE = 10;

function showVerses(word, displayWord) {
    const modal = document.getElementById('versesModal');
    const modalWord = document.getElementById('modalWord');
    const versesList = document.getElementById('versesList');
    const verseCount = document.getElementById('verseCount');
    
    currentWordVerses = bibleWordToVerses.get(word) || [];
    currentDisplayedCount = 0;
    
    const frequency = bibleWordFrequency.get(word) || 0;
    const frequencyClass = getFrequencyColorClass(word);
    
    modalWord.innerHTML = `<span class="bible-word ${frequencyClass}">${displayWord}</span>`;
    verseCount.innerHTML = `
        <div>${currentWordVerses.length} verset${currentWordVerses.length > 1 ? 's' : ''} trouvé${currentWordVerses.length > 1 ? 's' : ''}</div>
        <div class="word-frequency">Fréquence: ${frequency} occurrences dans la Bible</div>
    `;
    
    versesList.innerHTML = '';
    
    if (currentWordVerses.length === 0) {
        versesList.innerHTML = '<div class="no-verses">Aucun verset trouvé pour ce mot.</div>';
    } else {
        loadMoreVerses(word);
    }
    
    modal.style.display = 'block';
    
    // Add fade-in animation
    modal.classList.add('modal-show');
    
    // Focus management for accessibility
    modal.setAttribute('aria-hidden', 'false');
    document.querySelector('.close-btn').focus();
}

function loadMoreVerses(word) {
    const versesList = document.getElementById('versesList');
    const nextVerses = currentWordVerses.slice(currentDisplayedCount, currentDisplayedCount + VERSES_PER_PAGE);

    nextVerses.forEach(verse => {
        // Escape HTML in verse text before highlighting
        const escapedText = verse.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Highlight the word using regex, safely escaping it
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<![\\p{L}\\p{N}])(${escapedWord})(?![\\p{L}\\p{N}])`, 'giu');
        const highlightedText = escapedText.replace(
            regex,
            `<strong style="color: #3498db; background-color: rgba(52, 152, 219, 0.1); padding: 2px 4px; border-radius: 3px;">$1</strong>`
        );

        const verseDiv = document.createElement('div');
        verseDiv.className = 'verse-item';
        verseDiv.innerHTML = `
            <div class="verse-ref">${verse.ref}</div>
            <div class="verse-text">${highlightedText}</div>
        `;
        versesList.appendChild(verseDiv);
    });

    currentDisplayedCount += nextVerses.length;

    // Remove any existing "Load More" button
    const existingBtn = document.getElementById('loadMoreBtn');
    if (existingBtn) existingBtn.remove();

    // Add "Load More" button if there are more verses
    if (currentDisplayedCount < currentWordVerses.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'loadMoreBtn';
        loadMoreBtn.textContent = `Charger ${Math.min(VERSES_PER_PAGE, currentWordVerses.length - currentDisplayedCount)} verset(s) de plus`;
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.style.cssText = 'width: 100%; padding: 10px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px;';
        loadMoreBtn.onclick = () => loadMoreVerses(word);
        versesList.appendChild(loadMoreBtn);
    }
}

function showFrequencyLegend() {
    const freq = document.getElementById('frequency-legend');
    freq.removeAttribute('hidden');
}

function closeModal() {
    const modal = document.getElementById('versesModal');
    modal.classList.remove('modal-show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    
    // Return focus to the text input
    document.getElementById('textInput').focus();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('versesModal');
        if (event.target === modal) {
            closeModal();
        }
    };

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // Allow Enter key to trigger analysis
    const textInput = document.getElementById('textInput');
    if (textInput) {
        textInput.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.key === 'Enter') {
                analyzeText();
            }
        });
        
        // Auto-resize textarea
        textInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
});
