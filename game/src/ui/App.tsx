import React, { useEffect, useRef, useState } from 'react';
import { useGame, useBus, fmt } from './hooks';
import { xpNeed, questsReady } from '../systems/actions';
import { Coin, Gem, Star, Heart, Gear, Chart, Bag, Hammer, Book, Chef, Scroll, Trophy, Friends, Fast } from './icons';
import { ShopPanel } from './panels/Shop';
import { BuildDrawer } from './panels/BuildDrawer';
import { MenuPanel, StaffPanel } from './panels/Management';
import { QuestPanel, CollectionPanel, FriendsPanel, SettingsPanel, StatsPanel } from './panels/Meta';
import { Modal } from './Modal';
import { bus } from '../core/bus';
import { gameApi } from '../game/GameScene';
import { sfx, initAudio } from '../systems/audio';
import { StaffFace } from './panels/Management';
import { drawCharacter } from '../art/characters';

type PanelId = 'shop' | 'menu' | 'staff' | 'quest' | 'collection' | 'friends' | 'settings' | 'stats' | null;

function TopBar({ open, speed, setSpeed }: { open: (p: PanelId) => void; speed: number; setSpeed: () => void }) {
  const s = useGame(); const need = xpNeed(s.level);
  return (
    <div className="top">
      <div className="lvl">
        <div className="badge">{s.level}<small>CẤP</small></div>
        <div className="xpbar"><i style={{ width: (s.xp / need) * 100 + '%' }} /><span>{fmt(s.xp)} / {fmt(need)} XP</span></div>
      </div>
      <div className="res">
        <div className="pill"><Coin />{fmt(s.gold)}</div>
        <div className="pill gems"><Gem />{fmt(s.gems)}</div>
        <div className="pill rep" title="Danh tiếng"><Heart />{fmt(s.rep)}</div>
        <div className="row-r">
          <button className={'sq' + (speed > 1 ? ' on' : '')} onClick={setSpeed} title="Tốc độ game">{speed > 1 ? '×' + speed : <Fast />}</button>
          <button className="sq" onClick={() => { sfx('click'); open('stats'); }} title="Thống kê"><Chart /></button>
          <button className="sq" onClick={() => { sfx('click'); open('settings'); }} title="Cài đặt"><Gear /></button>
        </div>
      </div>
    </div>
  );
}

function Toasts() {
  const [list, setList] = useState<{ id: number; text: string; kind: string }[]>([]);
  useEffect(() => { let n = 0; return bus.on('toast', (t) => { const id = ++n; setList((l) => [...l.slice(-2), { id, ...t }]); setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 2800); }); }, []);
  return <div className="toasts">{list.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}</div>;
}

function LevelUp() {
  const [d, setD] = useState<null | { level: number; gold: number; gems: number; unlocked: string[] }>(null);
  useEffect(() => bus.on('levelup', setD), []);
  if (!d) return null;
  const colors = ['#ff5a5a', '#ffd84a', '#58e06a', '#3d8bff', '#ff8fc0', '#b57aff'];
  return <>
    <div className="confetti">{Array.from({ length: 50 }).map((_, i) => <i key={i} style={{ left: Math.random() * 100 + '%', background: colors[i % colors.length], animationDuration: 2 + Math.random() * 2 + 's', animationDelay: Math.random() + 's' }} />)}</div>
    <Modal title="LÊN CẤP!" onClose={() => setD(null)}>
      <div className="lvlup">
        <div className="big">Cấp {d.level}</div>
        <p style={{ fontSize: 20, margin: '6px 0' }}>Thưởng: <b>{fmt(d.gold)}</b> vàng, <b>{d.gems}</b> kim cương</p>
        {d.unlocked.length > 0 && <div className="hint" style={{ textAlign: 'left' }}><b>Mở khóa mới:</b> {d.unlocked.join(', ')}</div>}
        <button className="btn gold" onClick={() => setD(null)}>Tuyệt vời!</button>
      </div>
    </Modal>
  </>;
}

