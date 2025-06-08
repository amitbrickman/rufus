// Load fonts
const fontStylesheet = document.createElement('link');
fontStylesheet.rel = 'stylesheet';
fontStylesheet.href = 'https://fonts.googleapis.com/css2?family=Assistant:wght@400;600&family=Poppins:wght@400;600&display=swap';
document.head.appendChild(fontStylesheet);

// Function to detect dark mode
function isDarkMode() {
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const rgb = bodyBg.match(/\d+/g);
    if (!rgb) return false;

    // Calculate relative luminance
    const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
    return brightness < 128;
}

// Function to get theme colors
function getThemeColors() {
    const darkMode = isDarkMode();
    return {
        background: darkMode ? '#1E1E1E' : 'white',
        headerBg: darkMode ? '#2C2C2C' : '#f8f9fa',
        text: darkMode ? '#E0E0E0' : '#333',
        border: darkMode ? '#404040' : '#eee',
        hoverBg: darkMode ? '#2A2A2A' : '#f8f9fa',
        containerBg: darkMode ? '#242424' : 'white',
        shadowColor: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
        secondaryText: darkMode ? '#9ca3af' : '#6b7280'
    };
}

// Function to setup tooltip styles
function setupTooltipStyles() {
    if (document.getElementById('rufus-tooltip-style')) return;

    const colors = getThemeColors();
    const tooltipStyle = document.createElement('style');
    tooltipStyle.id = 'rufus-tooltip-style';
    tooltipStyle.textContent = `
        .rufus-tooltip-wrapper {
            position: relative;
            display: inline-flex;
        }

        .rufus-tooltip-wrapper:before {
            content: attr(data-tooltip);
            position: absolute;
            top: 100%;
            left: 0;
            transform: translateY(8px);
            padding: 6px 10px;
            border-radius: 6px;
            background: ${colors.headerBg};
            color: ${colors.text};
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            border: 1px solid ${colors.border};
            pointer-events: none;
            box-shadow: 0 4px 6px ${colors.shadowColor};
            z-index: 999999;
        }

        .rufus-tooltip-wrapper:hover:before {
            opacity: 1;
            visibility: visible;
        }

        /* RTL tooltip positioning */
        .rufus-rtl .rufus-tooltip-wrapper[data-tooltip="Copy table as Markdown"]:before {
            left: auto;
            right: 0;
        }

        /* Specific positioning for download button tooltip */
        .rufus-tooltip-wrapper[data-tooltip="Download as PNG"]:before {
            left: 50%;
            transform: translateX(-50%) translateY(8px);
        }

        /* Cell content tooltip */
        .rufus-cell-tooltip {
            position: fixed;
            padding: 6px 10px;
            border-radius: 6px;
            background: ${colors.headerBg};
            color: ${colors.text};
            font-size: 12px;
            white-space: nowrap;
            border: 1px solid ${colors.border};
            pointer-events: none;
            box-shadow: 0 4px 6px ${colors.shadowColor};
            z-index: 999999;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
        }

        .rufus-cell-tooltip.visible {
            opacity: 1;
            visibility: visible;
        }
    `;
    document.head.appendChild(tooltipStyle);
}

// Function to create a tooltip wrapper
function createTooltipWrapper(tooltipText) {
    const wrapper = document.createElement('div');
    wrapper.className = 'rufus-tooltip-wrapper';
    wrapper.setAttribute('data-tooltip', tooltipText);
    wrapper.style.cssText = `
        display: inline-flex;
        position: relative;
        align-items: center;
        justify-content: center;
        overflow: visible;
    `;
    return wrapper;
}

// Function to wrap element with tooltip
function wrapWithTooltip(element, tooltipText) {
    const wrapper = document.createElement('div');
    wrapper.className = 'rufus-tooltip-wrapper';
    wrapper.setAttribute('data-tooltip', tooltipText);
    wrapper.style.cssText = `
        display: inline-flex;
        position: relative;
    `;

    // Wrap the element
    element.parentNode?.replaceChild(wrapper, element);
    wrapper.appendChild(element);

    return wrapper;
}

// Function to detect if text contains Hebrew
function isHebrew(text) {
    return /[\u0590-\u05FF]/.test(text);
}

