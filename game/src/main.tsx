import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/ui.css';
import { loadGame, startAutosave, saveNow } from './systems/save';
import { unlockOnGesture } from './systems/audio';
import { bootGame } from './game/boot';
import { store } from './core/state';

// Chặn zoom/cuộn mặc định của trình duyệt trên mobile để cử chỉ chạm dành cho game
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

if (!loadGame()) saveNow();
startAutosave();
unlockOnGesture();

const root = document.getElementById('root')!;
root.innerHTML = '<div id="stage"><div id="game"></div></div>';
const ui = document.createElement('div'); ui.id = 'ui-root'; root.appendChild(ui);

function start() {
  bootGame('game');
  createRoot(ui).render(<App />);
}
// chờ font (tối đa 1.2s) để chữ trong game đúng kiểu ngay từ đầu
const ready = (document as any).fonts?.load ? Promise.race([(document as any).fonts.load('800 20px "Baloo 2"'), new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
ready.finally(start);
(window as any).__store = store;
