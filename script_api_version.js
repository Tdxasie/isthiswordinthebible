const API_KEY = "d8ecdda7305bb6ff8525ef10165edbe1";
const BIBLE_ID = "a93a92589195411f-01"; // LSG in French, for example


// Comprehensive list of common Bible words (this is a subset - a full implementation would use a complete Bible word list)
let bibleWords = new Set();

async function isWordInBible(word) {
    const query = encodeURIComponent(word);
    const url = `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/search?query=${query}&limit=1`;

    const response = await fetch(url, {
        headers: {
            "api-key": API_KEY
        }
    });

    if (!response.ok) {
        console.error("API error:", await response.text());
        return false;
    }

    const data = await response.json();
    return data.data.total > 0;
}

async function analyzeText() {
    const input = document.getElementById('textInput').value.trim();
    const resultsDiv = document.getElementById('results');
    const statsDiv = document.getElementById('stats');

    if (!input) {
        resultsDiv.innerHTML = '<div class="loading">Please enter some text to analyze.</div>';
        statsDiv.style.display = 'none';
        return;
    }

    resultsDiv.innerHTML = '<div class="loading">Analyzing text using API...</div>';
    statsDiv.style.display = 'none';

    const result = await highlightBibleWordsOnline(input);
    resultsDiv.innerHTML = result.highlightedText;

    document.getElementById('totalWords').textContent = result.totalWords;
    document.getElementById('bibleWords').textContent = result.bibleWordsCount;
    document.getElementById('percentage').textContent = 
        result.totalWords > 0 ? Math.round((result.bibleWordsCount / result.totalWords) * 100) + '%' : '0%';

    statsDiv.style.display = 'flex';
}

async function highlightBibleWordsOnline(text) {
    const words = text.split(/(\s+|[^\w\s])/);
    let highlightedText = '';
    let totalWords = 0;
    let bibleWordsCount = 0;
    let colorIndex = 0;
    const colors = ['highlight-1', 'highlight-2', 'highlight-3', 'highlight-4', 'highlight-5', 'highlight-6', 'highlight-7', 'highlight-8'];

    for (const word of words) {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord.length > 0) {
            totalWords++;
            const inBible = await isWordInBible(cleanWord);

            if (inBible) {
                bibleWordsCount++;
                const colorClass = colors[colorIndex % colors.length];
                highlightedText += `<span class="bible-word ${colorClass}" title="This word appears in the Bible">${word}</span>`;
                colorIndex++;
            } else {
                highlightedText += word;
            }
        } else {
            highlightedText += word;
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
document.getElementById('textInput').value = "I was signed to Aftermath after the fact. How could I not blow? All I do is drop F-bombs. Feel my wrath of attack. Rappers are havin' a rough time period, here's a maxi pad. It's actually disastrously bad for the wack. While I'm masterfully constructing this master piece.";