// Function to detect if table is primarily Hebrew
function isHebrewTable(table) {
    let hebrewCount = 0;
    let totalCells = 0;

    // Check header cells
    table.querySelectorAll('th').forEach(th => {
        totalCells++;
        if (isHebrew(th.textContent)) hebrewCount++;
    });

    // Check first row of data cells
    const firstRow = table.querySelector('tr:not(:first-child)');
    if (firstRow) {
        firstRow.querySelectorAll('td').forEach(td => {
            totalCells++;
            if (isHebrew(td.textContent)) hebrewCount++;
        });
    }

    // Consider table Hebrew if more than 50% of checked cells contain Hebrew
    return hebrewCount / totalCells > 0.5;
}

// Function to check if an element contains a table
function containsTable(element) {
    return element.querySelector('table') !== null;
}

// Function to beautify existing table
function beautifyExistingTable(tableElement) {
    const colors = getThemeColors();
    setupTooltipStyles();

    // Create container
    const container = document.createElement('div');
    container.className = 'rufus-table-container';
    container.dataset.rufusPrettified = 'true';

    // Check if table is RTL
    const isRTL = isHebrewTable(tableElement);
    if (isRTL) {
        container.classList.add('rufus-rtl');
    }

    container.style.cssText = `
        position: relative;
        background: ${colors.containerBg};
        border-radius: 16px;
        overflow: hidden;
        margin: 24px 0;
        width: 100%;
        border: 1px solid ${colors.border};
        direction: ${isRTL ? 'rtl' : 'ltr'};
    `;

    // Add header with action buttons
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        border-bottom: 1px solid ${colors.border};
        background: ${colors.containerBg};
        position: relative;
        overflow: visible;
        direction: ${isRTL ? 'rtl' : 'ltr'};
    `;

    // Create buttons with their wrappers
    const { wrapper: copyWrapper, button: copyButton } = createCopyButton(colors);
    const { wrapper: downloadWrapper, button: downloadButton } = createDownloadButton(colors);

    // Ensure proper positioning context and overflow
    copyWrapper.style.cssText += 'position: relative; overflow: visible; padding: 0 1px;';
    downloadWrapper.style.cssText += 'position: relative; overflow: visible; padding: 0 1px;';

    // Add click handlers
    copyButton.onclick = async () => {
        // Get all rows including headers
        const rows = tableElement.querySelectorAll('tr');

        // Process header row and calculate column widths
        const headerCells = rows[0]?.querySelectorAll('th');
        const columnWidths = new Map();
        let markdownText = '';
        let htmlText = '<table style="border-collapse: collapse; width: 100%;">\n';

        if (headerCells.length > 0) {
            // First pass: calculate maximum width for each column
            Array.from(rows).forEach(row => {
                const cells = row.querySelectorAll('th, td');
                cells.forEach((cell, index) => {
                    const content = cell.textContent.trim();
                    const currentMax = columnWidths.get(index) || 0;
                    columnWidths.set(index, Math.max(currentMax, content.length));
                });
            });

            // Add header row with proper spacing for markdown
            markdownText += '| ' + Array.from(headerCells).map((cell, index) => {
                const content = cell.textContent.trim();
                const width = columnWidths.get(index);
                return content.padEnd(width, ' ');
            }).join(' | ') + ' |\n';

            // Add separator row for markdown
            markdownText += '| ' + Array.from(headerCells).map((_, index) => {
                const width = columnWidths.get(index);
                return '-'.repeat(width);
            }).join(' | ') + ' |\n';

            // Add header row for HTML
            htmlText += '<thead>\n<tr>\n';
            Array.from(headerCells).forEach(cell => {
                htmlText += `  <th style="border: 1px solid #ddd; padding: 8px; text-align: ${isHebrew(cell.textContent) ? 'right' : 'left'};">${cell.textContent.trim()}</th>\n`;
            });
            htmlText += '</tr>\n</thead>\n<tbody>\n';
        }

        // Process data rows
        Array.from(rows).slice(1).forEach(row => {
            const cells = row.querySelectorAll('td');

            // Add markdown row
            markdownText += '| ' + Array.from(cells).map((cell, index) => {
                const content = cell.textContent.trim();
                const width = columnWidths.get(index);
                return content.padEnd(width, ' ');
            }).join(' | ') + ' |\n';

            // Add HTML row
            htmlText += '<tr>\n';
            Array.from(cells).forEach(cell => {
                htmlText += `  <td style="border: 1px solid #ddd; padding: 8px; text-align: ${isHebrew(cell.textContent) ? 'right' : 'left'};">${cell.textContent.trim()}</td>\n`;
            });
            htmlText += '</tr>\n';
        });

        htmlText += '</tbody>\n</table>';

        try {
            // Create a clipboard item with both formats
            const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([markdownText], { type: 'text/plain' }),
                'text/html': new Blob([htmlText], { type: 'text/html' })
            });

            await navigator.clipboard.write([clipboardItem]);

            copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
            `;
            setTimeout(() => {
                copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <g fill="currentColor">
                            <path d="M16.5 6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3v-6A4.5 4.5 0 0 1 10.5 6h6Z"/>
                            <path d="M18 7.5a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 3-3H18Z"/>
                        </g>
                    </svg>
                `;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    downloadButton.onclick = () => {
        captureAndDownloadTable(container);
    };

    // Add wrapped buttons to header
    header.appendChild(copyWrapper);
    header.appendChild(downloadWrapper);
    container.appendChild(header);

    // Create table wrapper for horizontal scroll
    const tableWrapper = document.createElement('div');
    tableWrapper.style.cssText = `
        overflow-x: auto;
        width: 100%;
        min-width: 100%;
        scrollbar-width: thin;
        scrollbar-color: ${colors.border} transparent;
    `;

    // Clone and modify the table
    const newTable = tableElement.cloneNode(true);
    newTable.className = 'rufus-table';

    // Apply styles to table elements
    newTable.style.cssText = `
        border-collapse: separate !important;
        border-spacing: 0 !important;
        width: 100% !important;
        min-width: max-content !important;
        margin: 0 !important;
        background-color: ${colors.containerBg} !important;
        font-size: 14px !important;
    `;

    // Style header cells
    const textAlign = isRTL ? 'right' : 'left';
    const direction = isRTL ? 'rtl' : 'ltr';

    newTable.style.direction = direction;

    newTable.querySelectorAll('th').forEach(th => {
        const font = isHebrew(th.textContent) ? 'Assistant' : 'Poppins';
        th.style.cssText = `
            background-color: ${colors.headerBg} !important;
            color: ${colors.secondaryText} !important;
            font-weight: 500 !important;
            padding: 16px 24px !important;
            text-align: ${textAlign} !important;
            font-size: 13px !important;
            border: none !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 250px !important;
            font-family: ${font}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            position: relative !important;
        `;
        addTooltipToElement(th);
    });

    // Style data cells
    newTable.querySelectorAll('td').forEach(td => {
        const font = isHebrew(td.textContent) ? 'Assistant' : 'Poppins';
        td.style.cssText = `
            padding: 16px 24px !important;
            border-bottom: 1px solid ${colors.border} !important;
            font-size: 14px !important;
            color: ${colors.text} !important;
            background: ${colors.containerBg} !important;
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
            text-align: ${textAlign} !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 250px !important;
            font-family: ${font}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
            outline: none !important;
            -webkit-tap-highlight-color: transparent !important;
            user-select: text !important;
            transition: background-color 0.15s ease-in-out !important;
            position: relative !important;
        `;
        addTooltipToElement(td);
    });

    // Add hover and focus effect to rows
    newTable.querySelectorAll('tr').forEach(tr => {
        const highlightRow = () => {
            requestAnimationFrame(() => {
                tr.style.backgroundColor = `${colors.hoverBg} !important`;
                tr.querySelectorAll('td').forEach(td => {
                    td.style.backgroundColor = `${colors.hoverBg} !important`;
                });
            });
        };

        const resetRow = () => {
            requestAnimationFrame(() => {
                tr.style.backgroundColor = '';
                tr.querySelectorAll('td').forEach(td => {
                    td.style.backgroundColor = `${colors.containerBg} !important`;
                });
            });
        };

        // Handle hover
        tr.addEventListener('mouseenter', highlightRow);
        tr.addEventListener('mouseleave', resetRow);

        // Handle focus and click
        tr.querySelectorAll('td').forEach(td => {
            td.addEventListener('focus', () => {
                highlightRow();
            });

            td.addEventListener('blur', () => {
                resetRow();
            });

            // Make cells focusable
            td.tabIndex = 0;

            // Handle click without preventing default behavior
            td.addEventListener('mousedown', () => {
                highlightRow();
            });

            // Reset on mouseup if we're not still hovering
            td.addEventListener('mouseup', () => {
                if (!td.matches(':hover')) {
                    resetRow();
                }
            });
        });
    });

    tableWrapper.appendChild(newTable);
    container.appendChild(tableWrapper);

    // Add footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 8px 16px;
        font-size: 12px;
        color: ${colors.secondaryText};
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        border-top: 1px solid ${colors.border};
        background: ${colors.containerBg};
    `;
    footer.innerHTML = 'Generated with <a href="https://github.com/amitbrickman/rufus" target="_blank">rufus / @amitbrickman</a>';
    container.appendChild(footer);

    return container;
}

// Function to beautify the content
function beautifyContent(element) {
    const table = element.querySelector('table');
    if (table) {
        const beautifiedTable = beautifyExistingTable(table);

        // Find the table wrapper and container
        const tableWrapper = table.closest('._tableWrapper_16hzy_14');
        const tableContainer = table.closest('._tableContainer_16hzy_1');

        if (tableContainer) {
            // Replace the entire container
            tableContainer.replaceWith(beautifiedTable);
        } else if (tableWrapper) {
            // Replace the wrapper
            tableWrapper.replaceWith(beautifiedTable);
        } else {
            // Direct table replacement
            table.replaceWith(beautifiedTable);
        }
    }
}

// Function to load external script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (window.htmlToImage) {
            resolve(window.htmlToImage);
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(window.htmlToImage);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Function to capture and download table
function captureAndDownloadTable(table) {
    if (typeof html2canvas !== 'undefined') {
        console.log('Starting capture process...');

        const targetElement = table.closest('[data-rufus-prettified="true"]');
        if (!targetElement) {
            console.error('Could not find prettified table container');
            return;
        }

        // Get the actual table element
        const tableElement = targetElement.querySelector('table');
        if (!tableElement) {
            console.error('Could not find table element');
            return;
        }

        // Calculate full dimensions including scrolled content
        const scrollContainer = targetElement.querySelector('div[style*="overflow-x"]');
        const fullWidth = scrollContainer ? scrollContainer.scrollWidth : targetElement.offsetWidth;

        // Calculate total height by summing up all row heights
        const headerHeight = 56; // Height of the header row
        const allRows = Array.from(tableElement.querySelectorAll('tr')); // Get ALL rows including header
        const rowHeight = 56; // Height of each row
        const fullHeight = rowHeight * allRows.length; // Total height for all rows

        console.log('Dimensions:', {
            fullWidth,
            fullHeight,
            totalRows: allRows.length,
            scrollWidth: scrollContainer?.scrollWidth,
            clientWidth: scrollContainer?.clientWidth
        });

        // Load fonts before rendering
        document.fonts.ready.then(() => {
            // Create canvas with device pixel ratio consideration
            const scale = window.devicePixelRatio || 1;
            const canvas = document.createElement('canvas');
            canvas.width = fullWidth * scale;
            canvas.height = fullHeight * scale;

            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);

            // Enable font smoothing
            ctx.textRendering = 'optimizeLegibility';
            ctx.imageSmoothingEnabled = true;

            // Fill background
            ctx.fillStyle = getThemeColors().containerBg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw rounded rectangle for container
            ctx.save();
            const radius = 16;
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(fullWidth - radius, 0);
            ctx.quadraticCurveTo(fullWidth, 0, fullWidth, radius);
            ctx.lineTo(fullWidth, fullHeight - radius);
            ctx.quadraticCurveTo(fullWidth, fullHeight, fullWidth - radius, fullHeight);
            ctx.lineTo(radius, fullHeight);
            ctx.quadraticCurveTo(0, fullHeight, 0, fullHeight - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.clip();

            // Calculate column widths from the actual table
            const headerCells = Array.from(tableElement.querySelectorAll('th'));
            const columnWidths = headerCells.map(cell => {
                const width = cell.getBoundingClientRect().width;
                console.log(`Column width for ${cell.textContent}:`, width);
                return width;
            });

            // Determine if this is a Hebrew table
            const isHebrewTable = Array.from(tableElement.querySelectorAll('th, td')).some(cell => isHebrew(cell.textContent));

            // Get and possibly reverse column information
            let headerCellsArray = Array.from(headerCells);
            let columnWidthsArray = columnWidths.slice();

            if (isHebrewTable) {
                headerCellsArray = headerCellsArray.reverse();
                columnWidthsArray = columnWidthsArray.reverse();
            }

            // Draw all rows
            allRows.forEach((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll('td, th'));
                if (isHebrewTable) {
                    cells.reverse();
                }

                const currentY = rowIndex * rowHeight;
                let currentX = 0;

                // Draw row background
                ctx.fillStyle = rowIndex === 0 ? getThemeColors().headerBg :
                    (rowIndex % 2 === 1 ? getThemeColors().containerBg : getThemeColors().hoverBg);
                ctx.fillRect(0, currentY, fullWidth, rowHeight);

                // Draw cells
                cells.forEach((cell, columnIndex) => {
                    const cellWidth = columnWidthsArray[columnIndex];
                    const text = cell.textContent;
                    const padding = 24;

                    // Set appropriate font
                    const isHebrewText = isHebrew(text);
                    const isHeader = cell.tagName.toLowerCase() === 'th';

                    ctx.font = `${isHeader ? '500' : '400'} ${isHeader ? '13px' : '14px'} ${isHebrewText ? 'Assistant' : 'Poppins'}`;
                    ctx.fillStyle = isHeader ? getThemeColors().secondaryText : getThemeColors().text;
                    ctx.textBaseline = 'middle';

                    // Calculate text width for overflow
                    const textWidth = ctx.measureText(text).width;
                    const maxWidth = cellWidth - (padding * 2);

                    // Set text alignment and position
                    if (isHebrewTable) {
                        ctx.textAlign = 'right';
                        if (textWidth > maxWidth) {
                            let truncated = text;
                            while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
                                truncated = truncated.slice(0, -1);
                            }
                            ctx.fillText(truncated + '...', currentX + cellWidth - padding, currentY + rowHeight / 2);
                        } else {
                            ctx.fillText(text, currentX + cellWidth - padding, currentY + rowHeight / 2);
                        }
                    } else {
                        ctx.textAlign = 'left';
                        if (textWidth > maxWidth) {
                            let truncated = text;
                            while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
                                truncated = truncated.slice(0, -1);
                            }
                            ctx.fillText(truncated + '...', currentX + padding, currentY + rowHeight / 2);
                        } else {
                            ctx.fillText(text, currentX + padding, currentY + rowHeight / 2);
                        }
                    }

                    currentX += cellWidth;
                });

                // Draw row border (except for header)
                if (rowIndex > 0) {
                    ctx.strokeStyle = getThemeColors().border;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, currentY);
                    ctx.lineTo(fullWidth, currentY);
                    ctx.stroke();
                }
            });

            ctx.restore();

            // Convert to PNG and download
            try {
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'GPT-table-capture-by-rufus.png';
                link.href = dataUrl;
                link.click();
                console.log('Download initiated');
            } catch (e) {
                console.error('Error creating data URL:', e);
            }
        });
    } else {
        console.error('html2canvas library not loaded');
    }
}

