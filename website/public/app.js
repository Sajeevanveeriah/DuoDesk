'use strict';
const features = {
  mouse: ['Just cross the edge.', 'Place your screens in the app. Move your pointer off an outer edge and the keyboard follows it to the next computer.', 'Move to the MacBook', 'Monitor seams stay local. A held button and crossing guards keep the pointer where it belongs.'],
  clipboard: ['An idea, without the detour.', 'Copy text on one computer and paste it on the other. Images and files have their own sharing controls.', 'Copy this thought', 'This preview changes only its sample text. Android background access and Bluetooth image limits still apply.'],
  screen: ['Give a spare screen a new job.', 'Use another laptop or Android tablet as a display. Choose Mirror to share what you see, or Extend for more room.', 'Preview extended display', 'Extend depends on the host operating system, graphics driver and required permissions.'],
  phone: ['Your phone, within reach.', 'Bring phone notifications, messages and camera controls to the desk, with each feature switched on when you need it.', 'Preview a notification', 'Advanced Android features need permissions, the full APK or a separate wireless-debugging setup.'],
};
let feature = 'mouse', moved = false;
const $ = id => document.getElementById(id);
const tabs = [...document.querySelectorAll('[role=tab]')];
function selectFeature(key) {
  feature = key; moved = false;
  const [title, description, action, note] = features[key];
  tabs.forEach(tab => { const on = tab.dataset.feature === key; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; });
  $('feature-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('feature-title').textContent = title; $('feature-description').textContent = description;
  $('try-feature').textContent = `${action} →`; $('feature-note').textContent = note;
  $('left-content').textContent = key === 'clipboard' ? 'A little less friction.' : key === 'phone' ? 'Phone' : 'One quiet workspace.';
  $('right-content').textContent = 'Ready when you are.';
  $('demo-state').textContent = 'Preview ready';
  document.querySelector('.demo-map').classList.remove('crossed');
  $('demo-left').classList.add('selected'); $('demo-right').classList.remove('selected');
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectFeature(tab.dataset.feature));
  tab.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
    selectFeature(tabs[next].dataset.feature); tabs[next].focus();
  });
});
$('try-feature').addEventListener('click', () => {
  moved = !moved;
  document.querySelector('.demo-map').classList.toggle('crossed', moved);
  $('demo-left').classList.toggle('selected', !moved); $('demo-right').classList.toggle('selected', moved);
  const content = { mouse: 'Your keyboard follows.', clipboard: 'A little less friction.', screen: 'A little more room.', phone: 'Sample message · Ready for a break?' };
  $('right-content').textContent = moved ? content[feature] : 'Ready when you are.';
  $('demo-state').textContent = moved ? { mouse: 'Pointer on MacBook', clipboard: 'Sample text pasted', screen: 'Extended display preview', phone: 'Sample notification shown' }[feature] : 'Preview ready';
  $('try-feature').textContent = moved ? 'Reset preview ↶' : `${features[feature][2]} →`;
});
const ua = navigator.userAgent || '';
const detected = /android/i.test(ua) ? 'android' : /iphone|ipad|ipod/i.test(ua) ? 'unknown' : /windows/i.test(ua) ? 'win' : /macintosh|mac os/i.test(ua) ? 'mac' : /linux/i.test(ua) ? 'linux' : 'unknown';
if (detected !== 'unknown') $('system').value = detected;
let releaseAvailable = false;
function downloadChoice() {
  const value = $('system').value;
  const os = value === 'win-arm' ? 'win' : value;
  $('download-link').href = `/api/download?os=${os}${value === 'win-arm' ? '&arch=arm64' : ''}`;
  $('download-link').textContent = releaseAvailable ? `Download for ${$('system').selectedOptions[0].textContent} ↓` : 'Check download availability ↓';
}
$('system').addEventListener('change', downloadChoice); downloadChoice();
fetch('/api/release-status').then(r => r.json()).then(data => {
  releaseAvailable = data.available === true;
  downloadChoice();
  $('release-label').textContent = data.available ? `Public stable release: ${data.version}` : 'In development. A public stable installer is not available yet.';
}).catch(() => { $('release-label').textContent = 'Release availability could not be checked. Downloads are verified when requested.'; });
if (navigator.doNotTrack !== '1' && !navigator.globalPrivacyControl) {
  fetch('/api/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ os: detected }), keepalive: true }).catch(() => {});
}
const shot = $('app-screenshot');
function showShot() { if (shot.naturalWidth) { $('app-figure').hidden = false; $('screenshot-pending').hidden = true; } }
shot.addEventListener('load', showShot); if (shot.complete) showShot();
