import React from 'react';
import { Modal, Price } from '../Modal';
import { useGame, fmt } from '../hooks';
import { DISHES, ING, Ing, dishCost } from '../../data/dishes';
import { foodIcon } from '../../art/food';
import { toggleMenu, buyRecipe, HIRE_COST, ROLE_NAME, hireStaff, upgradeStaff, fireStaff, staffUpCost, kitchenUpCost, upgradeKitchen, cookMult, MAX_STAFF, canCook } from '../../systems/actions';
import { Lock, Coin } from '../icons';
import { StaffRole } from '../../core/state';
import { staffLook, drawCharacter } from '../../art/characters';

const faceCache = new Map<string, string>();
export function StaffFace({ role, look }: { role: StaffRole; look: number }) {
  const k = role + look; let u = faceCache.get(k);
  if (!u) { const c = drawCharacter(staffLook(role, look), false, 'idle'); u = c.toDataURL(); faceCache.set(k, u); }
  return <img src={u} alt="" style={{ height: 64 }} />;
}

export function MenuPanel({ onClose }: { onClose: () => void }) {
  const s = useGame();
  return (
    <Modal title="THỰC ĐƠN" onClose={onClose} wide>
      <div className="mbody">
        <div className="hint">Bật/tắt món khách có thể gọi (cần ít nhất 1 món). Món hết nguyên liệu sẽ không được gọi. Mở khóa món mới theo cấp độ.</div>
        <div className="list">
          {DISHES.map((d) => {
            const own = s.ownedDishes.includes(d.id); const on = s.menu.includes(d.id); const locked = s.level < d.level; const cost = dishCost(d);
            return <div key={d.id} className={'item' + (own && !on ? ' off' : '')}>
              <div className="ico"><img src={foodIcon(d.id)} alt={d.name} /></div>
              <div className="txt">
                <h4>{d.name}</h4>
                <small>Giá <b>{d.price}</b> • Vốn {cost} • <b style={{ color: '#1f7a1d' }}>Lãi {d.price - cost}</b> • Nấu {d.cook}s</small>
                <small>{(Object.entries(d.ing) as [Ing, number][]).map(([k, n]) => `${n} ${ING[k].name}`).join(', ')}{own && !canCook(d.id) ? ' — HẾT NGUYÊN LIỆU' : ''}</small>
              </div>
              {own ? <button className={'btn ' + (on ? 'green' : 'gray')} onClick={() => toggleMenu(d.id)}>{on ? 'Đang bán' : 'Đã tắt'}</button>
                : locked ? <span className="price"><Lock /> Cấp {d.level}</span>
                : <button className="btn gold" onClick={() => buyRecipe(d.id)}><Price gold={d.recipeCost} /></button>}
            </div>;
          })}
        </div>
      </div>
    </Modal>
  );
}

export function StaffPanel({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const roles: StaffRole[] = ['chef', 'waiter', 'cashier'];
  const desc: Record<StaffRole, string> = { chef: 'Nấu món tại bếp. Mỗi bếp cần 1 đầu bếp.', waiter: 'Ghi order, mang món, dọn bàn.', cashier: 'Thu tiền nhanh tại quầy thu ngân.' };
  return (
    <Modal title="NHÂN VIÊN" onClose={onClose} wide>
      <div className="mbody">
        <div className="item" style={{ marginBottom: 10, background: '#fff0c2' }}>
          <div className="txt"><h4>Nâng cấp bếp — cấp {s.kitchenLevel}</h4><small>Mỗi cấp nấu nhanh hơn 15% (hiện ×{cookMult(1).toFixed(2)}). Cần cấp người chơi {s.kitchenLevel * 2 - 1}.</small></div>
          <button className="btn gold" disabled={s.kitchenLevel >= 8} onClick={() => upgradeKitchen()}>{s.kitchenLevel >= 8 ? 'Tối đa' : <Price gold={kitchenUpCost()} />}</button>
        </div>
        <h4 style={{ margin: '6px 0' }}>Đội ngũ ({s.staff.length}/{MAX_STAFF})</h4>
        <div className="list">
          {s.staff.map((m) => <div key={m.id} className="item">
            <div className="ico"><StaffFace role={m.role} look={m.look} /></div>
            <div className="txt"><h4>{m.name}</h4><small>{ROLE_NAME[m.role]} • Kỹ năng {m.level}/10</small><div className="bar"><i style={{ width: m.level * 10 + '%' }} /></div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn blue" disabled={m.level >= 10} onClick={() => upgradeStaff(m.id)}>{m.level >= 10 ? 'Tối đa' : <>Nâng <Price gold={staffUpCost(m.level)} /></>}</button>
              {s.staff.length > 1 && <button className="btn gray" style={{ minHeight: 28, fontSize: 13 }} onClick={() => { if (confirm(`Cho ${m.name} nghỉ việc?`)) fireStaff(m.id); }}>Cho nghỉ</button>}
            </div>
          </div>)}
        </div>
        <h4 style={{ margin: '12px 0 6px' }}>Tuyển nhân viên</h4>
        <div className="grid">
          {roles.map((r) => <div key={r} className="card">
            <div className="ico"><StaffFace role={r} look={(s.nextStaffId + (r === 'chef' ? 0 : r === 'waiter' ? 1 : 2)) % 4} /></div>
            <h4>{ROLE_NAME[r]}</h4><p>{desc[r]}</p>
            <button className="btn gold" disabled={s.staff.length >= MAX_STAFF} onClick={() => hireStaff(r)}><Price gold={HIRE_COST[r]} /></button>
          </div>)}
        </div>
      </div>
    </Modal>
  );
}
void Coin;