// Function to position tooltip
function positionTooltip(tooltipElement, targetElement) {
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const spacing = 8; // Space between tooltip and element
    const viewportPadding = 10; // Minimum space from viewport edges

    // Default to positioning above
    let top = -tooltipRect.height - spacing;
    let left = (targetRect.width - tooltipRect.width) / 2;

    // If tooltip would go off the left side
    if (targetRect.left + left < viewportPadding) {
        left = -targetRect.left + viewportPadding;
    }
    // If tooltip would go off the right side
    else if (targetRect.left + left + tooltipRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - viewportPadding - tooltipRect.width - targetRect.left;
    }

    // If not enough space above, position below
    if (targetRect.top + top < viewportPadding) {
        top = targetRect.height + spacing;
    }

    return { top, left };
}

// Function to create and show tooltip
function showTooltip(element, text) {
    const colors = getThemeColors();
    const tooltip = document.createElement('div');
    tooltip.className = 'rufus-tooltip';
    tooltip.textContent = text;
    tooltip.style.opacity = '0';

    // Add tooltip to the target element instead of body
    element.style.position = 'relative';
    element.appendChild(tooltip);

    const updatePosition = () => {
        const { top, left } = positionTooltip(tooltip, element);
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    };

    // Initial position
    updatePosition();

    // Show tooltip with a small delay
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        updatePosition(); // Update position again after content is rendered
    });

    // Update position on scroll or resize
    const handleScroll = () => requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Return cleanup function
    return {
        tooltip,
        cleanup: () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleScroll);
            element.removeChild(tooltip);
        }
    };
}

