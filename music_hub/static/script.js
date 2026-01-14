// Music App - Main JavaScript File

class MusicApp {
    constructor() {
        this.init();
    }

    init() {
        // State Management
        this.state = {
            songs: [],
            currentSong: null,
            currentIndex: -1,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 0.8,
            currentPage: 'home',
            searchQuery: '',
            isMobile: window.innerWidth <= 768,
            isDraggingPlayer: false,
            dragStartY: 0,
            playerTransformY: 0
        };

        // DOM Elements
        this.elements = {
            // Header
            desktopHeader: document.querySelector('.desktop-header'),
            mobileHeader: document.querySelector('.mobile-header'),
            searchInput: document.getElementById('searchInput'),
            mobileSearchToggle: document.getElementById('mobileSearchToggle'),
            mobileSearchOverlay: document.getElementById('mobileSearch'),
            mobileSearchClose: document.querySelector('.mobile-search-close'),
            
            // Navigation
            navButtons: document.querySelectorAll('.nav-btn'),
            mobileNavButtons: document.querySelectorAll('.mobile-nav-btn'),
            
            // Pages
            pages: document.querySelectorAll('.page'),
            homePage: document.getElementById('homePage'),
            uploadPage: document.getElementById('uploadPage'),
            settingsPage: document.getElementById('settingsPage'),
            
            // Songs
            songsContainer: document.getElementById('songsContainer'),
            songsCount: document.getElementById('songsCount'),
            totalSongs: document.getElementById('totalSongs'),
            
            // Upload
            uploadDropzone: document.getElementById('uploadDropzone'),
            fileInput: document.getElementById('fileInput'),
            songTitle: document.getElementById('songTitle'),
            uploadSubmit: document.getElementById('uploadSubmit'),
            uploadProgress: document.getElementById('uploadProgress'),
            
            // Settings
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            
            // Player
            playerOverlay: document.getElementById('playerOverlay'),
            playerContainer: document.getElementById('playerContainer'),
            playerClose: document.getElementById('playerClose'),
            playerMiniBar: document.getElementById('playerMiniBar'),
            
            // Audio Player
            audioPlayer: document.getElementById('audioPlayer'),
            audioElement: document.getElementById('audioElement'),
            audioTitle: document.getElementById('audioTitle'),
            playBtn: document.getElementById('playBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            audioProgress: document.getElementById('audioProgress'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            
            // Video Player
            videoPlayer: document.getElementById('videoPlayer'),
            videoElement: document.getElementById('videoElement'),
            videoTitle: document.getElementById('videoTitle'),
            videoClose: document.getElementById('videoClose'),
            videoPlayBtn: document.getElementById('videoPlayBtn'),
            videoFullscreenBtn: document.getElementById('videoFullscreenBtn'),
            videoCurrentTime: document.getElementById('videoCurrentTime'),
            videoDuration: document.getElementById('videoDuration'),
            
            // Mini Player
            miniCover: document.getElementById('miniCover'),
            miniTitle: document.getElementById('miniTitle'),
            miniStatus: document.getElementById('miniStatus'),
            miniPlayBtn: document.getElementById('miniPlayBtn'),
            miniNextBtn: document.getElementById('miniNextBtn'),
            expandPlayer: document.getElementById('expandPlayer')
        };

        // Initialize
        this.initEventListeners();
        this.loadSongs();
        this.detectMobile();
        this.setupPlayerGestures();
    }

    // Event Listeners
    initEventListeners() {
        // Navigation
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPage(e.target.dataset.page));
        });

        this.elements.mobileNavButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPage(e.currentTarget.dataset.page));
        });

        // Search
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value;
            this.filterSongs();
        });

        this.elements.mobileSearchToggle?.addEventListener('click', () => {
            this.elements.mobileSearchOverlay.classList.toggle('active');
        });

        this.elements.mobileSearchClose?.addEventListener('click', () => {
            this.elements.mobileSearchOverlay.classList.remove('active');
        });

        // Upload
        this.elements.uploadDropzone?.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.elements.uploadDropzone?.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.elements.uploadDropzone?.addEventListener(eventName, () => {
                this.elements.uploadDropzone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.elements.uploadDropzone?.addEventListener(eventName, () => {
                this.elements.uploadDropzone.classList.remove('drag-over');
            });
        });

        this.elements.uploadDropzone?.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileSelect(file);
            }
        });

        this.elements.uploadSubmit?.addEventListener('click', () => {
            this.uploadSong();
        });

        // Settings
        this.elements.volumeSlider?.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
            this.elements.volumeValue.textContent = `${e.target.value}%`;
        });

        this.elements.clearAllBtn?.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من حذف جميع الأغاني؟ لا يمكن التراجع عن هذا الإجراء.')) {
                this.clearAllSongs();
            }
        });

        // Player Controls
        this.elements.playBtn?.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn?.addEventListener('click', () => this.playPrevious());
        this.elements.nextBtn?.addEventListener('click', () => this.playNext());
        this.elements.playerClose?.addEventListener('click', () => this.hidePlayer());
        this.elements.videoClose?.addEventListener('click', () => this.hidePlayer());

        // Progress Bar
        this.elements.audioProgress?.addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            this.seekAudio(percentage * this.state.duration);
        });

        // Audio Events
        this.elements.audioElement?.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.elements.audioElement?.addEventListener('loadedmetadata', () => {
            this.state.duration = this.elements.audioElement.duration;
            this.updateDurationDisplay();
        });

        this.elements.audioElement?.addEventListener('ended', () => {
            this.playNext();
        });

        // Video Events
        this.elements.videoElement?.addEventListener('timeupdate', () => {
            this.updateVideoProgress();
        });

        this.elements.videoElement?.addEventListener('loadedmetadata', () => {
            this.updateVideoDuration();
        });

        this.elements.videoPlayBtn?.addEventListener('click', () => {
            this.toggleVideoPlay();
        });

        this.elements.videoFullscreenBtn?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Mini Player
        this.elements.miniPlayBtn?.addEventListener('click', () => this.togglePlay());
        this.elements.miniNextBtn?.addEventListener('click', () => this.playNext());
        this.elements.expandPlayer?.addEventListener('click', () => this.showPlayer());

        // Window Events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // Setup Player Gestures for Mobile
    setupPlayerGestures() {
        if (!this.state.isMobile) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const player = this.elements.playerContainer;
        
        player.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            currentY = startY;
            isDragging = true;
            player.style.transition = 'none';
        });

        player.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0) {
                player.style.transform = `translateY(${diff}px)`;
            }
        });

        player.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            isDragging = false;
            player.style.transition = 'transform 0.3s ease';
            
            const diff = currentY - startY;
            if (diff > 100) {
                this.hidePlayer();
            } else {
                player.style.transform = 'translateY(0)';
            }
        });
    }

    // Page Navigation
    switchPage(page) {
        this.state.currentPage = page;
        
        // Update active states
        this.elements.pages.forEach(p => p.classList.remove('active'));
        this.elements.navButtons.forEach(btn => btn.classList.remove('active'));
        this.elements.mobileNavButtons.forEach(btn => btn.classList.remove('active'));

        // Show selected page
        document.getElementById(`${page}Page`)?.classList.add('active');
        
        // Update navigation buttons
        const activeNavBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
        const activeMobileNavBtn = document.querySelector(`.mobile-nav-btn[data-page="${page}"]`);
        
        activeNavBtn?.classList.add('active');
        activeMobileNavBtn?.classList.add('active');
    }

    // Songs Management
    async loadSongs() {
        try {
            const response = await fetch('/api/songs');
            this.state.songs = await response.json();
            this.renderSongs();
            this.updateCounters();
        } catch (error) {
            console.error('Failed to load songs:', error);
            this.showError('فشل في تحميل الأغاني');
        }
    }

    renderSongs() {
        if (!this.state.songs || this.state.songs.length === 0) {
            this.elements.songsContainer.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <h3>لا توجد أغاني</h3>
                    <p>ابدأ برفع أول أغنية لك</p>
                </div>
            `;
            return;
        }

        const filteredSongs = this.state.searchQuery
            ? this.state.songs.filter(song =>
                song.title.toLowerCase().includes(this.state.searchQuery.toLowerCase()))
            : this.state.songs;

        this.elements.songsContainer.innerHTML = `
            <div class="songs-grid">
                ${filteredSongs.map((song, index) => `
                    <div class="song-card" data-index="${index}" data-type="${song.file_type}">
                        <div class="song-cover ${song.file_type === 'mp4' ? 'video-thumbnail' : ''}">
                            ${song.file_type === 'mp3' ? `
                                <img src="/static/music.png" alt="${song.title}">
                            ` : `
                                <img src="/static/music.png" alt="${song.title}">
                                <div class="video-play-overlay">
                                    <div class="play-icon-overlay">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                        </svg>
                                    </div>
                                </div>
                            `}
                        </div>
                        <div class="song-info">
                            <h3 class="song-title">${this.escapeHtml(song.title)}</h3>
                            <div class="song-meta">
                                <span class="song-type">${song.file_type.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click listeners to song cards
        document.querySelectorAll('.song-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const songIndex = parseInt(card.dataset.index);
                this.playSong(songIndex);
            });
        });
    }

    filterSongs() {
        this.renderSongs();
    }

    updateCounters() {
        this.elements.songsCount.textContent = `${this.state.songs.length} أغنية`;
        this.elements.totalSongs.textContent = this.state.songs.length;
    }

    // File Upload
    handleFileSelect(file) {
        if (!file) return;
        
        // Check file type
        const validTypes = ['audio/mp3', 'video/mp4'];
        if (!validTypes.includes(file.type)) {
            this.showError('نوع الملف غير مدعوم. يرجى اختيار ملف MP3 أو MP4');
            return;
        }

        // Check file size (max 200MB)
        const maxSize = 200 * 1024 * 1024; // 200MB
        if (file.size > maxSize) {
            this.showError('حجم الملف كبير جداً. الحد الأقصى 200MB');
            return;
        }

        // Set default title
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        this.elements.songTitle.value = fileName;

        // Update dropzone UI
        this.elements.uploadDropzone.innerHTML = `
            <svg class="upload-icon" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <h3 class="upload-title">${this.escapeHtml(file.name)}</h3>
            <p class="upload-subtitle">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p class="upload-formats">جاهز للرفع</p>
            <input type="file" id="fileInput" accept=".mp3,.mp4" class="file-input">
        `;

        // Update the file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        this.elements.fileInput.files = dataTransfer.files;
    }

    async uploadSong() {
        const file = this.elements.fileInput.files[0];
        const title = this.elements.songTitle.value.trim();

        if (!file) {
            this.showError('يرجى اختيار ملف أولاً');
            return;
        }

        if (!title) {
            this.showError('يرجى إدخال اسم الأغنية');
            return;
        }

        // Show progress
        this.elements.uploadProgress.classList.add('active');
        const progressFill = this.elements.uploadProgress.querySelector('.progress-fill');
        const progressPercentage = this.elements.uploadProgress.querySelector('.progress-percentage');
        const progressText = this.elements.uploadProgress.querySelector('.progress-text');

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);

            // Simulate progress for better UX
            let simulatedProgress = 0;
            const progressInterval = setInterval(() => {
                if (simulatedProgress < 90) {
                    simulatedProgress += 10;
                    progressFill.style.width = `${simulatedProgress}%`;
                    progressPercentage.textContent = `${simulatedProgress}%`;
                }
            }, 300);

            // Upload with progress tracking
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    const displayProgress = Math.max(simulatedProgress, percentComplete);
                    progressFill.style.width = `${displayProgress}%`;
                    progressPercentage.textContent = `${Math.round(displayProgress)}%`;
                    
                    if (progressText) {
                        const loadedMB = (e.loaded / (1024 * 1024)).toFixed(2);
                        const totalMB = (e.total / (1024 * 1024)).toFixed(2);
                        progressText.textContent = `${loadedMB} MB / ${totalMB} MB`;
                    }
                }
            });

            return new Promise((resolve, reject) => {
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        clearInterval(progressInterval);
                        
                        if (xhr.status === 200) {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                
                                // Complete progress
                                progressFill.style.width = '100%';
                                progressPercentage.textContent = '100%';
                                
                                setTimeout(() => {
                                    this.resetUploadForm();
                                    this.loadSongs();
                                    this.showSuccess('تم رفع الأغنية بنجاح!');
                                    this.switchPage('home');
                                    resolve(result);
                                }, 500);
                                
                            } catch (e) {
                                this.showError('خطأ في معالجة الاستجابة');
                                reject(e);
                            }
                        } else {
                            let errorMsg = 'فشل في رفع الملف';
                            try {
                                const error = JSON.parse(xhr.responseText);
                                errorMsg = error.error || errorMsg;
                            } catch (e) {
                                // Use default error message
                            }
                            this.showError(errorMsg);
                            reject(new Error(errorMsg));
                        }
                        
                        // Hide progress after delay
                        setTimeout(() => {
                            this.elements.uploadProgress.classList.remove('active');
                        }, 1000);
                    }
                };

                xhr.onerror = () => {
                    clearInterval(progressInterval);
                    this.elements.uploadProgress.classList.remove('active');
                    this.showError('حدث خطأ في الاتصال بالخادم');
                    reject(new Error('Network error'));
                };

                xhr.open('POST', '/api/upload');
                xhr.send(formData);
            });

        } catch (error) {
            console.error('Upload error:', error);
            this.elements.uploadProgress.classList.remove('active');
            this.showError('فشل في رفع الملف');
        }
    }

    resetUploadForm() {
        this.elements.uploadDropzone.innerHTML = `
            <svg class="upload-icon" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <h3 class="upload-title">اسحب وأفلت الملف هنا</h3>
            <p class="upload-subtitle">أو انقر لاختيار ملف</p>
            <p class="upload-formats">يدعم: MP3, MP4</p>
            <input type="file" id="fileInput" accept=".mp3,.mp4" class="file-input">
        `;
        
        // Re-attach event listener to new file input
        const newFileInput = this.elements.uploadDropzone.querySelector('.file-input');
        if (newFileInput) {
            newFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }
        
        this.elements.fileInput = newFileInput;
        this.elements.songTitle.value = '';
    }

    async clearAllSongs() {
        try {
            // Delete each song
            const deletePromises = this.state.songs.map(song =>
                fetch(`/api/delete/${song.id}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);

            // Clear state
            this.state.songs = [];
            this.state.currentSong = null;
            this.state.currentIndex = -1;

            // Update UI
            this.renderSongs();
            this.updateCounters();
            this.hidePlayer();
            this.hideMiniPlayer();

            this.showSuccess('تم حذف جميع الأغاني');
        } catch (error) {
            console.error('Clear error:', error);
            this.showError('فشل في حذف الأغاني');
        }
    }

    // Player Management
    playSong(index) {
        if (index < 0 || index >= this.state.songs.length) return;

        this.state.currentIndex = index;
        this.state.currentSong = this.state.songs[index];

        if (this.state.currentSong.file_type === 'mp3') {
            this.showAudioPlayer();
        } else {
            this.showVideoPlayer();
        }

        this.showPlayer();
        this.showMiniPlayer();
    }

    showAudioPlayer() {
        this.elements.audioPlayer.classList.add('active');
        this.elements.videoPlayer.classList.remove('active');

        // Set audio source
        this.elements.audioElement.src = this.state.currentSong.file_path;
        this.elements.audioTitle.textContent = this.state.currentSong.title;

        // Update mini player
        this.elements.miniCover.src = '/static/music.png';
        this.elements.miniTitle.textContent = this.state.currentSong.title;
        this.elements.miniStatus.textContent = 'جاري التشغيل...';

        // Load and play
        this.elements.audioElement.load();
        this.playAudio();
    }

    showVideoPlayer() {
        this.elements.videoPlayer.classList.add('active');
        this.elements.audioPlayer.classList.remove('active');

        // Set video source
        this.elements.videoElement.src = this.state.currentSong.file_path;
        this.elements.videoTitle.textContent = this.state.currentSong.title;

        // Load video
        this.elements.videoElement.load();
    }

    playAudio() {
        this.elements.audioElement.play()
            .then(() => {
                this.state.isPlaying = true;
                this.updatePlayButton();
            })
            .catch(error => {
                console.error('Play error:', error);
                this.showError('فشل في تشغيل الملف');
            });
    }

    pauseAudio() {
        this.elements.audioElement.pause();
        this.state.isPlaying = false;
        this.updatePlayButton();
    }

    togglePlay() {
        if (!this.state.currentSong) return;

        if (this.state.currentSong.file_type === 'mp3') {
            if (this.state.isPlaying) {
                this.pauseAudio();
            } else {
                this.playAudio();
            }
        } else {
            this.toggleVideoPlay();
        }
    }

    toggleVideoPlay() {
        if (this.elements.videoElement.paused) {
            this.elements.videoElement.play();
            this.elements.videoPlayBtn.querySelector('.video-play-icon').style.display = 'none';
            this.elements.videoPlayBtn.querySelector('.video-pause-icon').style.display = 'block';
        } else {
            this.elements.videoElement.pause();
            this.elements.videoPlayBtn.querySelector('.video-play-icon').style.display = 'block';
            this.elements.videoPlayBtn.querySelector('.video-pause-icon').style.display = 'none';
        }
    }

    playPrevious() {
        if (this.state.songs.length === 0) return;

        let newIndex = this.state.currentIndex - 1;
        if (newIndex < 0) newIndex = this.state.songs.length - 1;
        
        this.playSong(newIndex);
    }

    playNext() {
        if (this.state.songs.length === 0) return;

        let newIndex = this.state.currentIndex + 1;
        if (newIndex >= this.state.songs.length) newIndex = 0;
        
        this.playSong(newIndex);
    }

    seekAudio(time) {
        this.elements.audioElement.currentTime = time;
    }

    setVolume(volume) {
        this.state.volume = volume;
        this.elements.audioElement.volume = volume;
        this.elements.videoElement.volume = volume;
    }

    updateProgress() {
        if (!this.elements.audioElement.duration) return;

        this.state.currentTime = this.elements.audioElement.currentTime;
        this.state.duration = this.elements.audioElement.duration;

        const progress = (this.state.currentTime / this.state.duration) * 100;
        this.elements.audioProgress.querySelector('.progress-fill').style.width = `${progress}%`;

        this.elements.currentTime.textContent = this.formatTime(this.state.currentTime);
        this.elements.duration.textContent = this.formatTime(this.state.duration);

        // Update mini player
        this.elements.miniStatus.textContent = this.formatTime(this.state.currentTime);
    }

    updateVideoProgress() {
        const currentTime = this.elements.videoElement.currentTime;
        const duration = this.elements.videoElement.duration;

        this.elements.videoCurrentTime.textContent = this.formatTime(currentTime);
        this.elements.videoDuration.textContent = this.formatTime(duration);
    }

    updateDurationDisplay() {
        this.elements.duration.textContent = this.formatTime(this.state.duration);
    }

    updateVideoDuration() {
        const duration = this.elements.videoElement.duration;
        this.elements.videoDuration.textContent = this.formatTime(duration);
    }

    updatePlayButton() {
        if (!this.elements.playBtn) return;

        const playIcon = this.elements.playBtn.querySelector('.play-icon');
        const pauseIcon = this.elements.playBtn.querySelector('.pause-icon');

        if (this.state.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    // Player UI
    showPlayer() {
        this.elements.playerOverlay.classList.add('active');
        if (this.state.isMobile) {
            document.body.style.overflow = 'hidden';
        }
    }

    hidePlayer() {
        this.elements.playerOverlay.classList.remove('active');
        if (this.state.isMobile) {
            document.body.style.overflow = '';
        }
    }

    showMiniPlayer() {
        this.elements.playerMiniBar.classList.add('active');
    }

    hideMiniPlayer() {
        this.elements.playerMiniBar.classList.remove('active');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.elements.videoElement.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Utility Functions
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'error' ? '#ff4757' : '#1db954'};
            color: white;
            border-radius: 12px;
            font-weight: 500;
            z-index: 2000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Event Handlers
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile !== this.state.isMobile) {
            this.state.isMobile = isMobile;
            this.detectMobile();
        }
    }

    detectMobile() {
        if (this.state.isMobile) {
            document.body.classList.add('mobile');
            document.body.classList.remove('desktop');
        } else {
            document.body.classList.add('desktop');
            document.body.classList.remove('mobile');
        }
    }

    handleKeyboard(e) {
        // Prevent default behavior for input elements
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.playPrevious();
                }
                break;
            case 'ArrowRight':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.playNext();
                }
                break;
            case 'Escape':
                if (this.elements.playerOverlay.classList.contains('active')) {
                    this.hidePlayer();
                }
                break;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.musicApp = new MusicApp();
});