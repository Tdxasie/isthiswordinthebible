
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