// Function to add tooltip to element
function addTooltipToElement(element) {
    let tooltip = null;

    const showTooltip = (e) => {
        // Check for overflow
        if (element.offsetWidth < element.scrollWidth) {
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'rufus-cell-tooltip';
                tooltip.textContent = element.textContent;
                document.body.appendChild(tooltip);
            }

            const rect = element.getBoundingClientRect();
            const tooltipWidth = tooltip.offsetWidth;
            const viewportWidth = window.innerWidth;

            // Position above the element
            let top = rect.top - tooltip.offsetHeight - 8;
            let left = rect.left;

            // Adjust horizontal position if it would overflow
            if (left + tooltipWidth > viewportWidth) {
                left = viewportWidth - tooltipWidth - 16;
            }

            // If tooltip would go above viewport, position it below the element
            if (top < 8) {
                top = rect.bottom + 8;
            }

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.classList.add('visible');
        }
    };

    const hideTooltip = () => {
        if (tooltip) {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
                tooltip = null;
            }, 200);
        }
    };

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
}

// Function to convert button to download button
function convertToDownloadButton(actionButton, colors) {
    actionButton.innerHTML = `
        <span style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; direction: ltr;">
            Download
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" style="margin-top: 1px;">
                <path fill="currentColor" fill-rule="evenodd" d="M8 1a.75.75 0 0 1 .75.75V6h-1.5V1.75A.75.75 0 0 1 8 1Zm-.75 5v3.296l-.943-1.048a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.114 0l2.25-2.5a.75.75 0 0 0-1.114-1.004L8.75 9.296V6h2A2.25 2.25 0 0 1 13 8.25v4.5A2.25 2.25 0 0 1 10.75 15h-5.5A2.25 2.25 0 0 1 3 12.75v-4.5A2.25 2.25 0 0 1 5.25 6h2ZM7 16.75v-.25h3.75a3.75 3.75 0 0 0 3.75-3.75V10h.25A2.25 2.25 0 0 1 17 12.25v4.5A2.25 2.25 0 0 1 14.75 19h-5.5A2.25 2.25 0 0 1 7 16.75Z" clip-rule="evenodd"/>
            </svg>
        </span>
    `;
    actionButton.title = 'Download as PNG';
    actionButton.className = 'rufus-button primary';
    actionButton.style.border = '1px solid #ed3251';

    // Update click handler for download functionality
    actionButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prettifiedTable = document.querySelector('[data-rufus-prettified="true"]');
        if (prettifiedTable) {
            // Change text to "Downloaded!"
            const originalContent = actionButton.innerHTML;
            actionButton.innerHTML = `
                <span style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; direction: ltr;">
                    Downloaded!
                </span>
            `;
            actionButton.style.pointerEvents = 'none'; // Prevent multiple clicks

            // Capture and download
            captureAndDownloadTable(prettifiedTable);

            // Reset button after 2 seconds
            setTimeout(() => {
                actionButton.innerHTML = originalContent;
                actionButton.style.pointerEvents = 'auto';
            }, 2000);
        }
    };

    // Add hover effect
    actionButton.addEventListener('mouseenter', () => {
        actionButton.style.transform = 'scale(1.05)';
        actionButton.style.boxShadow = `0 4px 12px ${colors.shadowColor}`;
    });

    actionButton.addEventListener('mouseleave', () => {
        actionButton.style.transform = 'scale(1)';
        actionButton.style.boxShadow = `0 2px 8px ${colors.shadowColor}`;
    });
}

