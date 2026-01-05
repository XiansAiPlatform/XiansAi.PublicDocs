document.addEventListener('DOMContentLoaded', function() {
    // Make site title clickable and link to homepage
    function makeSiteTitleClickable() {
        const siteTitle = document.querySelector('.md-header__title');
        if (siteTitle) {
            siteTitle.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Navigate to the site root (home page)
                const currentPath = window.location.pathname;
                
                // If we're in a subdirectory, go to root
                if (currentPath !== '/' && currentPath !== '/index.html') {
                    window.location.href = '/';
                } else {
                    // Already at root, just refresh
                    window.location.href = '/';
                }
            });
        }
    }
    
    // Function to set external links to open in new tab
    function setExternalLinksTarget() {
        // Get all links on the page
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(function(link) {
            const href = link.getAttribute('href');
            
            // Check if it's an external link
            if (href && (
                href.startsWith('http://') || 
                href.startsWith('https://') ||
                href.startsWith('//')
            )) {
                // Don't modify links that are to the same domain or localhost
                if (!href.includes(window.location.hostname) && 
                    !href.includes('localhost') && 
                    !href.includes('127.0.0.1')) {
                    
                    // Set target to open in new tab
                    link.setAttribute('target', '_blank');
                    
                    // Add rel attributes for security
                    link.setAttribute('rel', 'noopener noreferrer');
                    
                    // Add title attribute for accessibility
                    if (!link.getAttribute('title')) {
                        link.setAttribute('title', 'Opens in new tab');
                    }
                }
            }
        });
    }
    
    // Run the functions when page loads
    makeSiteTitleClickable();
    setExternalLinksTarget();
    
    // Also run it when navigation changes (for SPAs)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if new content was added that might contain links
                const hasNewLinks = Array.from(mutation.addedNodes).some(node => {
                    return node.nodeType === Node.ELEMENT_NODE && 
                           (node.tagName === 'A' || node.querySelector('a'));
                });
                
                if (hasNewLinks) {
                    makeSiteTitleClickable();
                    setExternalLinksTarget();
                }
            }
        });
    });
    
    // Start observing changes to the document
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});