export class MenuTitle {
  constructor(uiRoot, {
    onStartGame,
    onOpenTutorial,
    onEnterZoo,
    onToggleSfxMute,
    onToggleMusicMute,
    onSetSfxVolume,
    onSetMusicVolume,
    sfxMuted = false,
    sfxVolume = 0.7,
    musicMuted = false,
    musicVolume = 0.6,
    zooEnabled = false,
  } = {}) {
    this.onStartGame = onStartGame || (() => {});
    this.onOpenTutorial = onOpenTutorial || (() => {});
    this.onEnterZoo = onEnterZoo || (() => {});
    this.onToggleSfxMute = onToggleSfxMute || (() => {});
    this.onToggleMusicMute = onToggleMusicMute || (() => {});
    this.onSetSfxVolume = onSetSfxVolume || (() => {});
    this.onSetMusicVolume = onSetMusicVolume || (() => {});
    this.zooEnabled = !!zooEnabled;

    this.el = document.createElement('div');
    this.el.id = 'title-menu';
    this.el.className = 'menu-overlay';

    const atmosphere = document.createElement('div');
    atmosphere.className = 'menu-atmosphere';
    atmosphere.setAttribute('aria-hidden', 'true');
    this.el.appendChild(atmosphere);

    const panel = document.createElement('div');
    panel.className = 'menu-panel';

    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.setAttribute('aria-label', 'Crimson Ascent');

    const crimsonTitle = document.createElement('span');
    crimsonTitle.className = 'menu-title-crimson';
    const crimsonInitial = document.createElement('span');
    crimsonInitial.className = 'menu-title-crimson-initial';
    crimsonInitial.textContent = 'C';
    crimsonTitle.appendChild(crimsonInitial);

    const crimsonRest = document.createElement('span');
    crimsonRest.className = 'menu-title-crimson-rest';
    crimsonRest.textContent = 'rimson';
    crimsonTitle.appendChild(crimsonRest);
    title.appendChild(crimsonTitle);

    const ascentTitle = document.createElement('span');
    ascentTitle.className = 'menu-title-ascent';
    ascentTitle.textContent = 'Ascent';
    title.appendChild(ascentTitle);
    panel.appendChild(title);

    const buttonWrap = document.createElement('div');
    buttonWrap.className = 'menu-actions';

    const { container: startWrap, button: startBtn } = this._makeButton('START', 'menu-btn-primary');
    startBtn.addEventListener('click', () => this.onStartGame());
    this.startBtn = startBtn;
    buttonWrap.appendChild(startWrap);

    const { container: tutorialWrap, button: tutorialBtn } = this._makeButton('TUTORIAL');
    tutorialBtn.addEventListener('click', () => this.onOpenTutorial());
    buttonWrap.appendChild(tutorialWrap);

    const { container: zooWrap, button: zooBtn } = this._makeButton('ENTER ZOO', 'menu-btn-dev');
    zooBtn.addEventListener('click', () => this.onEnterZoo());
    buttonWrap.appendChild(zooWrap);
    this.zooBtn = zooBtn;
    this.zooBtnWrap = zooWrap;

    panel.appendChild(buttonWrap);

    panel.appendChild(this._buildAudioSection({ sfxMuted, sfxVolume, musicMuted, musicVolume }));

    const footer = document.createElement('p');
    footer.className = 'menu-footer';
    footer.textContent = 'Touch or click to begin';
    panel.appendChild(footer);

    this.el.appendChild(panel);
    uiRoot.appendChild(this.el);

    this.setZooEnabled(this.zooEnabled);
  }

  show() {
    this.el.style.display = 'grid';
  }

  hide() {
    this.el.style.display = 'none';
  }

  setZooEnabled(enabled) {
    this.zooEnabled = !!enabled;
    this.zooBtnWrap.style.display = this.zooEnabled ? 'block' : 'none';
  }

  setStartLabel(label) {
    this.startBtn.textContent = label;
  }

