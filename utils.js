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
