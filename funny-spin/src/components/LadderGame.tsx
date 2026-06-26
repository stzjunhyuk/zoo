'use client';

import { useState, useEffect, useMemo } from 'react';

// ── Constants ─────────────────────────────────────────
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FECA57', '#FF9FF3', '#54A0FF', '#1DD1A1', '#F368E0'];
const COL_W = 80, ROW_H = 48, PAD_X = 65, PAD_T = 88, PAD_B = 88, ROWS = 10;

// ── Ladder logic ──────────────────────────────────────
function makeConn(n: number): boolean[][] {
  const c = Array.from({ length: n - 1 }, () => new Array<boolean>(ROWS).fill(false));
  for (let r = 0; r < ROWS; r++)
    for (let col = 0; col < n - 1; col++) {
      if (col > 0 && c[col - 1][r]) continue;
      c[col][r] = Math.random() < 0.4;
    }
  return c;
}

function resolveEnd(conn: boolean[][], start: number): number {
  let c = start;
  const n = conn.length + 1;
  for (let r = 0; r < ROWS; r++) {
    if (c < n - 1 && conn[c][r]) c++;
    else if (c > 0 && conn[c - 1][r]) c--;
  }
  return c;
}

function buildPath(conn: boolean[][], start: number): [number, number][] {
  const n = conn.length + 1;
  const xOf = (col: number) => PAD_X + col * COL_W;
  const pts: [number, number][] = [];
  let c = start;
  pts.push([xOf(c), PAD_T]);
  for (let r = 0; r < ROWS; r++) {
    const midY = PAD_T + r * ROW_H + ROW_H / 2;
    pts.push([xOf(c), midY]);
    let nc = c;
    if (c < n - 1 && conn[c][r]) nc = c + 1;
    else if (c > 0 && conn[c - 1][r]) nc = c - 1;
    if (nc !== c) { pts.push([xOf(nc), midY]); c = nc; }
    pts.push([xOf(c), PAD_T + (r + 1) * ROW_H]);
  }
  return pts;
}

const trunc = (s: string, n = 5) => s.length > n ? s.slice(0, n) + '…' : s;

// ── Default entries ───────────────────────────────────
const DEFAULTS = [
  { name: '1번', prize: '당첨 🎁' },
  { name: '2번', prize: '꽝 😭' },
  { name: '3번', prize: '행운 🍀' },
  { name: '4번', prize: '꽝 😭' },
  { name: '5번', prize: '2등 🥈' },
];

