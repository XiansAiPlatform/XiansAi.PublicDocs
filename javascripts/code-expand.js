document.addEventListener('DOMContentLoaded', function() {
    // Initialize code block expand functionality
    initCodeExpand();
    
    function initCodeExpand() {
        // Find all code blocks
        const codeBlocks = document.querySelectorAll('.md-content pre');
        
        codeBlocks.forEach(function(codeBlock) {
            // Skip if expand button already exists
            if (codeBlock.querySelector('.code-expand-btn')) {
                return;
            }
            
            // Create expand button
            const expandBtn = document.createElement('button');
            expandBtn.className = 'code-expand-btn';
            expandBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M9.5,13.09L10.91,14.5L6.41,19H10V21H3V14H5V17.59L9.5,13.09M10.91,9.5L9.5,10.91L5,6.41V10H3V3H10V5H6.41L10.91,9.5M14.5,13.09L19,17.59V14H21V21H14V19H17.59L13.09,14.5L14.5,13.09M13.09,9.5L17.59,5H14V3H21V10H19V6.41L14.5,10.91L13.09,9.5Z" />
                </svg>
            `;
            expandBtn.title = 'Expand code block';
            expandBtn.setAttribute('aria-label', 'Expand code block');
            
            // Position button relative to copy button if it exists
            const copyBtn = codeBlock.querySelector('.md-clipboard');
            if (copyBtn) {
                // Insert expand button before copy button
                copyBtn.parentNode.insertBefore(expandBtn, copyBtn);
            } else {
                // No copy button, add to code block
                codeBlock.style.position = 'relative';
                codeBlock.appendChild(expandBtn);
            }
            
            // Add click handler
            expandBtn.addEventListener('click', function() {
                expandCodeBlock(codeBlock);
            });
        });
    }
    
    function expandCodeBlock(codeBlock) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'code-modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'code-modal-content';
        
        // Create header with title and close button
        const header = document.createElement('div');
        header.className = 'code-modal-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Expanded Code View';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'code-modal-close';
        closeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
        `;
        closeBtn.title = 'Close expanded view';
        closeBtn.setAttribute('aria-label', 'Close expanded view');
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Clone the code block
        const expandedCodeBlock = codeBlock.cloneNode(true);
        expandedCodeBlock.className = 'code-modal-block';
        
        // Remove expand button from cloned block
        const expandBtn = expandedCodeBlock.querySelector('.code-expand-btn');
        if (expandBtn) {
            expandBtn.remove();
        }
        
        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(expandedCodeBlock);
        modal.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(modal);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Close handlers
        function closeModal() {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }
        
        closeBtn.addEventListener('click', closeModal);
        
        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on Escape key
        function handleKeydown(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        }
        document.addEventListener('keydown', handleKeydown);
        
        // Focus management
        closeBtn.focus();
    }
    
    // Re-initialize when page content changes (for SPA navigation)
    document.addEventListener('DOMContentLoaded', initCodeExpand);
    
    // Handle Material's instant loading
    if (typeof app !== 'undefined' && app.router) {
        app.router.subscribe(function() {
            setTimeout(initCodeExpand, 100);
        });
    }
});