  // ---- audio controls ----
  _buildAudioSection({ sfxMuted, sfxVolume, musicMuted, musicVolume }) {
    const section = document.createElement('div');
    section.className = 'menu-audio';

    const sfxRow = document.createElement('div');
    sfxRow.className = 'menu-audio-row';
    sfxRow.appendChild(this._makeAudioLabel('SFX'));

    const muteBtn = this._makeAudioButton();
    muteBtn.addEventListener('click', () => {
      const muted = this.onToggleSfxMute();
      this._reflectMuted(typeof muted === 'boolean' ? muted : !this._muted);
    });
    this.sfxMuteBtn = muteBtn;
    sfxRow.appendChild(muteBtn);

    const sfxSlider = this._makeAudioSlider('Sound effects volume', sfxVolume);
    sfxSlider.addEventListener('input', () => {
      this.onSetSfxVolume(Number(sfxSlider.value) / 100);
    });
    this.sfxVolumeSlider = sfxSlider;
    sfxRow.appendChild(sfxSlider);
    section.appendChild(sfxRow);

    const musicRow = document.createElement('div');
    musicRow.className = 'menu-audio-row menu-audio-row-music';
    musicRow.appendChild(this._makeAudioLabel('MUSIC'));

    const musicMuteBtn = this._makeAudioButton();
    musicMuteBtn.addEventListener('click', () => {
      const muted = this.onToggleMusicMute();
      this._reflectMusicMuted(typeof muted === 'boolean' ? muted : !this._musicMuted);
    });
    this.musicMuteBtn = musicMuteBtn;
    musicRow.appendChild(musicMuteBtn);

    const musicSlider = this._makeAudioSlider('Music volume', musicVolume);
    musicSlider.addEventListener('input', () => {
      this.onSetMusicVolume(Number(musicSlider.value) / 100);
    });
    this.musicVolumeSlider = musicSlider;
    musicRow.appendChild(musicSlider);
    section.appendChild(musicRow);

    this._reflectMuted(!!sfxMuted);
    this._reflectMusicMuted(!!musicMuted);
    return section;
  }

  _makeAudioLabel(text) {
    const label = document.createElement('span');
    label.className = 'menu-audio-label';
    label.textContent = text;
    return label;
  }

  _makeAudioButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-audio-mute';
    return button;
  }

  _makeAudioSlider(label, value) {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.step = '1';
    slider.className = 'menu-audio-slider';
    slider.setAttribute('aria-label', label);
    slider.value = String(Math.round(clamp01(value) * 100));
    return slider;
  }

  _reflectMuted(muted) {
    this._muted = !!muted;
    if (this.sfxMuteBtn) {
      this.sfxMuteBtn.textContent = muted ? 'Unmute' : 'Mute';
      this.sfxMuteBtn.classList.toggle('is-muted', muted);
      this.sfxMuteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
  }

  _reflectMusicMuted(muted) {
    this._musicMuted = !!muted;
    if (this.musicMuteBtn) {
      this.musicMuteBtn.textContent = muted ? 'Unmute' : 'Mute';
      this.musicMuteBtn.classList.toggle('is-muted', muted);
      this.musicMuteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
  }

  // Sync controls to the current audio settings (e.g. when the menu reopens).
  setAudioState({ sfxMuted, sfxVolume, musicMuted, musicVolume } = {}) {
    if (typeof sfxMuted === 'boolean') this._reflectMuted(sfxMuted);
    if (typeof musicMuted === 'boolean') this._reflectMusicMuted(musicMuted);
    if (typeof sfxVolume === 'number' && this.sfxVolumeSlider) {
      this.sfxVolumeSlider.value = String(Math.round(clamp01(sfxVolume) * 100));
    }
    if (typeof musicVolume === 'number' && this.musicVolumeSlider) {
      this.musicVolumeSlider.value = String(Math.round(clamp01(musicVolume) * 100));
    }
  }

  setSfxState({ muted, volume } = {}) {
    if (typeof muted === 'boolean') this._reflectMuted(muted);
    if (typeof volume === 'number' && this.sfxVolumeSlider) {
      this.sfxVolumeSlider.value = String(Math.round(clamp01(volume) * 100));
    }
  }

  _makeButton(label, extraClass = '') {
    const container = document.createElement('div');
    container.className = 'menu-button';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `menu-btn ${extraClass}`.trim();
    button.textContent = label;

    container.appendChild(button);
    return { container, button };
  }
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
