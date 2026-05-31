export class TutorialPopup {
  constructor(uiRoot) {
    this.onClose = () => {};

    this.el = document.createElement('div');
    this.el.id = 'tutorial-popup';
    this.el.className = 'tutorial-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-labelledby', 'tutorial-title');
    this.el.style.display = 'none';

    const panel = document.createElement('div');
    panel.className = 'tutorial-panel';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tutorial-close';
    closeBtn.textContent = 'X';
    closeBtn.setAttribute('aria-label', 'Close tutorial');
    closeBtn.addEventListener('click', () => this.close());
    panel.appendChild(closeBtn);

    const title = document.createElement('h2');
    title.id = 'tutorial-title';
    title.className = 'tutorial-title';
    title.textContent = 'TUTORIAL';
    panel.appendChild(title);

    const content = document.createElement('div');
    content.className = 'tutorial-content';
    content.appendChild(this._makeSection('MOBILE CONTROLS', [
      'Use the joystick to move.',
      'Jump Button: Jump',
      'Dash Button: Transform into a bat and dash forward.',
      'Arrow Button: Shoot an arrow.',
    ]));
    content.appendChild(this._makeSection('PC CONTROLS', [
      'Move: A / D or Arrow Keys',
      'Jump: Space',
      'Dash: J or Shift',
      'Shoot Arrow: K or X',
    ]));
    content.appendChild(this._makeSection('GAMEPLAY TIPS', [
      'In air dashing can be followed by a jump.',
      'Use wall jumps carefully.',
      'Plan your route before committing.',
      'Checkpoints restore your progress after death.',
    ]));
    panel.appendChild(content);

    this.el.appendChild(panel);
    uiRoot.appendChild(this.el);
  }

  show({ onClose } = {}) {
    this.onClose = onClose || (() => {});
    this.el.style.display = 'grid';
  }

  hide() {
    this.el.style.display = 'none';
  }

  close() {
    this.hide();
    const onClose = this.onClose;
    this.onClose = () => {};
    onClose();
  }

  _makeSection(titleText, items) {
    const section = document.createElement('section');
    section.className = 'tutorial-section';

    const title = document.createElement('h3');
    title.textContent = titleText;
    section.appendChild(title);

    const list = document.createElement('ul');
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    }
    section.appendChild(list);

    return section;
  }
}
