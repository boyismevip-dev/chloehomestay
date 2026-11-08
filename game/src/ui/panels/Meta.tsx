import React, { useRef, useState } from 'react';
import { Modal, Tabs, Price } from '../Modal';
import { useGame, fmt } from '../hooks';
import { QUESTS, ACHIEVEMENTS } from '../../data/quests';
import { claimQuest, claimAch, metric, giftFriend, today } from '../../systems/actions';
import { DISHES, dishCost } from '../../data/dishes';
import { foodIcon } from '../../art/food';
import { store } from '../../core/state';
import { exportSave, importSave, resetGame, saveNow } from '../../systems/save';
import { applyAudioSettings, sfx, initAudio } from '../../systems/audio';
import { Coin, Gem, Star } from '../icons';
import { bus } from '../../core/bus';
import { gameApi } from '../../game/GameScene';

export function QuestPanel({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const sorted = [...QUESTS].sort((a, b) => Number(s.claimedQuests.includes(a.id)) - Number(s.claimedQuests.includes(b.id)));
  return (
    <Modal title="NHIỆM VỤ" onClose={onClose} wide>
      <div className="mbody"><div className="list">
        {sorted.map((q) => {
          const v = Math.min(q.target, metric(q.metric)); const done = v >= q.target; const claimed = s.claimedQuests.includes(q.id);
          return <div key={q.id} className={'item' + (claimed ? ' done' : '')}>
            <div className="txt"><h4>{q.title}</h4><small>{q.desc}</small>
              <div className="bar g" style={{ marginTop: 4 }}><i style={{ width: (v / q.target) * 100 + '%' }} /></div>
              <small>{fmt(v)} / {fmt(q.target)} • Thưởng: <b>{fmt(q.gold)}</b> vàng, <b>{q.xp}</b> XP{q.gems ? `, ${q.gems} kim cương` : ''}</small></div>
            {claimed ? <span className="price">Đã nhận</span> : <button className="btn gold" disabled={!done} onClick={() => claimQuest(q.id)}>Nhận</button>}
          </div>;
        })}
      </div></div>
    </Modal>
  );
}

export function CollectionPanel({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const [tab, setTab] = useState<'ach' | 'dish'>('ach');
  return (
    <Modal title="THÀNH TÍCH" onClose={onClose} wide>
      <Tabs tabs={[{ id: 'ach', label: 'Thành tích' }, { id: 'dish', label: 'Bộ sưu tập món' }]} value={tab} onChange={setTab} />
      <div className="mbody">
        {tab === 'ach' && <div className="list">{ACHIEVEMENTS.map((a) => {
          const v = Math.min(a.target, metric(a.metric)); const claimed = s.claimedAch.includes(a.id);
          return <div key={a.id} className={'item' + (claimed ? ' done' : '')}>
            <div className="ico"><Star /></div>
            <div className="txt"><h4>{a.title}</h4><small>{a.desc} • {fmt(v)}/{fmt(a.target)}</small><div className="bar"><i style={{ width: (v / a.target) * 100 + '%' }} /></div></div>
            {claimed ? <span className="price">Đã nhận</span> : <button className="btn blue" disabled={v < a.target} onClick={() => claimAch(a.id)}><Gem /> {a.gems}</button>}
          </div>;
        })}</div>}
        {tab === 'dish' && <div className="grid">{DISHES.map((d) => { const n = s.stats.dishCount[d.id] || 0; return <div key={d.id} className={'card' + (n ? '' : ' locked')}>
          <div className="ico"><img src={foodIcon(d.id)} alt="" style={n ? undefined : { filter: 'brightness(0)' }} /></div><h4>{n ? d.name : '???'}</h4><p>{n ? `Đã bán ${fmt(n)} phần` : 'Chưa từng bán'}</p></div>; })}</div>}
      </div>
    </Modal>
  );
}

const FRIENDS = [
  { id: 'f1', name: 'Quán Bé Heo', level: 7, gift: 60, note: 'Chuyên bánh ngọt' },
  { id: 'f2', name: 'Cafe Mây Trắng', level: 12, gift: 90, note: 'Cà phê rang xay' },
  { id: 'f3', name: 'Phở Ông Ba', level: 4, gift: 40, note: 'Nước dùng 12 tiếng' },
  { id: 'f4', name: 'Kem Tuyết Rơi', level: 9, gift: 70, note: 'Kem 20 vị' },
  { id: 'f5', name: 'Pizza Núi Lửa', level: 15, gift: 120, note: 'Lò gạch củi' },
];
export function FriendsPanel({ onClose }: { onClose: () => void }) {
  const s = useGame();
  return (
    <Modal title="BẠN BÈ" onClose={onClose}>
      <div className="mbody">
        <div className="hint">Danh sách hàng xóm là nhân vật giả lập (chưa kết nối máy chủ). Mỗi ngày tặng quà 1 lần cho mỗi quán: nhận vàng đáp lễ và điểm danh tiếng. Sau này có thể thay bằng bạn bè thật khi có tài khoản.</div>
        <div className="list">{FRIENDS.map((f) => { const sent = s.friendGifts[f.id] === today(); return <div key={f.id} className="item">
          <div className="txt"><h4>{f.name} <small style={{ display: 'inline' }}>cấp {f.level}</small></h4><small>{f.note}</small></div>
          <button className="btn gold" disabled={sent} onClick={() => giftFriend(f.id, f.gift)}>{sent ? 'Đã tặng' : <>Tặng quà</>}</button>
        </div>; })}</div>
      </div>
    </Modal>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useGame(); const file = useRef<HTMLInputElement>(null);
  const set = (p: Partial<typeof s.settings>) => { Object.assign(s.settings, p); store.commit('settings'); initAudio(); applyAudioSettings(); };
  const doExport = () => {
    const blob = new Blob([exportSave()], { type: 'application/json' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `nha-hang-vui-ve-${today()}.json`; a.click(); URL.revokeObjectURL(a.href);
    bus.emit('toast', { text: 'Đã xuất file lưu', kind: 'good' });
  };
  const doImport = async (f: File) => {
    try { importSave(await f.text()); bus.emit('items-changed'); bus.emit('rebuild-room'); bus.emit('staff-changed'); bus.emit('fit-camera'); bus.emit('toast', { text: 'Đã nhập dữ liệu lưu', kind: 'good' }); }
    catch { bus.emit('toast', { text: 'File lưu không hợp lệ', kind: 'bad' }); sfx('error'); }
  };
  return (
    <Modal title="CÀI ĐẶT" onClose={onClose}>
      <div className="mbody">
        <div className="setrow"><b>Nhạc nền</b><button className={'btn ' + (s.settings.music ? '' : 'gray')} onClick={() => set({ music: !s.settings.music })}>{s.settings.music ? 'BẬT' : 'TẮT'}</button></div>
        <div className="setrow"><b>Hiệu ứng âm thanh</b><button className={'btn ' + (s.settings.sfx ? '' : 'gray')} onClick={() => set({ sfx: !s.settings.sfx })}>{s.settings.sfx ? 'BẬT' : 'TẮT'}</button></div>
        <div className="setrow"><b>Âm lượng</b><input type="range" min={0} max={1} step={0.05} value={s.settings.volume} onChange={(e) => set({ volume: +e.target.value })} style={{ maxWidth: 220 }} /></div>
        <div className="setrow"><b>Tốc độ game</b><div style={{ display: 'flex', gap: 6 }}>{[1, 2, 3].map((n) => <button key={n} className="btn blue" onClick={() => gameApi?.setSpeed(n)}>×{n}</button>)}</div></div>
        <div className="setrow"><b>Căn lại camera</b><button className="btn blue" onClick={() => bus.emit('fit-camera')}>Căn giữa</button></div>
        <div className="setrow"><b>Lưu game</b><button className="btn gold" onClick={() => { saveNow(); bus.emit('toast', { text: 'Đã lưu!', kind: 'good' }); }}>Lưu ngay</button></div>
        <div className="setrow"><b>Sao lưu</b><div style={{ display: 'flex', gap: 6 }}><button className="btn" onClick={doExport}>Xuất file</button><button className="btn" onClick={() => file.current?.click()}>Nhập file</button></div>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ''; }} /></div>
        <div className="setrow"><b style={{ color: '#c0261f' }}>Chơi lại từ đầu</b><button className="btn red" onClick={() => { if (confirm('Xóa toàn bộ tiến trình và chơi lại từ đầu?')) { resetGame(); bus.emit('items-changed'); bus.emit('rebuild-room'); bus.emit('staff-changed'); bus.emit('fit-camera'); onClose(); } }}>Reset</button></div>
        <p style={{ fontSize: 12, opacity: .6, textAlign: 'center' }}>Tự động lưu mỗi 8 giây • lần lưu cuối: {s.savedAt ? new Date(s.savedAt).toLocaleTimeString('vi-VN') : '—'}</p>
      </div>
    </Modal>
  );
}

export function StatsPanel({ onClose }: { onClose: () => void }) {
  const s = useGame(); const st = s.stats;
  const days = st.daily.slice(-7); const max = Math.max(1, ...days.map((d) => d.earned));
  const top = DISHES.filter((d) => st.dishCount[d.id]).sort((a, b) => (st.dishCount[b.id] || 0) - (st.dishCount[a.id] || 0)).slice(0, 3);
  const mins = Math.floor(st.playSeconds / 60);
  return (
    <Modal title="THỐNG KÊ KINH DOANH" onClose={onClose} wide>
      <div className="mbody">
        <div className="stat-grid">
          <div className="stat"><b>{fmt(st.served)}</b><span>Khách đã phục vụ</span></div>
          <div className="stat"><b>{fmt(st.earned)}</b><span>Tổng doanh thu</span></div>
          <div className="stat"><b>{fmt(st.spent)}</b><span>Tổng chi phí</span></div>
          <div className="stat"><b style={{ color: st.earned - st.spent >= 0 ? '#1f7a1d' : '#c0261f' }}>{fmt(st.earned - st.spent)}</b><span>Lợi nhuận</span></div>
          <div className="stat"><b>{fmt(st.tips)}</b><span>Tiền boa</span></div>
          <div className="stat"><b>{fmt(st.angry)}</b><span>Khách bỏ về</span></div>
          <div className="stat"><b>{fmt(s.rep)}</b><span>Điểm danh tiếng</span></div>
          <div className="stat"><b>{mins} phút</b><span>Thời gian chơi</span></div>
        </div>
        <h4 style={{ margin: '4px 0' }}>Doanh thu 7 ngày gần nhất</h4>
        <div className="bars">{days.length ? days.map((d) => <div key={d.day}><span>{fmt(d.earned)}</span><i style={{ height: (d.earned / max) * 80 + '%' }} /><span>{d.day.slice(5)}</span></div>) : <span style={{ margin: 'auto', opacity: .6 }}>Chưa có dữ liệu</span>}</div>
        <h4 style={{ margin: '12px 0 4px' }}>Món bán chạy</h4>
        <div className="list">{top.length ? top.map((d) => <div key={d.id} className="item"><div className="ico"><img src={foodIcon(d.id)} alt="" /></div><div className="txt"><h4>{d.name}</h4><small>{fmt(st.dishCount[d.id])} phần • lãi {d.price - dishCost(d)}/phần</small></div></div>) : <p style={{ opacity: .6 }}>Chưa bán món nào.</p>}</div>
      </div>
    </Modal>
  );
}
void Price; void Coin;
