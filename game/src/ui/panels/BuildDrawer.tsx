import React, { useState } from 'react';
import { useGame, useBus } from '../hooks';
import { CATS, FURNITURE, STYLES, Cat, FURN_BY_ID } from '../../data/catalog';
import { furnitureIcon } from '../../art/furniture';
import { buyFurniture, buyStyle } from '../../systems/actions';
import { gameApi, BuildUIState } from '../../game/GameScene';
import { StyleSwatch } from './Shop';
import { Rotate, Check, Close, Trash, Box, Coin, Lock } from '../icons';
import { sfx } from '../../systems/audio';
import { fmt } from '../hooks';

export function BuildDrawer({ onDone }: { onDone: () => void }) {
  const s = useGame();
  const [cat, setCat] = useState<Cat>('table');
  const [st] = useBus<BuildUIState>('build:state', { on: true, holding: null, selected: null });
  const isStyle = cat === 'floor' || cat === 'wall' || cat === 'door';
  const g = gameApi;
  const hold = st.holding; const sel = st.selected;
  return (
    <div className="buildbar">
      {(hold || sel) && <div className="tools">
        {hold && <>
          <span style={{ alignSelf: 'center', fontWeight: 800 }}>{FURN_BY_ID[hold.type].name}</span>
          {!FURN_BY_ID[hold.type].wall && <button className="btn blue" onClick={() => g?.rotate()}><Rotate /> Xoay</button>}
          <button className="btn" disabled={!hold.valid} onClick={() => g?.confirmHolding()}><Check /> Đặt</button>
          <button className="btn red" onClick={() => g?.cancelHolding()}><Close /> Hủy</button>
        </>}
        {!hold && sel && <>
          <span style={{ alignSelf: 'center', fontWeight: 800 }}>{FURN_BY_ID[sel.type].name}</span>
          {!FURN_BY_ID[sel.type].wall && <button className="btn blue" onClick={() => g?.rotate()}><Rotate /> Xoay</button>}
          <button className="btn gray" onClick={() => g?.storeSelected()}><Box /> Cất</button>
          <button className="btn red" onClick={() => g?.sellSelected()}><Trash /> Bán +{fmt(Math.floor(FURN_BY_ID[sel.type].price / 2))}</button>
        </>}
      </div>}
      <div className="drawer">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div className="tabs" style={{ flex: 1 }}>{CATS.map((c) => <button key={c.id} className={'tab' + (cat === c.id ? ' on' : '')} onClick={() => { sfx('click'); setCat(c.id); }}>{c.label}</button>)}</div>
          <button className="btn gold" onClick={() => { g?.setBuildMode(false); onDone(); }}><Check /> Xong</button>
        </div>
        <div className="strip">
          {!isStyle && FURNITURE.filter((f) => f.cat === cat).map((f) => {
            const have = s.inventory[f.id] || 0; const locked = s.level < f.level;
            return <button key={f.id} className={'slot' + (locked ? ' lock' : '') + (hold?.type === f.id ? ' sel' : '')} onClick={() => {
              if (locked) { sfx('error'); return; }
              if (have > 0) { sfx('click'); g?.startPlacing(f.id); } else if (buyFurniture(f.id).ok) g?.startPlacing(f.id);
            }}>
              {have > 0 && <span className="owned">{have}</span>}
              <img src={furnitureIcon(f.id)} alt="" />{f.name}
              {locked ? <span className="price"><Lock /> Cấp {f.level}</span> : have > 0 ? <span className="price" style={{ color: '#1f7a1d' }}>Đặt</span> : <span className="price"><Coin />{fmt(f.price)}</span>}
            </button>;
          })}
          {isStyle && STYLES.filter((x) => x.cat === cat).map((x) => {
            const owned = s.ownedStyles.includes(x.id); const locked = s.level < x.level && !owned; const cur = s[x.cat as 'floor'] === x.id;
            return <button key={x.id} className={'slot' + (locked ? ' lock' : '') + (cur ? ' sel' : '')} onClick={() => { if (!locked) buyStyle(x.id); else sfx('error'); }}>
              <div style={{ width: 52, height: 52, overflow: 'hidden' }}><StyleSwatch id={x.id} /></div>{x.name}
              {cur ? <span className="price">Đang dùng</span> : owned ? <span className="price" style={{ color: '#1f7a1d' }}>Dùng</span> : locked ? <span className="price"><Lock /> Cấp {x.level}</span> : <span className="price"><Coin />{fmt(x.price)}</span>}
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}