// Function to add beautify button
function addBeautifyButton(table) {
    // Don't add button if table is already prettified
    const container = table.closest('._tableContainer_16hzy_1');
    if (container && container.querySelector('[data-rufus-prettified="true"]')) return;
    if (table.closest('[data-rufus-prettified="true"]')) return;

    const colors = getThemeColors();

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'rufus-button-container';
    buttonContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
    `;

    // Create prettify button
    const prettifyButton = document.createElement('button');
    prettifyButton.className = 'rufus-button primary';
    prettifyButton.dataset.tableId = table.dataset.start;
    prettifyButton.dataset.theme = isDarkMode() ? 'dark' : 'light';
    prettifyButton.innerHTML = `
        <span style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; direction: ltr;">
            Prettify
        </span>
    `;
    prettifyButton.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        border-radius: 8px;
        background: ${colors.containerBg};
        border: 1px solid #ed3251;
        color: ${colors.text};
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px ${colors.shadowColor};
        font-size: 14px;
        font-weight: 500;
        height: 36px;
        min-width: 120px;
        direction: ltr;
    `;

    // Add hover effect
    prettifyButton.addEventListener('mouseenter', () => {
        prettifyButton.style.transform = 'scale(1.05)';
        prettifyButton.style.boxShadow = `0 4px 12px ${colors.shadowColor}`;
    });

    prettifyButton.addEventListener('mouseleave', () => {
        prettifyButton.style.transform = 'scale(1)';
        prettifyButton.style.boxShadow = `0 2px 8px ${colors.shadowColor}`;
    });

    // Click handler for prettify button
    prettifyButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const container = table.closest('._tableContainer_16hzy_1') || table.parentElement;
        beautifyContent(container);
        // Remove the button container after prettifying
        buttonContainer.remove();
    });

    // Add button to container
    buttonContainer.appendChild(prettifyButton);

    // Insert button container
    if (container) {
        container.parentNode.insertBefore(buttonContainer, container.nextSibling);
    } else {
        table.parentNode.insertBefore(buttonContainer, table.nextSibling);
    }
}

