'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
  '#00D2D3', '#FF6B35', '#1DD1A1', '#F368E0',
  '#A29BFE', '#FD79A8', '#6C5CE7', '#FDCB6E',
];

const DEFAULT_ITEMS = [
  '삼겹살 🥩', '치킨 🍗', '피자 🍕', '짜장면 🍜',
  '라면 🍜', '김밥 🍱', '떡볶이 🌶️', '햄버거 🍔',
];

const CANVAS_SIZE = 600;
const CX = CANVAS_SIZE / 2;
const CY = CANVAS_SIZE / 2;
const RADIUS = CANVAS_SIZE / 2 - 12;

function drawWheel(
  ctx: CanvasRenderingContext2D,
  items: string[],
  rotation: number
) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const n = items.length;

  if (n === 0) {
    ctx.beginPath();
    ctx.arc(CX, CY, RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();
    ctx.fillStyle = '#6b7280';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('항목을 추가해 주세요', CX, CY);
    return;
  }

  const arc = (2 * Math.PI) / n;

  // Outer shadow ring
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS + 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a1040';
  ctx.fill();
  ctx.restore();

  // Sectors
  for (let i = 0; i < n; i++) {
    const startAngle = rotation + arc * i - Math.PI / 2;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, RADIUS, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Sector labels
  const fontSize = Math.max(11, Math.min(18, Math.floor(110 / n) + 5));
  ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif`;

  for (let i = 0; i < n; i++) {
    const midAngle = rotation + arc * i + arc / 2 - Math.PI / 2;
    const textR = RADIUS * 0.66;

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(midAngle);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 5;

    let text = items[i];
    const maxWidth = textR * 0.9;
    while (ctx.measureText(text).width > maxWidth && text.length > 1) {
      text = text.slice(0, -1);
    }
    if (text !== items[i]) text += '…';

    ctx.fillText(text, textR, 0);
    ctx.restore();
  }

  // Outer decorative ring
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Dot markers at sector boundaries
  for (let i = 0; i < n; i++) {
    const angle = rotation + arc * i - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(
      CX + Math.cos(angle) * RADIUS,
      CY + Math.sin(angle) * RADIUS,
      n <= 8 ? 6 : 4,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'transparent';
    ctx.fill();
  }

  // Center hub
  const hubGrad = ctx.createRadialGradient(CX - 6, CY - 6, 2, CX, CY, 32);
  hubGrad.addColorStop(0, '#f9fafb');
  hubGrad.addColorStop(1, '#d1d5db');
  ctx.beginPath();
  ctx.arc(CX, CY, 32, 0, 2 * Math.PI);
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, 11, 0, 2 * Math.PI);
  ctx.fillStyle = '#6b7280';
  ctx.fill();

  // Fixed pointer triangle at top
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(CX - 16, 2);
  ctx.lineTo(CX + 16, 2);
  ctx.lineTo(CX, 38);
  ctx.closePath();
  ctx.fillStyle = '#ef4444';
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

export default function Roulette() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [inputError, setInputError] = useState('');
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const redraw = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawWheel(ctx, itemsRef.current, rotation);
  }, []);

  useEffect(() => {
    redraw(rotationRef.current);
  }, [items, redraw]);

  const spin = useCallback(() => {
    if (isSpinning || items.length < 2) return;
    setIsSpinning(true);
    setWinner(null);
    setShowModal(false);

    const totalRotation = (5 + Math.random() * 5) * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const startRot = rotationRef.current;
    const endRot = startRot + totalRotation;
    const duration = 4000 + Math.random() * 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const current = startRot + totalRotation * eased;
      rotationRef.current = current;
      redraw(current);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      rotationRef.current = endRot;
      setIsSpinning(false);

      const n = itemsRef.current.length;
      const arc = (2 * Math.PI) / n;
      const norm = ((endRot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const idx = Math.floor((2 * Math.PI - norm) / arc) % n;

      setTimeout(() => {
        setWinner(itemsRef.current[idx]);
        setShowModal(true);
      }, 350);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [isSpinning, items.length, redraw]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      setInputError('이미 있는 항목입니다.');
      return;
    }
    if (items.length >= 16) {
      setInputError('최대 16개까지 추가할 수 있습니다.');
      return;
    }
    setItems(prev => [...prev, trimmed]);
    setNewItem('');
    setInputError('');
  };

  const removeItem = (index: number) => {
    if (isSpinning) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const resetItems = () => {
    if (isSpinning) return;
    setItems(DEFAULT_ITEMS);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a0b3b] to-[#0d1b3e] flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
          🎡 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">룰렛</span>
        </h1>
        <p className="text-white/40 text-sm mt-2">항목을 추가하고 룰렛을 돌려보세요!</p>
      </div>

      {/* Main layout */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">

        {/* Wheel column */}
        <div className="flex flex-col items-center gap-6">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[500px] md:h-[500px] drop-shadow-2xl rounded-full"
          />

          <button
            onClick={spin}
            disabled={isSpinning || items.length < 2}
            className="relative px-14 py-4 text-white text-xl font-extrabold rounded-full shadow-2xl
              transition-all duration-150 select-none
              bg-gradient-to-r from-rose-500 to-pink-600
              hover:from-rose-400 hover:to-pink-500 hover:scale-105 hover:shadow-pink-500/40 hover:shadow-2xl
              active:scale-95
              disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
          >
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <span className="inline-block animate-spin">⏳</span> 돌아가는 중...
              </span>
            ) : (
              '🎯 돌리기!'
            )}
          </button>
        </div>

        {/* Controls column */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Add item card */}
          <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl">
            <h2 className="text-white font-bold text-base mb-3">➕ 항목 추가</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={e => { setNewItem(e.target.value); setInputError(''); }}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="새 항목 입력..."
                maxLength={20}
                className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2.5
                  outline-none focus:bg-white/15 focus:ring-2 focus:ring-purple-500/50
                  transition text-sm border border-white/10"
              />
              <button
                onClick={addItem}
                disabled={!newItem.trim() || items.length >= 16}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:opacity-50
                  text-white rounded-xl px-4 py-2.5 font-bold text-lg transition"
              >
                +
              </button>
            </div>
            {inputError && (
              <p className="text-rose-400 text-xs mt-2">{inputError}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-white/40 text-xs">{items.length} / 16 항목</span>
              <button
                onClick={resetItems}
                disabled={isSpinning}
                className="text-white/30 hover:text-white/60 text-xs transition disabled:opacity-30"
              >
                초기화
              </button>
            </div>
            {items.length < 2 && (
              <p className="text-yellow-400 text-xs mt-2">⚠️ 룰렛을 돌리려면 2개 이상 항목이 필요합니다.</p>
            )}
          </div>

          {/* Item list card */}
          <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl">
            <h2 className="text-white font-bold text-base mb-3">📝 항목 목록</h2>
            {items.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-6">항목이 없습니다</p>
            ) : (
              <ul className="space-y-2 max-h-[340px] overflow-y-auto">
                {items.map((item, i) => (
                  <li
                    key={`${item}-${i}`}
                    className="group flex items-center gap-3 bg-white/8 hover:bg-white/12
                      rounded-xl px-3 py-2.5 transition"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-white text-sm flex-1 truncate">{item}</span>
                    <button
                      onClick={() => removeItem(i)}
                      disabled={isSpinning}
                      title="삭제"
                      className="text-white/20 hover:text-rose-400 disabled:opacity-0
                        opacity-0 group-hover:opacity-100 transition text-xl leading-none flex-shrink-0"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Winner modal */}
      {showModal && winner && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Confetti */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className="confetti-piece absolute text-2xl"
                style={{
                  left: `${5 + (i * 4.7) % 90}%`,
                  top: `${10 + (i * 3.3) % 30}%`,
                  animationDelay: `${(i * 0.07).toFixed(2)}s`,
                  animationDuration: `${0.8 + (i % 5) * 0.2}s`,
                }}
              >
                {['🎉', '🎊', '✨', '⭐', '🌟'][i % 5]}
              </span>
            ))}
          </div>

          <div
            className="animate-modal-in bg-white rounded-3xl p-8 sm:p-12 text-center shadow-2xl max-w-sm w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl sm:text-7xl mb-4 animate-bounce select-none">🎉</div>
            <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2">당첨!</p>
            <p
              className="text-3xl sm:text-4xl font-black mb-8 leading-tight break-words"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {winner}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowModal(false); spin(); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-6 py-2.5 font-semibold text-sm transition"
              >
                한 번 더
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="text-white rounded-full px-8 py-2.5 font-bold text-sm transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
