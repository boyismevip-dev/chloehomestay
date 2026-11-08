import React, { useState } from 'react';
import { Modal, Tabs, Price } from '../Modal';
import { useGame, fmt } from '../hooks';
import { CATS, FURNITURE, STYLES, Cat, EXPANSIONS, FURN_BY_ID } from '../../data/catalog';
import { ING, Ing, DISHES } from '../../data/dishes';
import { furnitureIcon } from '../../art/furniture';
import { buyFurniture, buyStyle, buyIngredient, stockCap, nextExpansion, expand, buyRecipe, addGold, spendGold, addGems } from '../../systems/actions';
import { gameApi } from '../../game/GameScene';
import { store } from '../../core/state';
import { Coin, Gem, Lock } from '../icons';
import { foodIcon } from '../../art/food';
import { sfx } from '../../systems/audio';
import { bus } from '../../core/bus';

export function StyleSwatch({ id }: { id: string }) {
  const s = STYLES.find((x) => x.id === id)!;
  if (s.cat === 'floor') return <svg className="sw" viewBox="0 0 84 84"><g stroke={s.c3} strokeWidth="1.5">{[0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => { const x = 42 + (i - j) * 14, y = 20 + (i + j) * 7; return <polygon key={i + '' + j} points={`${x},${y} ${x + 14},${y + 7} ${x},${y + 14} ${x - 14},${y + 7}`} fill={(i + j) % 2 ? s.c1 : s.c2} />; }))}</g></svg>;
  if (s.cat === 'wall') return <svg className="sw" viewBox="0 0 84 84"><rect x="12" y="12" width="60" height="60" rx="4" fill={s.c1} stroke="#5a2d12" strokeWidth="2.5" />{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={16 + i * 12} y="14" width="6" height="56" fill={s.c2} />)}<rect x="12" y="62" width="60" height="10" fill={s.c3} /></svg>;
  return <svg className="sw" viewBox="0 0 84 84"><rect x="22" y="8" width="40" height="70" rx="4" fill={s.c1} stroke="#5a2d12" strokeWidth="2.5" /><rect x="29" y="16" width="26" height="30" rx="3" fill={s.c2} stroke="#5a2d12" strokeWidth="1.5" /><circle cx="54" cy="52" r="3.5" fill={s.c3} stroke="#5a2d12" /></svg>;
}

