
const bibleWords = new Set();
const bibleWordToVerses = new Map();

function indexBible() {
    for (const book of bibleData.books) {
        for (const chapter of book.chapters) {
            for (const verse of chapter.verses) {
                const words = verse.text.toLowerCase().match(/\b[\p{L}\p{N}]+\b/gu);
                if (!words) continue;

                for (const word of words) {
                    if (!bibleWordToVerses.has(word)) {
                        bibleWordToVerses.set(word, []);
                    }
                    bibleWordToVerses.get(word).push({
                        ref: verse.name,
                        text: verse.text
                    });
                    bibleWords.add(word);
                }
            }
        }
    }
}
// Call it once on page load
indexBible();


function analyzeText() {
    const input = document.getElementById('textInput').value.trim();
    const resultsDiv = document.getElementById('results');
    const statsDiv = document.getElementById('stats');
    
    if (!input) {
        resultsDiv.innerHTML = '<div class="loading">Please enter some text to analyze.</div>';
        statsDiv.style.display = 'none';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading">Analyzing text...</div>';
    statsDiv.style.display = 'none';
    
    // Simulate processing delay for better UX
    setTimeout(() => {
        const result = highlightBibleWords(input);
        resultsDiv.innerHTML = result.highlightedText;
        
        // Update stats
        document.getElementById('totalWords').textContent = result.totalWords;
        document.getElementById('bibleWords').textContent = result.bibleWordsCount;
        document.getElementById('percentage').textContent = 
            result.totalWords > 0 ? Math.round((result.bibleWordsCount / result.totalWords) * 100) + '%' : '0%';
        
        statsDiv.style.display = 'flex';
    }, 500);
}

function highlightBibleWords(text) {
    const tokens = text.match(/\b[\p{L}\p{N}]+\b|[^\p{L}\p{N}\s]+|\s+/gu);
    let highlightedText = '';
    let totalWords = 0;
    let bibleWordsCount = 0;
    let colorIndex = 0;
    const colors = ['highlight-1', 'highlight-2', 'highlight-3', 'highlight-4', 'highlight-5', 'highlight-6', 'highlight-7', 'highlight-8'];

    for (const token of tokens) {
        if (/^[\p{L}\p{N}]+$/u.test(token)) {
            totalWords++;
            const lowerToken = token.toLowerCase();

            if (bibleWords.has(lowerToken)) {
                bibleWordsCount++;
                const colorClass = colors[colorIndex % colors.length];
                const verses = bibleWordToVerses.get(lowerToken) || [];
                const tooltip = verses.map(v => `${v.ref}: ${v.text}`).join('\n');
                const safeTooltip = tooltip.replace(/"/g, '&quot;');

                highlightedText += `<span class="bible-word ${colorClass}" title="${safeTooltip}">${token}</span>`;
                colorIndex++;
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
        bibleWordsCount
    };
}

// Allow Enter key to trigger analysis
document.getElementById('textInput').addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'Enter') {
        analyzeText();
    }
});

// Add some sample text for demonstration
document.getElementById('textInput').value = "Tu ctrlc v la bible en texte et tu la refine, t'enlève les doublons et tout là bim bam \n Ordonné par ordre alpha";