// Function to process a single table
function processTable(table) {
    if (!table || !table.dataset.start) return;
    addBeautifyButton(table);
}

// Function to check for tables
function checkForTables() {
    // Find all tables
    const tables = document.querySelectorAll('table');
    tables.forEach(processTable);
}

// Initial check
checkForTables();

// Create observer for dynamic content
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'TABLE') {
                    processTable(node);
                } else {
                    const tables = node.getElementsByTagName('table');
                    Array.from(tables).forEach(processTable);
                }
            }
        });
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Update the copy button creation
function createCopyButton(colors) {
    const wrapper = createTooltipWrapper('Copy table as Markdown');
    const copyButton = document.createElement('button');
    copyButton.style.cssText = `
        padding: 8px;
        border: 1px solid ${colors.border};
        background: ${colors.containerBg};
        cursor: pointer;
        color: ${colors.secondaryText};
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
        width: 35px;
        height: 35px;
    `;
    copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <g fill="currentColor">
                <path d="M16.5 6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3v-6A4.5 4.5 0 0 1 10.5 6h6Z"/>
                <path d="M18 7.5a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 3-3H18Z"/>
            </g>
        </svg>
    `;

    // Add hover effect
    copyButton.addEventListener('mouseenter', () => {
        copyButton.style.backgroundColor = colors.hoverBg;
        copyButton.style.color = colors.text;
    });
    copyButton.addEventListener('mouseleave', () => {
        copyButton.style.backgroundColor = colors.containerBg;
        copyButton.style.color = colors.secondaryText;
    });

    wrapper.appendChild(copyButton);
    return { wrapper, button: copyButton };
}

// Update the download button creation
function createDownloadButton(colors) {
    const wrapper = createTooltipWrapper('Download as PNG');
    const downloadButton = document.createElement('button');
    downloadButton.style.cssText = `
        padding: 8px;
        border: 1px solid ${colors.border};
        background: ${colors.containerBg};
        cursor: pointer;
        color: ${colors.secondaryText};
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
        width: 35px;
        height: 35px;
    `;
    downloadButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <g fill="currentColor">
                <path fill-rule="evenodd" d="M9.75 6.75h-3a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3h7.5a3 3 0 0 0 3-3v-7.5a3 3 0 0 0-3-3h-3V1.5a.75.75 0 0 0-1.5 0v5.25Zm0 0h1.5v5.69l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72V6.75Z" clip-rule="evenodd"/>
                <path d="M7.151 21.75a2.999 2.999 0 0 0 2.599 1.5h7.5a3 3 0 0 0 3-3v-7.5a3 3 0 0 0-1.5-2.599v7.099a4.5 4.5 0 0 1-4.5 4.5H7.151Z"/>
            </g>
        </svg>
    `;

    // Add hover effect
    downloadButton.addEventListener('mouseenter', () => {
        downloadButton.style.backgroundColor = colors.hoverBg;
        downloadButton.style.color = colors.text;
    });
    downloadButton.addEventListener('mouseleave', () => {
        downloadButton.style.backgroundColor = colors.containerBg;
        downloadButton.style.color = colors.secondaryText;
    });

    wrapper.appendChild(downloadButton);
    return { wrapper, button: downloadButton };
} 