/** lưới nội thất/kiểu dáng: dùng trong SHOP; BUILD dùng bản dải ngang riêng */
export function ShopPanel({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const [tab, setTab] = useState<'furn' | 'ing' | 'recipe' | 'expand' | 'gems'>('furn');
  const [cat, setCat] = useState<Cat>('table');
  const isStyle = cat === 'floor' || cat === 'wall' || cat === 'door';
  const exp = nextExpansion();
  const cap = stockCap();
  return (
    <Modal title="CỬA HÀNG" onClose={onClose} wide>
      <Tabs tabs={[{ id: 'furn', label: 'Nội thất' }, { id: 'ing', label: 'Nguyên liệu' }, { id: 'recipe', label: 'Công thức' }, { id: 'expand', label: 'Mở rộng' }, { id: 'gems', label: 'Kim cương' }]} value={tab} onChange={setTab} />
      <div className="mbody">
        {tab === 'furn' && <>
          <div className="chips">{CATS.map((c) => <button key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => { sfx('click'); setCat(c.id); }}>{c.label}</button>)}</div>
          <div className="grid">
            {!isStyle && FURNITURE.filter((f) => f.cat === cat).map((f) => {
              const locked = s.level < f.level; const have = s.inventory[f.id] || 0;
              return <div key={f.id} className={'card' + (locked ? ' locked' : '')}>
                {have > 0 && <span className="owned">Kho {have}</span>}
                <div className="ico"><img src={furnitureIcon(f.id)} alt={f.name} /></div>
                <h4>{f.name}</h4><p>{f.desc}</p>
                {locked ? <span className="price"><Lock /> Cấp {f.level}</span> : <button className="btn gold" onClick={() => { if (buyFurniture(f.id).ok) { onClose(); setTimeout(() => { bus.emit('open-build', f.id); }, 50); } }}><Price gold={f.price} /></button>}
              </div>;
            })}
            {isStyle && STYLES.filter((x) => x.cat === cat).map((x) => {
              const owned = s.ownedStyles.includes(x.id); const locked = s.level < x.level; const cur = s[x.cat as 'floor'] === x.id;
              return <div key={x.id} className={'card' + (locked && !owned ? ' locked' : '')}>
                {cur && <span className="owned">Đang dùng</span>}
                <div className="ico"><StyleSwatch id={x.id} /></div><h4>{x.name}</h4>
                {owned ? <button className="btn blue" disabled={cur} onClick={() => buyStyle(x.id)}>Dùng</button>
                  : locked ? <span className="price"><Lock /> Cấp {x.level}</span> : <button className="btn gold" onClick={() => buyStyle(x.id)}><Price gold={x.price} /></button>}
              </div>;
            })}
          </div>
        </>}
        {tab === 'ing' && <>
          <div className="hint">Mỗi món cần nguyên liệu. Kho chứa tối đa <b>{cap}</b> mỗi loại (mỗi tủ lạnh +40). Hết nguyên liệu khách sẽ bỏ đi!</div>
          <label className="setrow"><span><b>Tự động nhập hàng</b><small style={{ display: 'block', opacity: .7 }}>Mua thêm 10 khi còn dưới 6 (nếu đủ vàng)</small></span>
            <input type="checkbox" style={{ width: 28, height: 28 }} checked={s.autoRestock} onChange={(e) => { s.autoRestock = e.target.checked; store.commit('auto'); sfx('click'); }} /></label>
          <div className="list" style={{ marginTop: 8 }}>
            {(Object.keys(ING) as Ing[]).map((k) => <div key={k} className="item">
              <div className="ico"><svg viewBox="0 0 40 40" width="46" height="46"><circle cx="20" cy="20" r="16" fill={ING[k].color} stroke="#5a2d12" strokeWidth="2.5" /></svg></div>
              <div className="txt"><h4>{ING[k].name}</h4><small>Còn {s.stock[k]} / {cap}</small><div className="bar g"><i style={{ width: (s.stock[k] / cap) * 100 + '%' }} /></div></div>
              <button className="btn gold" onClick={() => buyIngredient(k, 1)}>+{ING[k].pack} <Price gold={ING[k].unit * ING[k].pack} /></button>
            </div>)}
          </div>
        </>}
        {tab === 'recipe' && <div className="list">
          {DISHES.map((d) => { const own = s.ownedDishes.includes(d.id); const locked = s.level < d.level; return <div key={d.id} className={'item' + (own ? ' done' : '')}>
            <div className="ico"><img src={foodIcon(d.id)} alt={d.name} /></div>
            <div className="txt"><h4>{d.name}</h4><small>Bán {fmt(d.price)} vàng • nấu {d.cook}s</small></div>
            {own ? <span className="price">Đã học</span> : locked ? <span className="price"><Lock /> Cấp {d.level}</span> : <button className="btn gold" onClick={() => buyRecipe(d.id)}><Price gold={d.recipeCost} /></button>}
          </div>; })}
        </div>}
        {tab === 'expand' && <>
          <div className="hint">Diện tích hiện tại: <b>{s.gridW} × {s.gridH}</b> ô. Mở rộng để thêm bàn, bếp và khu phục vụ. Đồ đã đặt được giữ nguyên.</div>
          <div className="list">
            {EXPANSIONS.slice(1).map((e, i) => { const done = i < s.expansion; const next = i === s.expansion; return <div key={i} className={'item' + (done ? ' done' : next ? '' : ' off')}>
              <div className="txt"><h4>{e.name}</h4><small>{e.w} × {e.h} ô • cần cấp {e.level}</small></div>
              {done ? <span className="price">Đã mở</span> : next ? <button className="btn gold" onClick={() => { if (expand().ok) bus.emit('fit-camera'); }}><Price gold={e.price} /></button> : <span className="price"><Lock /></span>}
            </div>; })}
          </div>
          {!exp && <p>Nhà hàng đã đạt kích thước tối đa.</p>}
        </>}
        {tab === 'gems' && <>
          <div className="hint">Kim cương kiếm được khi lên cấp và hoàn thành nhiệm vụ. Dùng đổi lấy vàng:</div>
          <div className="grid">
            {[[1, 120], [5, 650], [20, 2800]].map(([g, gold]) => <div key={g} className="card">
              <div className="ico"><svg viewBox="0 0 32 32" width="64" height="64"><path d="M8 6h16l5 7-13 15L3 13z" fill="#5ee0ff" stroke="#5a2d12" strokeWidth="1.5" /></svg></div>
              <h4>{g} kim cương</h4><p>nhận {fmt(gold)} vàng</p>
              <button className="btn blue" onClick={() => { if (s.gems >= g) { s.gems -= g; addGold(gold); store.commit('gems'); sfx('coin'); bus.emit('toast', { text: `+${fmt(gold)} vàng`, kind: 'good' }); } else { sfx('error'); bus.emit('toast', { text: 'Không đủ kim cương', kind: 'bad' }); } }}><Gem /> {g}</button>
            </div>)}
          </div>
        </>}
      </div>
    </Modal>
  );
}
void spendGold; void addGems; void FURN_BY_ID; void Coin; void gameApi;