// ── Component ─────────────────────────────────────────
export default function LadderGame() {
  const [entries, setEntries] = useState(DEFAULTS);
  const [newName, setNewName] = useState('');
  const [conn, setConn] = useState<boolean[][]>([]);
  const [gameOn, setGameOn] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, number>>({});

  const n = entries.length;
  const svgW = PAD_X * 2 + (n - 1) * COL_W;
  const svgH = PAD_T + ROWS * ROW_H + PAD_B;
  const xOf = (col: number) => PAD_X + col * COL_W;
  const color = (i: number) => COLORS[i % COLORS.length];

  const animPts = useMemo(
    () => (picked !== null && conn.length ? buildPath(conn, picked) : []),
    [picked, conn]
  );

  // Animation ticker
  useEffect(() => {
    if (!running) return;
    if (step >= animPts.length - 1) {
      setRunning(false);
      if (picked !== null)
        setRevealed(prev => ({ ...prev, [picked]: resolveEnd(conn, picked) }));
      return;
    }
    const t = setTimeout(() => setStep(s => s + 1), 55);
    return () => clearTimeout(t);
  }, [running, step, animPts.length, picked, conn]);

  const startGame = () => {
    if (n < 2) return;
    setConn(makeConn(n));
    setGameOn(true);
    setRevealed({});
    setPicked(null);
    setStep(0);
    setRunning(false);
  };

  const climbLadder = (col: number) => {
    if (!gameOn || running || revealed[col] !== undefined) return;
    setPicked(col);
    setStep(0);
    setRunning(true);
  };

  const revealAll = () => {
    if (!gameOn || running) return;
    const map: Record<number, number> = {};
    for (let i = 0; i < n; i++) map[i] = resolveEnd(conn, i);
    setRevealed(map);
    setPicked(null);
  };

  const goBack = () => {
    setGameOn(false);
    setConn([]);
    setRevealed({});
    setPicked(null);
    setStep(0);
    setRunning(false);
  };

  const addEntry = () => {
    const nm = newName.trim();
    if (!nm || n >= 8) return;
    setEntries(e => [...e, { name: nm, prize: '꽝 😭' }]);
    setNewName('');
  };

  const removeEntry = (i: number) => {
    if (n <= 2) return;
    setEntries(e => e.filter((_, j) => j !== i));
  };

  // ── Setup screen ──────────────────────────────────
  if (!gameOn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0d2137] flex flex-col items-center px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            🪜{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              사다리타기
            </span>
          </h1>
          <p className="text-white/40 text-sm mt-2">참가자와 결과를 설정하고 사다리를 생성하세요!</p>
        </header>

        <div className="w-full max-w-lg space-y-4">
          <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl">
            <h2 className="text-white font-bold mb-3 text-sm">👥 참가자 &amp; 결과 설정</h2>

            {/* Column headers */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 mb-2 px-1">
              <div className="w-5" />
              <span className="text-white/40 text-xs">참가자</span>
              <span className="text-white/40 text-xs">결과</span>
              <div className="w-6" />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
              {entries.map((e, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color(i) }}
                  />
                  <input
                    value={e.name}
                    onChange={ev => setEntries(arr => arr.map((x, j) => j === i ? { ...x, name: ev.target.value } : x))}
                    maxLength={10}
                    className="bg-white/10 text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:bg-white/20 border border-white/10 w-full"
                  />
                  <input
                    value={e.prize}
                    onChange={ev => setEntries(arr => arr.map((x, j) => j === i ? { ...x, prize: ev.target.value } : x))}
                    maxLength={12}
                    className="bg-white/10 text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:bg-white/20 border border-white/10 w-full"
                  />
                  <button
                    onClick={() => removeEntry(i)}
                    disabled={n <= 2}
                    className="w-6 h-6 text-white/30 hover:text-rose-400 disabled:opacity-20 transition text-xl leading-none"
                  >×</button>
                </div>
              ))}
            </div>

            {n < 8 && (
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEntry()}
                  placeholder="참가자 추가..."
                  maxLength={10}
                  className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2 outline-none focus:bg-white/20 text-sm border border-white/10"
                />
                <button
                  onClick={addEntry}
                  disabled={!newName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl px-4 py-2 font-bold transition"
                >+</button>
              </div>
            )}
            <p className="text-white/30 text-xs mt-2">{n} / 8 명</p>
          </div>

          <button
            onClick={startGame}
            disabled={n < 2}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-xl shadow-2xl
              bg-gradient-to-r from-cyan-500 to-blue-600
              hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02]
              active:scale-[0.98]
              disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50
              transition-all duration-150"
          >
            🪜 사다리 생성!
          </button>
        </div>
      </div>
    );
  }

  // ── Game screen ───────────────────────────────────
  const allRevealedCount = Object.keys(revealed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0d2137] flex flex-col items-center px-4 py-8">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          🪜{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            사다리타기
          </span>
        </h1>

        <div className="mt-2 h-6">
          {running && (
            <p className="text-yellow-300 text-sm animate-pulse font-semibold">사다리를 타는 중...</p>
          )}
          {!running && picked !== null && revealed[picked] !== undefined && allRevealedCount < n && (
            <p className="text-green-400 text-sm font-bold">
              {entries[picked].name} → {entries[revealed[picked]].prize}!
            </p>
          )}
          {!running && allRevealedCount === n && (
            <p className="text-yellow-300 text-sm font-semibold">🎊 모든 결과가 공개됐습니다!</p>
          )}
          {!running && allRevealedCount === 0 && (
            <p className="text-white/30 text-sm">위의 이름을 클릭해서 사다리를 타세요</p>
          )}
        </div>
      </header>

      {/* Ladder SVG */}
      <div className="w-full overflow-x-auto pb-2">
        <svg
          width={svgW}
          height={svgH}
          className="mx-auto block"
          style={{ minWidth: svgW }}
        >
          {/* Vertical lines */}
          {entries.map((_, i) => (
            <line key={i}
              x1={xOf(i)} y1={PAD_T} x2={xOf(i)} y2={PAD_T + ROWS * ROW_H}
              stroke={color(i)} strokeWidth={3} strokeOpacity={0.3}
            />
          ))}

          {/* Horizontal bars */}
          {conn.flatMap((colConn, c) =>
            colConn.map((has, r) => has ? (
              <line key={`${c}-${r}`}
                x1={xOf(c)} y1={PAD_T + r * ROW_H + ROW_H / 2}
                x2={xOf(c + 1)} y2={PAD_T + r * ROW_H + ROW_H / 2}
                stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} strokeLinecap="round"
              />
            ) : null)
          )}

          {/* Revealed paths */}
          {Object.entries(revealed).map(([k]) => {
            const col = Number(k);
            const pts = buildPath(conn, col);
            return (
              <polyline key={col}
                points={pts.map(([px, py]) => `${px},${py}`).join(' ')}
                fill="none" stroke={color(col)} strokeWidth={4.5}
                strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.9}
              />
            );
          })}

          {/* Animating path */}
          {running && animPts.length > 1 && (
            <polyline
              points={animPts.slice(0, step + 1).map(([px, py]) => `${px},${py}`).join(' ')}
              fill="none"
              stroke={picked !== null ? color(picked) : '#FECA57'}
              strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
            />
          )}

          {/* Participant labels (top) */}
          {entries.map((entry, i) => {
            const isDone = revealed[i] !== undefined;
            const isActive = running && picked === i;
            const canPick = !running && !isDone;
            return (
              <g key={i} onClick={() => climbLadder(i)} style={{ cursor: canPick ? 'pointer' : 'default' }}>
                {/* dashed connector */}
                <line
                  x1={xOf(i)} y1={PAD_T - 36} x2={xOf(i)} y2={PAD_T}
                  stroke={color(i)} strokeWidth={2} strokeOpacity={0.4} strokeDasharray="3 2"
                />
                {/* label bg */}
                <rect
                  x={xOf(i) - 35} y={PAD_T - 68}
                  width={70} height={30} rx={8}
                  fill={color(i)}
                  fillOpacity={isDone ? 0.45 : isActive ? 1 : 0.85}
                />
                {/* hover overlay – uses pointer-events */}
                {canPick && (
                  <rect
                    x={xOf(i) - 35} y={PAD_T - 68}
                    width={70} height={30} rx={8}
                    fill="rgba(255,255,255,0.12)"
                  />
                )}
                {/* label text */}
                <text
                  x={xOf(i)} y={PAD_T - 52}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize={12} fontWeight="bold"
                  fontFamily="'Malgun Gothic','Apple SD Gothic Neo',Arial,sans-serif"
                >
                  {isDone ? '✓ ' : ''}{trunc(entry.name)}
                </text>
              </g>
            );
          })}

          {/* Prize labels (bottom) */}
          {entries.map((entry, i) => {
            // which participant (if any) landed on column i?
            const winnerEntry = Object.entries(revealed).find(([, end]) => end === i);
            const won = winnerEntry !== undefined;
            const winnerCol = won ? Number(winnerEntry![0]) : -1;
            return (
              <g key={i}>
                <line
                  x1={xOf(i)} y1={PAD_T + ROWS * ROW_H}
                  x2={xOf(i)} y2={PAD_T + ROWS * ROW_H + 20}
                  stroke={won ? color(winnerCol) : 'rgba(255,255,255,0.2)'}
                  strokeWidth={2} strokeDasharray="3 2"
                />
                <rect
                  x={xOf(i) - 35} y={PAD_T + ROWS * ROW_H + 20}
                  width={70} height={30} rx={8}
                  fill={won ? color(winnerCol) : 'rgba(255,255,255,0.08)'}
                  stroke={won ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={1}
                />
                <text
                  x={xOf(i)} y={PAD_T + ROWS * ROW_H + 35}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={won ? 'white' : 'rgba(255,255,255,0.75)'}
                  fontSize={11} fontWeight={won ? 'bold' : 'normal'}
                  fontFamily="'Malgun Gothic','Apple SD Gothic Neo',Arial,sans-serif"
                >
                  {trunc(entry.prize, 6)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <button
          onClick={revealAll}
          disabled={running || allRevealedCount === n}
          className="px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all
            bg-gradient-to-r from-yellow-500 to-orange-500
            hover:from-yellow-400 hover:to-orange-400 hover:scale-105 active:scale-95
            disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 disabled:scale-100"
        >
          🔍 전체 공개
        </button>
        <button
          onClick={startGame}
          disabled={running}
          className="px-6 py-3 rounded-full font-bold text-white border border-white/20
            bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all"
        >
          🔄 다시 생성
        </button>
        <button
          onClick={goBack}
          className="px-6 py-3 rounded-full font-bold text-white border border-white/15
            bg-white/8 hover:bg-white/15 transition-all"
        >
          ← 처음으로
        </button>
      </div>
    </div>
  );
}
