
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
        resultsDiv.innerHTML = '<div class="loading">Entrez le texte a analyser</div>';
        statsDiv.style.display = 'none';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading">Analyse du texte...</div>';
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
    }, 100);
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

                // Replace tooltip with click handler
                highlightedText += `<span class="bible-word ${colorClass}" onclick="showVerses('${lowerToken}', '${token}')">${token}</span>`;
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
    
    modalWord.textContent = displayWord;
    verseCount.textContent = `${currentWordVerses.length} verset${currentWordVerses.length > 1 ? 's' : ''} trouvé${currentWordVerses.length > 1 ? 's' : ''}`;
    
    versesList.innerHTML = '';
    loadMoreVerses(word);
    
    modal.style.display = 'block';
}

function loadMoreVerses(word) {
    const versesList = document.getElementById('versesList');
    const nextVerses = currentWordVerses.slice(currentDisplayedCount, currentDisplayedCount + VERSES_PER_PAGE);
    
    nextVerses.forEach(verse => {
        const highlightedText = verse.text.replace(
            new RegExp(`\\b${word}\\b`, 'gi'),
            `<strong style="color: #3498db;">$&</strong>`
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
        loadMoreBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 10px;
        `;
        loadMoreBtn.onclick = () => loadMoreVerses(word);
        versesList.appendChild(loadMoreBtn);
    }
}


function closeModal() {
    document.getElementById('versesModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('versesModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Allow Enter key to trigger analysis
document.getElementById('textInput').addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'Enter') {
        analyzeText();
    }
});