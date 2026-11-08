import React from 'react';
import { Close, Coin, Gem } from './icons';
import { sfx } from '../systems/audio';
import { fmt } from './hooks';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) { sfx('click'); onClose(); } }}>
      <div className="modal" style={wide ? { width: 'min(900px,100%)' } : undefined}>
        <div className="mhead">{title}<button className="mclose" onClick={() => { sfx('click'); onClose(); }}><Close /></button></div>
        {children}
      </div>
    </div>
  );
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <div className="tabs">{tabs.map((t) => <button key={t.id} className={'tab' + (t.id === value ? ' on' : '')} onClick={() => { sfx('click'); onChange(t.id); }}>{t.label}</button>)}</div>;
}
export const Price = ({ gold, gems }: { gold?: number; gems?: number }) => (
  <span className="price">{gold !== undefined && <><Coin />{fmt(gold)}</>}{gems !== undefined && <><Gem />{fmt(gems)}</>}</span>
);
