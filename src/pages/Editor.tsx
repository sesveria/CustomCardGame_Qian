import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, Relation, RelationType, Deck } from '../engine/types';
import { RELATION_LABELS, RELATION_SCORES } from '../engine/types';

const sampleDeck: Deck = {
  meta: { name: '初中物理 — 力学', description: '覆盖牛顿定律、力、运动等核心概念的关系', author: '系统', version: '1.0' },
  cards: [
    { id: 'newton1', name: '牛顿第一定律', description: '一切物体在不受外力时总保持匀速直线运动或静止状态', category: '定律' },
    { id: 'inertia', name: '惯性', description: '物体保持原来运动状态不变的性质', category: '概念' },
    { id: 'newton2', name: '牛顿第二定律', description: '物体加速度的大小与合外力成正比，与质量成反比', category: '定律' },
    { id: 'fma', name: 'F = ma', description: '力 = 质量 × 加速度', category: '公式' },
    { id: 'force', name: '力', description: '物体对物体的作用', category: '概念' },
    { id: 'accel', name: '加速度', description: '速度变化的快慢，a = Δv/Δt', category: '概念' },
    { id: 'mass', name: '质量', description: '物体所含物质的多少，国际单位是千克', category: '概念' },
    { id: 'newton3', name: '牛顿第三定律', description: '作用力与反作用力大小相等、方向相反', category: '定律' },
    { id: 'gravity', name: '重力', description: '地球对物体的吸引力，G = mg', category: '概念' },
    { id: 'friction', name: '摩擦力', description: '两个相互接触的物体相对滑动时产生的阻力', category: '概念' },
    { id: 'velocity', name: '速度', description: '单位时间内物体移动的距离，v = s/t', category: '概念' },
    { id: 'momentum', name: '动量', description: '物体的质量与速度的乘积，p = mv', category: '概念' },
  ],
  relations: [
    { cardA: 'newton1', cardB: 'inertia', type: 'generalization', explanation: '牛顿第一定律又称惯性定律' },
    { cardA: 'newton2', cardB: 'fma', type: 'application', explanation: 'F=ma 是牛顿第二定律的数学表达式' },
    { cardA: 'newton2', cardB: 'force', type: 'causal', explanation: '牛顿第二定律定量描述了力与运动的关系' },
    { cardA: 'force', cardB: 'accel', type: 'causal', explanation: '力是产生加速度的原因' },
    { cardA: 'mass', cardB: 'inertia', type: 'analogy', explanation: '质量越大，惯性越大——质量是惯性的量度' },
    { cardA: 'newton3', cardB: 'force', type: 'application', explanation: '牛顿第三定律描述了力的相互作用本质' },
    { cardA: 'gravity', cardB: 'force', type: 'generalization', explanation: '重力是一种特殊的力' },
    { cardA: 'friction', cardB: 'force', type: 'generalization', explanation: '摩擦力是一种力' },
    { cardA: 'velocity', cardB: 'momentum', type: 'prerequisite', explanation: '速度是动量的组成部分' },
  ],
};

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const [editorDeck, setEditorDeck] = useState<Deck>(structuredClone(sampleDeck));
  const [activeTab, setActiveTab] = useState<'cards' | 'relations' | 'import'>('cards');
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [editRelation, setEditRelation] = useState<Relation | null>(null);
  const [importText, setImportText] = useState('');

  const cards = editorDeck.cards;
  const relations = editorDeck.relations;

  const addCard = () => {
    const newCard: Card = { id: 'card_' + Date.now(), name: '新卡牌', description: '', category: '' };
    setEditorDeck({ ...editorDeck, cards: [...cards, newCard] });
    setEditCard(newCard);
  };

  const saveCard = (card: Card) => {
    const idx = cards.findIndex((c) => c.id === card.id);
    if (idx >= 0) {
      const updated = [...cards];
      updated[idx] = card;
      setEditorDeck({ ...editorDeck, cards: updated });
    }
    setEditCard(null);
  };

  const deleteCard = (id: string) => {
    setEditorDeck({
      ...editorDeck,
      cards: cards.filter((c) => c.id !== id),
      relations: relations.filter((r) => r.cardA !== id && r.cardB !== id),
    });
  };

  const addRelation = () => {
    const newRel: Relation = { cardA: cards[0]?.id ?? '', cardB: cards[0]?.id ?? '', type: 'prerequisite', explanation: '' };
    setEditorDeck({ ...editorDeck, relations: [...relations, newRel] });
    setEditRelation(newRel);
  };

  const saveRelation = (rel: Relation) => {
    const idx = relations.indexOf(editRelation!);
    if (idx >= 0) {
      const updated = [...relations];
      updated[idx] = rel;
      setEditorDeck({ ...editorDeck, relations: updated });
    }
    setEditRelation(null);
  };

  const deleteRelation = (idx: number) => {
    const updated = [...relations];
    updated.splice(idx, 1);
    setEditorDeck({ ...editorDeck, relations: updated });
  };

  const handleImport = () => {
    try {
      const deck = JSON.parse(importText) as Deck;
      if (!deck.meta || !deck.cards || !deck.relations) { alert('JSON 格式错误'); return; }
      setEditorDeck(deck);
      setImportText('');
      alert('导入成功！');
    } catch { alert('JSON 格式错误'); }
  };

  const handleExport = () => {
    const json = JSON.stringify(editorDeck, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${editorDeck.meta.name}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const getCardName = (id: string) => cards.find((c) => c.id === id)?.name ?? '(未知卡牌)';

  return (
    <div className="page page-editor">
      <div className="editor-header">
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/lobby')}>← 返回大厅</button>
        <h1>卡组编辑器</h1>
        <button className="btn btn-sm btn-secondary" onClick={handleExport}>📥 导出 JSON</button>
      </div>

      <div className="editor-meta">
        <label>名称:</label>
        <input value={editorDeck.meta.name} onChange={(e) => setEditorDeck({ ...editorDeck, meta: { ...editorDeck.meta, name: e.target.value } })} />
        <label>描述:</label>
        <input value={editorDeck.meta.description} onChange={(e) => setEditorDeck({ ...editorDeck, meta: { ...editorDeck.meta, description: e.target.value } })} />
      </div>

      <div className="editor-tabs">
        <button className={`tab-btn ${activeTab === 'cards' ? 'tab-active' : ''}`} onClick={() => setActiveTab('cards')}>🃏 卡牌 ({cards.length})</button>
        <button className={`tab-btn ${activeTab === 'relations' ? 'tab-active' : ''}`} onClick={() => setActiveTab('relations')}>🔗 关联 ({relations.length})</button>
        <button className={`tab-btn ${activeTab === 'import' ? 'tab-active' : ''}`} onClick={() => setActiveTab('import')}>📂 导入/导出</button>
      </div>

      {activeTab === 'cards' && (
        <div className="editor-tab-content">
          <button className="btn btn-primary" onClick={addCard}>+ 新建卡牌</button>
          <div className="editor-list">
            {cards.map((card) => (
              <div key={card.id} className="editor-list-item">
                {editCard?.id === card.id ? (
                  <div className="editor-card-edit">
                    <input value={editCard.name} onChange={(e) => setEditCard({ ...editCard, name: e.target.value })} placeholder="名称" />
                    <input value={editCard.description ?? ''} onChange={(e) => setEditCard({ ...editCard, description: e.target.value })} placeholder="描述" />
                    <input value={editCard.category ?? ''} onChange={(e) => setEditCard({ ...editCard, category: e.target.value })} placeholder="分类" />
                    <div className="edit-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => editCard && saveCard(editCard)}>保存</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditCard(null)}>取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="editor-list-row">
                    <span className="list-name">{card.name}</span>
                    <span className="list-cat">{card.category ?? '-'}</span>
                    <span className="list-desc">{card.description ?? '-'}</span>
                    <div className="list-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditCard(card)}>编辑</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteCard(card.id)}>删除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'relations' && (
        <div className="editor-tab-content">
          <button className="btn btn-primary" onClick={addRelation} disabled={cards.length < 2}>+ 新建关联</button>
          <div className="editor-list">
            {relations.map((rel, idx) => (
              <div key={idx} className="editor-list-item">
                {editRelation === rel ? (
                  <div className="editor-rel-edit">
                    <div className="rel-pair">
                      <select value={editRelation.cardA} onChange={(e) => setEditRelation({ ...editRelation, cardA: e.target.value })}>
                        {cards.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <span>↔</span>
                      <select value={editRelation.cardB} onChange={(e) => setEditRelation({ ...editRelation, cardB: e.target.value })}>
                        {cards.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                    <select value={editRelation.type} onChange={(e) => setEditRelation({ ...editRelation, type: e.target.value as RelationType })}>
                      {Object.entries(RELATION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v} (+{RELATION_SCORES[k as RelationType]})</option>
                      ))}
                    </select>
                    <input value={editRelation.explanation} onChange={(e) => setEditRelation({ ...editRelation, explanation: e.target.value })} placeholder="关联说明" />
                    <div className="edit-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => editRelation && saveRelation(editRelation)}>保存</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditRelation(null)}>取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="editor-list-row">
                    <span className="list-name">{getCardName(rel.cardA)} ↔ {getCardName(rel.cardB)}</span>
                    <span className="list-cat">[{RELATION_LABELS[rel.type] || rel.type}]</span>
                    <span className="list-desc">{rel.explanation}</span>
                    <div className="list-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditRelation(rel)}>编辑</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteRelation(idx)}>删除</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="editor-tab-content">
          <h3>导入卡组 JSON</h3>
          <textarea className="editor-import-textarea" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="在此粘贴 JSON 内容..." rows={15} />
          <button className="btn btn-primary" onClick={handleImport}>导入</button>
          <h3 style={{ marginTop: 32 }}>导出当前卡组</h3>
          <button className="btn btn-secondary" onClick={handleExport}>📥 下载 JSON 文件</button>
        </div>
      )}
    </div>
  );
};

export default Editor;