function Inspect() {
  const [sel] = useBus<{ kind: string; id: number } | null>('inspect', null);
  const [, setSel] = useState(0);
  const [data, setData] = useState<any>(null); const [closed, setClosed] = useState(false);
  useEffect(() => { setClosed(false); }, [sel]);
  useEffect(() => {
    if (!sel) { setData(null); return; }
    const f = () => setData(gameApi?.inspect(sel.kind, sel.id) ?? null);
    f(); const t = setInterval(f, 300); return () => clearInterval(t);
  }, [sel]);
  void setSel;
  if (!sel || !data || closed) return null;
  const img = (() => { try { return drawCharacter(data.look, false, 'idle').toDataURL(); } catch { return ''; } })();
  return <div className="inspect"><button className="x" onClick={() => setClosed(true)}>×</button>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><img src={img} style={{ height: 56 }} alt="" /><div><h4>{data.title}</h4><div className="sub">{data.sub}</div></div></div>
    {data.rows.map((r: string[]) => <div className="r" key={r[0]}><span>{r[0]}</span><b>{r[1]}</b></div>)}
  </div>;
}

export function App() {
  const [panel, setPanel] = useState<PanelId>(null);
  const [build, setBuild] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const s = useGame();
  const ready = questsReady();
  const open = (p: PanelId) => setPanel(p);
  const startBuild = (type?: string) => {
    setPanel(null); setBuild(true); gameApi?.setBuildMode(true);
    if (type) setTimeout(() => gameApi?.startPlacing(type), 30);
  };
  useEffect(() => bus.on('open-build', (t) => startBuild(t)), []);
  useEffect(() => { const f = () => initAudio(); window.addEventListener('pointerdown', f, { once: true }); return () => window.removeEventListener('pointerdown', f); }, []);
  const setSpeed = () => { const n = speed >= 3 ? 1 : speed + 1; setSpeedState(n); gameApi?.setSpeed(n); sfx('click'); };
  const hasStove = s.items.some((i) => i.type.startsWith('stove') || i.type === 'oven');
  const [cnt] = useState(0); void cnt;
  const btn = (id: PanelId, label: string, icon: React.ReactNode, cls: string, badge = 0) => (
    <button key={label} className={'dbtn ' + cls} onClick={() => { sfx('click'); open(id); }}>{icon}{label}{badge > 0 && <span className="dot">{badge}</span>}</button>
  );
  return (
    <div className="ui">
      <TopBar open={open} speed={speed} setSpeed={setSpeed} />
      <Inspect />
      {!hasStove && !build && <div className="banner">Chưa có bếp! Hãy mua bếp ở SHOP</div>}
      {build ? <BuildDrawer onDone={() => setBuild(false)} /> : (
        <div className="bottom"><div className="dock">
          {btn('shop', 'SHOP', <Bag />, '')}
          <button className="dbtn c-blue" onClick={() => { sfx('click'); startBuild(); }}><Hammer />BUILD</button>
          {btn('menu', 'MENU', <Book />, 'c-green')}
          {btn('staff', 'STAFF', <Chef />, 'c-red')}
          {btn('quest', 'QUEST', <Scroll />, 'c-purple', ready)}
          {btn('collection', 'COLLECT', <Trophy />, 'c-teal')}
          {btn('friends', 'FRIENDS', <Friends />, 'c-pink')}
        </div></div>
      )}
      {panel === 'shop' && <ShopPanel onClose={() => setPanel(null)} />}
      {panel === 'menu' && <MenuPanel onClose={() => setPanel(null)} />}
      {panel === 'staff' && <StaffPanel onClose={() => setPanel(null)} />}
      {panel === 'quest' && <QuestPanel onClose={() => setPanel(null)} />}
      {panel === 'collection' && <CollectionPanel onClose={() => setPanel(null)} />}
      {panel === 'friends' && <FriendsPanel onClose={() => setPanel(null)} />}
      {panel === 'settings' && <SettingsPanel onClose={() => setPanel(null)} />}
      {panel === 'stats' && <StatsPanel onClose={() => setPanel(null)} />}
      <LevelUp />
      <Toasts />
    </div>
  );
}
void Star; void StaffFace;
