#!/usr/bin/env python3
"""
External Link Checker Hook for MkDocs
This hook validates external links and adds appropriate attributes
"""

import re
from urllib.parse import urlparse
import mkdocs.plugins

def on_page_content(html, page, config, files):
    """
    Process page content to enhance external links
    """
    # Add target="_blank" and rel attributes to external links
    def replace_external_link(match):
        full_match = match.group(0)
        href = match.group(1)
        
        # Parse the URL
        parsed = urlparse(href)
        
        # Check if it's an external link
        if parsed.netloc and parsed.netloc not in ['localhost', '127.0.0.1']:
            # Check if it's not the same domain as the site
            site_url = config.get('site_url', '')
            if site_url:
                site_domain = urlparse(site_url).netloc
                if parsed.netloc != site_domain:
                    # Add target and rel attributes if not present
                    if 'target=' not in full_match:
                        full_match = full_match.replace('href=', 'target="_blank" href=')
                    if 'rel=' not in full_match:
                        full_match = full_match.replace('href=', 'rel="noopener noreferrer" href=')
        
        return full_match
    
    # Pattern to match anchor tags with href attributes
    link_pattern = r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>'
    
    # Process the HTML content
    processed_html = re.sub(link_pattern, replace_external_link, html)
    
    return processed_html

def on_config(config):
    """
    Validate configuration
    """
    return config