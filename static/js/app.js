document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const typeFilter = document.getElementById('type-filter');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const notesContainer = document.getElementById('notes-container');
    const retryBtn = document.getElementById('retry-btn');
    
    // Stats elements
    const statsSection = document.getElementById('stats-section');
    const statTotal = document.getElementById('stat-total');
    const statFeatures = document.getElementById('stat-features');
    const statIssues = document.getElementById('stat-issues');

    // Tweet modal elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const submitTweetBtn = document.getElementById('submit-tweet-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const hashtagChips = document.querySelectorAll('.hashtag-chip');

    // Theme Toggle Elements
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const iconSun = themeToggleBtn.querySelector('.icon-sun');
    const iconMoon = themeToggleBtn.querySelector('.icon-moon');

    let allParsedItems = [];
    let currentTweetLink = '';

    // Type translations for Japanese UI
    const typeLabels = {
        feature: '新機能',
        changed: '変更点',
        deprecated: '非推奨',
        issue: '問題点',
        other: 'その他'
    };

    // Initialize application
    initTheme();
    fetchReleaseNotes();

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    typeFilter.addEventListener('change', filterAndRenderNotes);

    // Modal Event Listeners
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });
    tweetTextarea.addEventListener('input', updateCharCount);
    hashtagChips.forEach(chip => {
        chip.addEventListener('click', () => {
            toggleHashtag(chip);
        });
    });
    submitTweetBtn.addEventListener('click', submitTweet);

    // Theme Switcher Logic
    themeToggleBtn.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light-theme');
        if (isLight) {
            localStorage.setItem('theme', 'light');
            iconSun.style.display = 'inline-block';
            iconMoon.style.display = 'none';
        } else {
            localStorage.setItem('theme', 'dark');
            iconSun.style.display = 'none';
            iconMoon.style.display = 'inline-block';
        }
    });

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.documentElement.classList.add('light-theme');
            iconSun.style.display = 'inline-block';
            iconMoon.style.display = 'none';
        } else {
            document.documentElement.classList.remove('light-theme');
            iconSun.style.display = 'none';
            iconMoon.style.display = 'inline-block';
        }
    }



    // Fetch feed from backend API
    async function fetchReleaseNotes() {
        showState('loading');
        
        try {
            const response = await fetch('/api/release-notes');
            if (!response.ok) {
                throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                processAndStoreNotes(data.entries);
                filterAndRenderNotes();
            } else {
                throw new Error(data.message || '不明なサーバーエラーが発生しました');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            errorMessage.textContent = `エラー詳細: ${error.message}。インターネット接続を確認するか、しばらく経ってから再度お試しください。`;
            showState('error');
        }
    }

    // Process Raw entries and break them down by h3 elements
    function processAndStoreNotes(entries) {
        allParsedItems = [];
        
        entries.forEach(entry => {
            const parsedItems = parseEntryContent(entry.content);
            
            parsedItems.forEach(item => {
                allParsedItems.push({
                    date: formatJapaneseDate(entry.title), // Format to Japanese date
                    rawDate: entry.title, // Keep original E.g., "June 15, 2026"
                    isoDate: entry.updated,
                    link: entry.link,
                    type: item.type,
                    html: item.html,
                    text: item.text
                });
            });
        });

        // Update stats summary
        updateStats();
    }

    // Convert date string like "June 15, 2026" to "2026年6月15日"
    function formatJapaneseDate(dateStr) {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return dateStr; // Fallback
            }
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        } catch (e) {
            return dateStr;
        }
    }

    // Parse HTML content using DOMParser to break up by H3 headers
    function parseEntryContent(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const items = [];
        
        const children = Array.from(doc.body.children);
        let currentType = 'Other';
        let currentElements = [];
        
        children.forEach(child => {
            if (child.tagName === 'H3') {
                // Save the preceding section if it exists
                if (currentElements.length > 0) {
                    items.push({
                        type: currentType,
                        html: currentElements.map(el => el.outerHTML).join(''),
                        text: currentElements.map(el => el.textContent).join(' ')
                    });
                    currentElements = [];
                }
                currentType = child.textContent.trim();
            } else {
                currentElements.push(child);
            }
        });
        
        // Save final section
        if (currentElements.length > 0) {
            items.push({
                type: currentType,
                html: currentElements.map(el => el.outerHTML).join(''),
                text: currentElements.map(el => el.textContent).join(' ')
            });
        }
        
        // Fallback
        if (items.length === 0 && htmlContent.trim() !== '') {
            items.push({
                type: 'Update',
                html: htmlContent,
                text: doc.body.textContent || ''
            });
        }
        
        return items;
    }

    // Update the Stats Dashboard
    function updateStats() {
        const total = allParsedItems.length;
        const features = allParsedItems.filter(item => item.type.toLowerCase() === 'feature').length;
        const issues = allParsedItems.filter(item => {
            const type = item.type.toLowerCase();
            return type === 'issue' || type === 'deprecated';
        }).length;

        statTotal.textContent = total;
        statFeatures.textContent = features;
        statIssues.textContent = issues;
        
        statsSection.style.display = total > 0 ? 'grid' : 'none';
    }

    // Filters notes based on select choice and renders them
    function filterAndRenderNotes() {
        const filterValue = typeFilter.value.toLowerCase();
        
        let filteredItems = allParsedItems;
        if (filterValue !== 'all') {
            if (filterValue === 'other') {
                const knownTypes = ['feature', 'changed', 'deprecated', 'issue'];
                filteredItems = allParsedItems.filter(item => !knownTypes.includes(item.type.toLowerCase()));
            } else {
                filteredItems = allParsedItems.filter(item => item.type.toLowerCase() === filterValue);
            }
        }

        if (filteredItems.length === 0) {
            showState('empty');
            return;
        }

        renderNotesList(filteredItems);
        showState('content');
    }

    // Renders the list of filtered items into the DOM
    function renderNotesList(items) {
        notesContainer.innerHTML = '';
        
        items.forEach(item => {
            const card = document.createElement('article');
            card.className = 'note-card';
            
            const typeClass = getSemanticTypeClass(item.type);
            const typeLabel = typeLabels[typeClass] || item.type;
            
            card.style.setProperty('--badge-color', `var(--color-${typeClass})`);

            card.innerHTML = `
                <div class="note-header">
                    <div class="note-meta">
                        <span class="badge badge-${typeClass}">${typeLabel}</span>
                        <time class="note-date" datetime="${item.isoDate}">
                            <i class="fa-regular fa-calendar"></i> ${item.date}
                        </time>
                    </div>
                    <div class="note-actions">
                        <button class="btn btn-secondary btn-utility btn-copy" aria-label="クリップボードにコピー" title="クリップボードにコピー">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                        <button class="btn btn-secondary btn-utility btn-csv" aria-label="CSVにエクスポート" title="CSVにエクスポート">
                            <i class="fa-solid fa-file-csv"></i>
                        </button>
                        <button class="btn btn-secondary btn-tweet" aria-label="X (旧Twitter) で共有">
                            <i class="fa-brands fa-x-twitter"></i> ツイート
                        </button>
                    </div>
                </div>
                <div class="note-content">
                    ${item.html}
                </div>
            `;

            // Attach Tweet handler
            const tweetBtn = card.querySelector('.btn-tweet');
            tweetBtn.addEventListener('click', () => {
                tweetUpdate(item.date, typeLabel, item.text, item.link);
            });

            // Attach Copy handler
            const copyBtn = card.querySelector('.btn-copy');
            copyBtn.addEventListener('click', () => {
                copyToClipboard(item.text, copyBtn);
            });

            // Attach CSV Export handler
            const csvBtn = card.querySelector('.btn-csv');
            csvBtn.addEventListener('click', () => {
                exportToCSV(item.date, typeLabel, item.text, item.link);
            });

            notesContainer.appendChild(card);
        });
    }


    // Maps update header types to semantic layout classes
    function getSemanticTypeClass(type) {
        const cleanType = type.toLowerCase();
        if (cleanType.includes('feature')) return 'feature';
        if (cleanType.includes('change') || cleanType.includes('updat')) return 'changed';
        if (cleanType.includes('deprecat')) return 'deprecated';
        if (cleanType.includes('issue')) return 'issue';
        return 'other';
    }

    // Construct tweet template and open editor modal
    function tweetUpdate(date, typeLabel, text, link) {
        // Build Japanese tweet text format
        const prefix = `【BigQuery アップデート】${date} [${typeLabel}] `;
        const maxTweetLen = 280;
        
        // Link reserved length (approx 23 chars for short link in twitter)
        const reservedLen = 30;
        const availableTextLen = maxTweetLen - prefix.length - reservedLen;
        
        let cleanContent = text.replace(/\s+/g, ' ').trim();
        if (cleanContent.length > availableTextLen) {
            cleanContent = cleanContent.substring(0, availableTextLen - 3) + '...';
        }
        
        const fullTweetText = `${prefix}${cleanContent}`;
        openTweetModal(fullTweetText, link);
    }

    function openTweetModal(text, link) {
        currentTweetLink = link;
        tweetTextarea.value = text;
        
        // Reset hashtag chip styles
        hashtagChips.forEach(chip => {
            chip.classList.remove('selected');
        });

        // Initialize state
        updateCharCount();
        
        // Show modal with animation
        tweetModal.style.display = 'flex';
        // Add tiny timeout to allow display change before transition class
        setTimeout(() => {
            tweetModal.classList.add('active');
        }, 10);
    }

    function closeTweetModal() {
        tweetModal.classList.remove('active');
        setTimeout(() => {
            tweetModal.style.display = 'none';
        }, 300); // match CSS transition duration
    }

    function updateCharCount() {
        const textLen = tweetTextarea.value.length;
        charCount.textContent = textLen;
        
        if (textLen > 280) {
            charCount.parentElement.classList.add('warning');
            submitTweetBtn.disabled = true;
        } else {
            charCount.parentElement.classList.remove('warning');
            submitTweetBtn.disabled = false;
        }
    }

    function toggleHashtag(chip) {
        const tag = chip.dataset.tag;
        let currentText = tweetTextarea.value;

        if (chip.classList.contains('selected')) {
            // Remove hashtag
            chip.classList.remove('selected');
            const regex = new RegExp(`\\s*${tag}\\b`, 'g');
            tweetTextarea.value = currentText.replace(regex, '').trim();
        } else {
            // Add hashtag
            chip.classList.add('selected');
            tweetTextarea.value = `${currentText} ${tag}`.trim();
        }
        updateCharCount();
    }

    function submitTweet() {
        const tweetText = tweetTextarea.value;
        const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(currentTweetLink)}`;
        window.open(intentUrl, '_blank', 'width=550,height=420');
        closeTweetModal();
    }

    function copyToClipboard(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = btnElement.innerHTML;
            btnElement.innerHTML = '<i class="fa-solid fa-check" style="color: var(--color-feature)"></i>';
            btnElement.disabled = true;
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('コピーに失敗しました。');
        });
    }

    function exportToCSV(date, typeLabel, text, link) {
        // Escape quotes in text
        const escapedText = text.replace(/"/g, '""').replace(/\s+/g, ' ').trim();
        const csvContent = `"Date","Category","Content","Link"\n"${date}","${typeLabel}","${escapedText}","${link}"\n`;
        
        // Use UTF-8 with BOM for Excel compatibility
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const linkElement = document.createElement('a');
        
        const cleanDate = date.replace(/年|月/g, '_').replace(/日/g, '');
        linkElement.setAttribute('href', url);
        linkElement.setAttribute('download', `bigquery_release_${cleanDate}_${typeLabel}.csv`);
        linkElement.style.visibility = 'hidden';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    }



    // Controls the visibility states of elements
    function showState(state) {
        const refreshIcon = refreshBtn.querySelector('.btn-icon');
        if (state === 'loading') {
            refreshIcon.classList.add('spinning');
            refreshBtn.disabled = true;
        } else {
            refreshIcon.classList.remove('spinning');
            refreshBtn.disabled = false;
        }

        loadingState.style.display = state === 'loading' ? 'flex' : 'none';
        errorState.style.display = state === 'error' ? 'flex' : 'none';
        emptyState.style.display = state === 'empty' ? 'flex' : 'none';
        notesContainer.style.display = state === 'content' ? 'flex' : 'none';
        
        if (state === 'loading' || state === 'error') {
            statsSection.style.display = 'none';
        } else if (allParsedItems.length > 0) {
            statsSection.style.display = 'grid';
        }
    }
});
