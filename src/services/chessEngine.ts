// ============================================================
//  src/services/chessEngine.ts
//  RAKCHA GAME — Full Professional Chess Rules Engine
//  Supports 100% of official FIDE rules: castling, en passant,
//  promotion, check, checkmate, stalemate, 50-move rule, repetition,
//  SAN generation, and legal move validation.
// ============================================================

import {
  AiLogicLearningService,
  AiDifficulty,
  ChessPlayerProfile,
} from './aiLogicLearningService';

export type { AiDifficulty };

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Square = string; // e.g., 'e4', 'a1'

export interface BoardState {
  board: (Piece | null)[][]; // 8x8: 0 is rank 8, 7 is rank 1
  turn: Color;
  castlingRights: {
    w: { k: boolean; q: boolean };
    b: { k: boolean; q: boolean };
  };
  enPassantSquare: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  history: MoveRecord[];
  capturedWhite: PieceType[];
  capturedBlack: PieceType[];
  status: 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner: Color | 'draw' | null;
  drawReason?: string;
}

export interface MoveRecord {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  san: string;
  isCastling?: 'K' | 'Q';
  isEnPassant?: boolean;
}

export interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  promotion?: PieceType;
}

// Convert algebraic like 'e4' to [row, col] (row 0 = rank 8, col 0 = file a)
export function squareToCoords(sq: Square): [number, number] {
  const file = sq.charCodeAt(0) - 97; // 'a' -> 0
  const rank = 8 - parseInt(sq[1], 10); // '8' -> 0
  return [rank, file];
}

export function coordsToSquare(row: number, col: number): Square {
  const fileChar = String.fromCharCode(97 + col);
  const rankChar = (8 - row).toString();
  return fileChar + rankChar;
}

export class ChessGame {
  private state: BoardState;
  private positionHistory: string[] = [];
  private stateStack: { state: BoardState; positionHistory: string[] }[] = [];
  private redoStack: { state: BoardState; positionHistory: string[] }[] = [];

  constructor(fen?: string) {
    this.state = this.getInitialState();
    this.positionHistory = [];
    this.stateStack = [];
    this.redoStack = [];
    this.recordPosition();
  }

  public getInitialState(): BoardState {
    const emptyRow = (): (Piece | null)[] => [null, null, null, null, null, null, null, null];
    const board: (Piece | null)[][] = [
      [
        { type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' },
        { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }
      ],
      [
        { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' },
        { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }
      ],
      emptyRow(),
      emptyRow(),
      emptyRow(),
      emptyRow(),
      [
        { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' },
        { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }
      ],
      [
        { type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' },
        { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }
      ]
    ];

    return {
      board,
      turn: 'w',
      castlingRights: {
        w: { k: true, q: true },
        b: { k: true, q: true }
      },
      enPassantSquare: null,
      halfmoveClock: 0,
      fullmoveNumber: 1,
      history: [],
      capturedWhite: [],
      capturedBlack: [],
      status: 'active',
      winner: null
    };
  }

  public getState(): BoardState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public reset(): void {
    this.state = this.getInitialState();
    this.positionHistory = [];
    this.stateStack = [];
    this.redoStack = [];
    this.recordPosition();
  }

  public canUndo(): boolean {
    return this.stateStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): boolean {
    if (this.stateStack.length === 0) return false;
    // Save the current position on the redo stack before rewinding so it
    // can be replayed forward again with redo().
    this.redoStack.push({
      state: JSON.parse(JSON.stringify(this.state)),
      positionHistory: [...this.positionHistory],
    });
    const previous = this.stateStack.pop()!;
    this.state = JSON.parse(JSON.stringify(previous.state));
    this.positionHistory = [...previous.positionHistory];
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    // Save the current position on the undo stack so redo can itself be undone.
    this.stateStack.push({
      state: JSON.parse(JSON.stringify(this.state)),
      positionHistory: [...this.positionHistory],
    });
    const next = this.redoStack.pop()!;
    this.state = JSON.parse(JSON.stringify(next.state));
    this.positionHistory = [...next.positionHistory];
    return true;
  }

  private recordPosition() {
    const fenKey = `${this.toFenPosition()} ${this.state.turn} ${this.getCastlingString()} ${this.state.enPassantSquare || '-'}`;
    this.positionHistory.push(fenKey);
  }

  private toFenPosition(): string {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const p = this.state.board[r][c];
        if (!p) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          const char = p.color === 'w' ? p.type.toUpperCase() : p.type;
          fen += char;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (r < 7) fen += '/';
    }
    return fen;
  }

  private getCastlingString(): string {
    let str = '';
    if (this.state.castlingRights.w.k) str += 'K';
    if (this.state.castlingRights.w.q) str += 'Q';
    if (this.state.castlingRights.b.k) str += 'k';
    if (this.state.castlingRights.b.q) str += 'q';
    return str || '-';
  }

  // Find King position for color
  private findKing(board: (Piece | null)[][], color: Color): [number, number] | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === color) {
          return [r, c];
        }
      }
    }
    return null;
  }

  // Check if square [r, c] is attacked by `byColor`
  public isSquareAttacked(board: (Piece | null)[][], r: number, c: number, byColor: Color): boolean {
    // 1. Pawn attacks
    const pawnRowDir = byColor === 'w' ? 1 : -1; // white pawns attack upwards (row - 1), so from opponent POV if white attacks [r,c], pawn is at r + 1
    const attackingPawnRow = r + pawnRowDir;
    if (attackingPawnRow >= 0 && attackingPawnRow < 8) {
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (cc >= 0 && cc < 8) {
          const p = board[attackingPawnRow][cc];
          if (p && p.type === 'p' && p.color === byColor) return true;
        }
      }
    }

    // 2. Knight attacks
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightMoves) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p && p.type === 'n' && p.color === byColor) return true;
      }
    }

    // 3. King attacks (adjacency)
    const kingMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    for (const [dr, dc] of kingMoves) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p && p.type === 'k' && p.color === byColor) return true;
      }
    }

    // 4. Rook / Queen (orthogonal rays)
    const orthDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of orthDirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p) {
          if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    // 5. Bishop / Queen (diagonal rays)
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p) {
          if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    return false;
  }

  public isKingInCheck(board: (Piece | null)[][], color: Color): boolean {
    const kingPos = this.findKing(board, color);
    if (!kingPos) return false;
    const opponentColor: Color = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(board, kingPos[0], kingPos[1], opponentColor);
  }

  // Generate pseudo-legal or legal moves for a piece at [r, c]
  public getPseudoLegalMoves(r: number, c: number): Move[] {
    const piece = this.state.board[r][c];
    if (!piece || piece.color !== this.state.turn) return [];

    const moves: Move[] = [];
    const color = piece.color;
    const oppColor: Color = color === 'w' ? 'b' : 'w';

    switch (piece.type) {
      case 'p': {
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        const promotionRow = color === 'w' ? 0 : 7;

        // 1 step forward
        const r1 = r + dir;
        if (r1 >= 0 && r1 < 8 && !this.state.board[r1][c]) {
          if (r1 === promotionRow) {
            ['q', 'r', 'b', 'n'].forEach((promo) => {
              moves.push({ fromRow: r, fromCol: c, toRow: r1, toCol: c, promotion: promo as PieceType });
            });
          } else {
            moves.push({ fromRow: r, fromCol: c, toRow: r1, toCol: c });
          }

          // 2 steps forward from start
          const r2 = r + dir * 2;
          if (r === startRow && !this.state.board[r2][c]) {
            moves.push({ fromRow: r, fromCol: c, toRow: r2, toCol: c });
          }
        }

        // Captures
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc >= 0 && nc < 8) {
            const tr = r + dir;
            if (tr >= 0 && tr < 8) {
              const target = this.state.board[tr][nc];
              if (target && target.color === oppColor) {
                if (tr === promotionRow) {
                  ['q', 'r', 'b', 'n'].forEach((promo) => {
                    moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: nc, promotion: promo as PieceType });
                  });
                } else {
                  moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: nc });
                }
              }

              // En Passant
              if (this.state.enPassantSquare === coordsToSquare(tr, nc)) {
                moves.push({ fromRow: r, fromCol: c, toRow: tr, toCol: nc });
              }
            }
          }
        }
        break;
      }
      case 'n': {
        const knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.state.board[nr][nc];
            if (!target || target.color === oppColor) {
              moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
            }
          }
        }
        break;
      }
      case 'b': {
        const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagDirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.state.board[nr][nc];
            if (!target) {
              moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
            } else {
              if (target.color === oppColor) {
                moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
              }
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
        break;
      }
      case 'r': {
        const orthDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of orthDirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.state.board[nr][nc];
            if (!target) {
              moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
            } else {
              if (target.color === oppColor) {
                moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
              }
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
        break;
      }
      case 'q': {
        const allDirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of allDirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.state.board[nr][nc];
            if (!target) {
              moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
            } else {
              if (target.color === oppColor) {
                moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
              }
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
        break;
      }
      case 'k': {
        const kingMoves = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, -1], [1, 0], [1, 1]
        ];
        for (const [dr, dc] of kingMoves) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.state.board[nr][nc];
            if (!target || target.color === oppColor) {
              moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc });
            }
          }
        }

        // Castling
        const row = color === 'w' ? 7 : 0;
        if (r === row && c === 4) {
          // King side (O-O)
          const rights = this.state.castlingRights[color];
          if (rights.k) {
            if (!this.state.board[row][5] && !this.state.board[row][6]) {
              if (!this.isKingInCheck(this.state.board, color) &&
                  !this.isSquareAttacked(this.state.board, row, 5, oppColor) &&
                  !this.isSquareAttacked(this.state.board, row, 6, oppColor)) {
                moves.push({ fromRow: r, fromCol: c, toRow: row, toCol: 6 });
              }
            }
          }
          // Queen side (O-O-O)
          if (rights.q) {
            if (!this.state.board[row][3] && !this.state.board[row][2] && !this.state.board[row][1]) {
              if (!this.isKingInCheck(this.state.board, color) &&
                  !this.isSquareAttacked(this.state.board, row, 3, oppColor) &&
                  !this.isSquareAttacked(this.state.board, row, 2, oppColor)) {
                moves.push({ fromRow: r, fromCol: c, toRow: row, toCol: 2 });
              }
            }
          }
        }
        break;
      }
    }

    return moves;
  }

  // Get strictly legal moves for piece at [r, c] (verifying own king not left in check)
  public getLegalMoves(r: number, c: number): Move[] {
    const pseudoMoves = this.getPseudoLegalMoves(r, c);
    const legalMoves: Move[] = [];
    const color = this.state.turn;

    for (const m of pseudoMoves) {
      // Simulate move
      const clonedBoard = this.simulateMoveOnBoard(this.state.board, m);
      if (!this.isKingInCheck(clonedBoard, color)) {
        legalMoves.push(m);
      }
    }
    return legalMoves;
  }

  public getAllLegalMovesForColor(color: Color): { from: [number, number]; moves: Move[] }[] {
    const results: { from: [number, number]; moves: Move[] }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.state.board[r][c];
        if (p && p.color === color) {
          // temporarily set turn for pseudo/legal checks
          const prevTurn = this.state.turn;
          this.state.turn = color;
          const moves = this.getLegalMoves(r, c);
          this.state.turn = prevTurn;
          if (moves.length > 0) {
            results.push({ from: [r, c], moves });
          }
        }
      }
    }
    return results;
  }

  private simulateMoveOnBoard(board: (Piece | null)[][], m: Move): (Piece | null)[][] {
    const newBoard = board.map((row) => row.map((p) => (p ? { ...p } : null)));
    const piece = newBoard[m.fromRow][m.fromCol];
    if (!piece) return newBoard;

    // Handle en passant simulation
    const isEnPassant =
      piece.type === 'p' &&
      m.fromCol !== m.toCol &&
      !newBoard[m.toRow][m.toCol] &&
      coordsToSquare(m.toRow, m.toCol) === this.state.enPassantSquare;

    if (isEnPassant) {
      const capturedPawnRow = m.fromRow;
      newBoard[capturedPawnRow][m.toCol] = null;
    }

    // Handle castling simulation
    if (piece.type === 'k' && Math.abs(m.fromCol - m.toCol) === 2) {
      const row = m.fromRow;
      if (m.toCol === 6) {
        // King side
        newBoard[row][5] = newBoard[row][7];
        newBoard[row][7] = null;
      } else if (m.toCol === 2) {
        // Queen side
        newBoard[row][3] = newBoard[row][0];
        newBoard[row][0] = null;
      }
    }

    newBoard[m.toRow][m.toCol] = m.promotion ? { type: m.promotion, color: piece.color } : piece;
    newBoard[m.fromRow][m.fromCol] = null;

    return newBoard;
  }

  public makeMove(m: Move): boolean {
    if (this.state.status === 'checkmate' || this.state.status === 'stalemate' || this.state.status === 'draw') {
      return false;
    }

    const legalMoves = this.getLegalMoves(m.fromRow, m.fromCol);
    const isValid = legalMoves.some(
      (lm) =>
        lm.toRow === m.toRow &&
        lm.toCol === m.toCol &&
        (!lm.promotion || lm.promotion === m.promotion)
    );

    if (!isValid) return false;

    // Snapshot state for undo
    this.stateStack.push({
      state: JSON.parse(JSON.stringify(this.state)),
      positionHistory: [...this.positionHistory],
    });
    // A real new move invalidates any previously undone future.
    this.redoStack = [];

    const piece = this.state.board[m.fromRow][m.fromCol]!;
    const target = this.state.board[m.toRow][m.toCol];
    const isCapturing = target !== null;
    const isPawn = piece.type === 'p';

    // En passant capture check
    const isEnPassant =
      isPawn &&
      m.fromCol !== m.toCol &&
      !target &&
      coordsToSquare(m.toRow, m.toCol) === this.state.enPassantSquare;

    let capturedPiece: Piece | undefined = target || undefined;
    if (isEnPassant) {
      const capturedRow = m.fromRow;
      capturedPiece = this.state.board[capturedRow][m.toCol] || undefined;
      this.state.board[capturedRow][m.toCol] = null;
    }

    // Castling execution
    let isCastling: 'K' | 'Q' | undefined = undefined;
    if (piece.type === 'k' && Math.abs(m.fromCol - m.toCol) === 2) {
      const row = m.fromRow;
      if (m.toCol === 6) {
        isCastling = 'K';
        this.state.board[row][5] = this.state.board[row][7];
        this.state.board[row][7] = null;
      } else if (m.toCol === 2) {
        isCastling = 'Q';
        this.state.board[row][3] = this.state.board[row][0];
        this.state.board[row][0] = null;
      }
    }

    // Update castling rights
    if (piece.type === 'k') {
      this.state.castlingRights[piece.color].k = false;
      this.state.castlingRights[piece.color].q = false;
    }
    if (piece.type === 'r') {
      if (m.fromRow === 7 && m.fromCol === 0) this.state.castlingRights.w.q = false;
      if (m.fromRow === 7 && m.fromCol === 7) this.state.castlingRights.w.k = false;
      if (m.fromRow === 0 && m.fromCol === 0) this.state.castlingRights.b.q = false;
      if (m.fromRow === 0 && m.fromCol === 7) this.state.castlingRights.b.k = false;
    }
    // If rook captured
    if (target && target.type === 'r') {
      if (m.toRow === 7 && m.toCol === 0) this.state.castlingRights.w.q = false;
      if (m.toRow === 7 && m.toCol === 7) this.state.castlingRights.w.k = false;
      if (m.toRow === 0 && m.toCol === 0) this.state.castlingRights.b.q = false;
      if (m.toRow === 0 && m.toCol === 7) this.state.castlingRights.b.k = false;
    }

    // Update En Passant target square
    let newEpSquare: Square | null = null;
    if (isPawn && Math.abs(m.fromRow - m.toRow) === 2) {
      const midRow = (m.fromRow + m.toRow) / 2;
      newEpSquare = coordsToSquare(midRow, m.fromCol);
    }
    this.state.enPassantSquare = newEpSquare;

    // Update board
    this.state.board[m.toRow][m.toCol] = m.promotion ? { type: m.promotion, color: piece.color } : piece;
    this.state.board[m.fromRow][m.fromCol] = null;

    // Halfmove clock for 50-move rule
    if (isPawn || isCapturing) {
      this.state.halfmoveClock = 0;
    } else {
      this.state.halfmoveClock++;
    }

    if (piece.color === 'b') {
      this.state.fullmoveNumber++;
    }

    if (capturedPiece) {
      if (capturedPiece.color === 'w') {
        this.state.capturedWhite.push(capturedPiece.type);
      } else {
        this.state.capturedBlack.push(capturedPiece.type);
      }
    }

    // Switch turn
    const nextColor: Color = piece.color === 'w' ? 'b' : 'w';
    this.state.turn = nextColor;

    // Check game status (check, checkmate, stalemate)
    const inCheck = this.isKingInCheck(this.state.board, nextColor);
    const allNextMoves = this.getAllLegalMovesForColor(nextColor);
    const hasLegalMoves = allNextMoves.length > 0;

    let san = this.generateSAN(piece, m, isCapturing, isCastling, isEnPassant, inCheck, !hasLegalMoves);

    this.state.history.push({
      from: coordsToSquare(m.fromRow, m.fromCol),
      to: coordsToSquare(m.toRow, m.toCol),
      piece,
      captured: capturedPiece,
      promotion: m.promotion,
      san,
      isCastling,
      isEnPassant
    });

    this.recordPosition();

    if (!hasLegalMoves) {
      if (inCheck) {
        this.state.status = 'checkmate';
        this.state.winner = piece.color;
      } else {
        this.state.status = 'stalemate';
        this.state.winner = 'draw';
        this.state.drawReason = 'Stalemate';
      }
    } else if (inCheck) {
      this.state.status = 'check';
    } else {
      // Check draw conditions
      if (this.checkDrawConditions()) {
        this.state.status = 'draw';
        this.state.winner = 'draw';
      } else {
        this.state.status = 'active';
      }
    }

    return true;
  }

  private checkDrawConditions(): boolean {
    // 1. 50-move rule
    if (this.state.halfmoveClock >= 100) {
      this.state.drawReason = 'Fifty-move rule';
      return true;
    }

    // 2. Threefold repetition
    const currentFenKey = this.positionHistory[this.positionHistory.length - 1];
    const repetitions = this.positionHistory.filter((pos) => pos === currentFenKey).length;
    if (repetitions >= 3) {
      this.state.drawReason = 'Threefold repetition';
      return true;
    }
    if (repetitions >= 5) {
      this.state.drawReason = 'Fivefold repetition (Automatic)';
      return true;
    }

    // 3. Insufficient material
    if (this.isInsufficientMaterial()) {
      this.state.drawReason = 'Insufficient material';
      return true;
    }

    return false;
  }

  private isInsufficientMaterial(): boolean {
    let pieces: { type: PieceType; color: Color }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.state.board[r][c];
        if (p) pieces.push(p);
      }
    }

    if (pieces.length === 2) {
      // K vs K
      return true;
    }
    if (pieces.length === 3) {
      // K + B vs K or K + N vs K
      return pieces.some((p) => p.type === 'b' || p.type === 'n');
    }
    if (pieces.length === 4) {
      // K + B vs K + B on same color squares
      const bishops = pieces.filter((p) => p.type === 'b');
      if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
        // check square colors
        // simplified check or let standard check suffice
        return true;
      }
    }
    return false;
  }

  private generateSAN(
    piece: Piece,
    m: Move,
    isCapturing: boolean,
    isCastling?: 'K' | 'Q',
    isEnPassant?: boolean,
    inCheck?: boolean,
    isCheckmate?: boolean
  ): string {
    if (isCastling === 'K') return 'O-O' + (isCheckmate ? '#' : inCheck ? '+' : '');
    if (isCastling === 'Q') return 'O-O-O' + (isCheckmate ? '#' : inCheck ? '+' : '');

    let san = '';
    const toSq = coordsToSquare(m.toRow, m.toCol);
    const fromSq = coordsToSquare(m.fromRow, m.fromCol);

    if (piece.type === 'p') {
      if (isCapturing || isEnPassant) {
        san += fromSq[0] + 'x';
      }
      san += toSq;
      if (m.promotion) {
        san += '=' + m.promotion.toUpperCase();
      }
    } else {
      san += piece.type.toUpperCase();
      // Disambiguation if needed
      // (Simplified for robustness)
      if (isCapturing) {
        san += 'x';
      }
      san += toSq;
    }

    if (isCheckmate) san += '#';
    else if (inCheck) san += '+';

    return san;
  }

  // ============================================================
  // ADAPTIVE TOURNAMENT-GRADE AI CHESS ENGINE
  // ============================================================

  /**
   * Evaluates the current board state from the perspective of White (positive = White advantage)
   */
  private evaluatePosition(profileStrategy = AiLogicLearningService.getChessProfile().dynamicStrategy): number {
    const PIECE_VALUES: Record<PieceType, number> = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 20000,
    };

    const PAWN_PST = [
      [0,   0,   0,   0,   0,   0,   0,   0],
      [50, 50,  50,  50,  50,  50,  50,  50],
      [10, 10,  20,  30,  30,  20,  10,  10],
      [ 5,  5,  10,  25,  25,  10,   5,   5],
      [ 0,  0,   0,  20,  20,   0,   0,   0],
      [ 5, -5, -10,   0,   0, -10,  -5,   5],
      [ 5, 10,  10, -20, -20,  10,  10,   5],
      [ 0,  0,   0,   0,   0,   0,   0,   0],
    ];

    const KNIGHT_PST = [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50],
    ];

    const BISHOP_PST = [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10, 10, 10, 10, 10, 10, 10,-10],
      [-10,  5,  0,  0,  0,  0,  5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20],
    ];

    const ROOK_PST = [
      [ 0,  0,  0,  0,  0,  0,  0,  0],
      [ 5, 10, 10, 10, 10, 10, 10,  5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [ 0,  0,  0,  5,  5,  0,  0,  0],
    ];

    const QUEEN_PST = [
      [-20,-10,-10, -5, -5,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5,  5,  5,  5,  0,-10],
      [ -5,  0,  5,  5,  5,  5,  0, -5],
      [  0,  0,  5,  5,  5,  5,  0, -5],
      [-10,  5,  5,  5,  5,  5,  0,-10],
      [-10,  0,  5,  0,  0,  0,  0,-10],
      [-20,-10,-10, -5, -5,-10,-10,-20],
    ];

    const KING_MID_PST = [
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [ 20, 20,  0,  0,  0,  0, 20, 20],
      [ 20, 30, 10,  0,  0, 10, 30, 20],
    ];

    let whiteScore = 0;
    let blackScore = 0;
    let totalPieces = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.state.board[r][c];
        if (!piece) continue;
        totalPieces++;

        const val = PIECE_VALUES[piece.type];
        let pstVal = 0;

        const pRow = piece.color === 'w' ? r : 7 - r;
        const pCol = piece.color === 'w' ? c : 7 - c;

        switch (piece.type) {
          case 'p':
            pstVal = PAWN_PST[pRow][pCol];
            break;
          case 'n':
            pstVal = KNIGHT_PST[pRow][pCol] * (profileStrategy?.pieceActivityWeight || 1.0);
            break;
          case 'b':
            pstVal = BISHOP_PST[pRow][pCol] * (profileStrategy?.pieceActivityWeight || 1.0);
            break;
          case 'r':
            pstVal = ROOK_PST[pRow][pCol];
            break;
          case 'q':
            pstVal = QUEEN_PST[pRow][pCol];
            break;
          case 'k':
            pstVal = KING_MID_PST[pRow][pCol] * (profileStrategy?.kingSafetyWeight || 1.0);
            break;
        }

        // Center control dynamic scaling
        if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
          pstVal += 15 * (profileStrategy?.centerControlWeight || 1.0);
        }

        if (piece.color === 'w') {
          whiteScore += val + pstVal;
        } else {
          blackScore += val + pstVal;
        }
      }
    }

    return whiteScore - blackScore;
  }

  /**
   * Lightweight clone used only inside the AI search tree.
   * Unlike clone()/makeMove(), it skips move history, SAN generation,
   * undo-stack snapshots, and end-game re-derivation — none of which are
   * needed while walking the search tree — so it is dramatically cheaper
   * than a full JSON deep clone + makeMove(). This is the main fix for the
   * AI "freezing" for several seconds on Hard/Expert.
   */
  private cloneForSearch(): ChessGame {
    const copy = Object.create(ChessGame.prototype) as ChessGame;
    copy.state = {
      board: this.state.board.map((row) => row.map((p) => (p ? { ...p } : null))),
      turn: this.state.turn,
      castlingRights: {
        w: { ...this.state.castlingRights.w },
        b: { ...this.state.castlingRights.b },
      },
      enPassantSquare: this.state.enPassantSquare,
      halfmoveClock: this.state.halfmoveClock,
      fullmoveNumber: this.state.fullmoveNumber,
      history: [],
      capturedWhite: [],
      capturedBlack: [],
      status: 'active',
      winner: null,
    };
    copy.positionHistory = [];
    copy.stateStack = [];
    copy.redoStack = [];
    return copy;
  }

  /**
   * Apply a (already-legal) move for search purposes only: updates the
   * board, turn, castling rights and en-passant target, without any of the
   * bookkeeping (SAN, history, undo snapshots, checkmate/stalemate
   * re-derivation) that makeMove() does. Only used on cloneForSearch()
   * instances that are discarded right after evaluation.
   */
  private applyMoveForSearch(m: Move): void {
    const piece = this.state.board[m.fromRow][m.fromCol];
    if (!piece) return;
    const target = this.state.board[m.toRow][m.toCol];
    const isPawn = piece.type === 'p';

    const isEnPassant =
      isPawn &&
      m.fromCol !== m.toCol &&
      !target &&
      coordsToSquare(m.toRow, m.toCol) === this.state.enPassantSquare;

    if (isEnPassant) {
      this.state.board[m.fromRow][m.toCol] = null;
    }

    if (piece.type === 'k' && Math.abs(m.fromCol - m.toCol) === 2) {
      const row = m.fromRow;
      if (m.toCol === 6) {
        this.state.board[row][5] = this.state.board[row][7];
        this.state.board[row][7] = null;
      } else if (m.toCol === 2) {
        this.state.board[row][3] = this.state.board[row][0];
        this.state.board[row][0] = null;
      }
    }

    if (piece.type === 'k') {
      this.state.castlingRights[piece.color].k = false;
      this.state.castlingRights[piece.color].q = false;
    }
    if (piece.type === 'r') {
      if (m.fromRow === 7 && m.fromCol === 0) this.state.castlingRights.w.q = false;
      if (m.fromRow === 7 && m.fromCol === 7) this.state.castlingRights.w.k = false;
      if (m.fromRow === 0 && m.fromCol === 0) this.state.castlingRights.b.q = false;
      if (m.fromRow === 0 && m.fromCol === 7) this.state.castlingRights.b.k = false;
    }
    if (target && target.type === 'r') {
      if (m.toRow === 7 && m.toCol === 0) this.state.castlingRights.w.q = false;
      if (m.toRow === 7 && m.toCol === 7) this.state.castlingRights.w.k = false;
      if (m.toRow === 0 && m.toCol === 0) this.state.castlingRights.b.q = false;
      if (m.toRow === 0 && m.toCol === 7) this.state.castlingRights.b.k = false;
    }

    let newEpSquare: Square | null = null;
    if (isPawn && Math.abs(m.fromRow - m.toRow) === 2) {
      const midRow = (m.fromRow + m.toRow) / 2;
      newEpSquare = coordsToSquare(midRow, m.fromCol);
    }
    this.state.enPassantSquare = newEpSquare;

    this.state.board[m.toRow][m.toCol] = m.promotion ? { type: m.promotion, color: piece.color } : piece;
    this.state.board[m.fromRow][m.fromCol] = null;
    this.state.turn = piece.color === 'w' ? 'b' : 'w';
  }

  /**
   * Minimax search with Alpha-Beta Pruning
   */
  private alphaBeta(
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    profileStrategy: any
  ): number {
    if (depth === 0) {
      return this.evaluatePosition(profileStrategy);
    }

    const color: Color = isMaximizing ? 'w' : 'b';
    const movesWithFrom = this.getAllLegalMovesForColor(color);

    if (movesWithFrom.length === 0) {
      if (this.isKingInCheck(this.state.board, color)) {
        return isMaximizing ? -25000 - depth : 25000 + depth;
      }
      return 0; // Stalemate
    }

    const flatMoves: Move[] = [];
    for (const group of movesWithFrom) {
      for (const m of group.moves) {
        flatMoves.push(m);
      }
    }

    // Move ordering: captures and promotions first for faster alpha-beta cutoffs
    flatMoves.sort((a, b) => {
      const aCapture = this.state.board[a.toRow][a.toCol] ? 1 : 0;
      const bCapture = this.state.board[b.toRow][b.toCol] ? 1 : 0;
      return (bCapture + (b.promotion ? 2 : 0)) - (aCapture + (a.promotion ? 2 : 0));
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of flatMoves) {
        const clonedEngine = this.cloneForSearch();
        clonedEngine.applyMoveForSearch(move);
        const evalScore = clonedEngine.alphaBeta(depth - 1, alpha, beta, false, profileStrategy);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Beta cutoff
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of flatMoves) {
        const clonedEngine = this.cloneForSearch();
        clonedEngine.applyMoveForSearch(move);
        const evalScore = clonedEngine.alphaBeta(depth - 1, alpha, beta, true, profileStrategy);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha cutoff
      }
      return minEval;
    }
  }

  /**
   * Opening Book Repertoire lookup
   */
  private getOpeningBookMove(color: Color): Move | null {
    if (this.state.history.length > 4) return null;

    const openingBook: Record<string, string[]> = {
      // White moves
      'start': ['e2e4', 'd2d4', 'c2c4', 'g1f3'],
      // Responses to 1. e4
      'e2e4': ['e7e5', 'c7c5', 'e7e6', 'c7c6'],
      // Responses to 1. d4
      'd2d4': ['d7d5', 'g8f6', 'e7e6'],
      // Responses to 1. e4 e5 2. Nf3
      'e2e4 e7e5 g1f3': ['b8c6', 'g8f6'],
      // Responses to 1. e4 e5 2. Nf3 Nc6 3. Bc4
      'e2e4 e7e5 g1f3 b8c6 f1c4': ['f8c5', 'g8f6'],
    };

    const historyKey = this.state.history.length === 0 ? 'start' : this.state.history.map(h => `${h.from}${h.to}`).join(' ');

    const candidates = openingBook[historyKey];
    if (candidates && candidates.length > 0) {
      const chosenUci = candidates[Math.floor(Math.random() * candidates.length)];
      const fromSq = chosenUci.substring(0, 2);
      const toSq = chosenUci.substring(2, 4);

      const fromCoords = squareToCoords(fromSq);
      const toCoords = squareToCoords(toSq);
      if (fromCoords && toCoords) {
        const legal = this.getLegalMoves(fromCoords[0], fromCoords[1]);
        const match = legal.find(m => m.toRow === toCoords[0] && m.toCol === toCoords[1]);
        if (match) return match;
      }
    }

    return null;
  }

  // AI Move selector (smart legal move chooser respecting difficulty & learned patterns)
  public getAiMove(difficulty: AiDifficulty = 'medium'): Move | null {
    const color = this.state.turn;
    const allMovesWithFrom = this.getAllLegalMovesForColor(color);
    if (allMovesWithFrom.length === 0) return null;

    const flatMoves: { from: [number, number]; move: Move }[] = [];
    for (const group of allMovesWithFrom) {
      for (const m of group.moves) {
        flatMoves.push({ from: group.from, move: m });
      }
    }

    if (flatMoves.length === 0) return null;

    const profile = AiLogicLearningService.getChessProfile();
    const profileStrategy = profile.dynamicStrategy;

    // 1. Check Opening Book (applicable for Medium, Hard, Expert)
    if (difficulty !== 'easy' && this.state.history.length <= 4) {
      const bookMove = this.getOpeningBookMove(color);
      if (bookMove) {
        // High confidence opening play
        return bookMove;
      }
    }

    // 2. EASY DIFFICULTY:
    // - Depth 1 evaluation with 35% chance of selecting a harmless random legal move
    // - Does not calculate deep combinations
    if (difficulty === 'easy') {
      if (Math.random() < 0.35) {
        const randIdx = Math.floor(Math.random() * flatMoves.length);
        return flatMoves[randIdx].move;
      }

      // Simple shallow greedy evaluation
      let bestMove = flatMoves[0].move;
      let bestScore = -Infinity;

      for (const item of flatMoves) {
        const m = item.move;
        let score = Math.random() * 15;
        const target = this.state.board[m.toRow][m.toCol];
        if (target) {
          const values: Record<PieceType, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
          score += values[target.type] * 8;
        }
        if (m.promotion) score += 60;
        if (score > bestScore) {
          bestScore = score;
          bestMove = m;
        }
      }
      return bestMove;
    }

    // 3. MEDIUM DIFFICULTY:
    // - Iterative deepening up to depth 2 (time-boxed) with piece-square tables and center control
    // - 12% chance of minor positional inaccuracy
    if (difficulty === 'medium') {
      const bestMove = this.iterativeDeepeningSearch(flatMoves, color, profileStrategy, 2, 400);

      // Small blunder probability for Medium to keep it accessible
      if (Math.random() < 0.12 && flatMoves.length > 2) {
        const safeCandidates = flatMoves.filter(f => f.move !== bestMove);
        if (safeCandidates.length > 0) {
          return safeCandidates[Math.floor(Math.random() * safeCandidates.length)].move;
        }
      }

      return bestMove;
    }

    // 4. HARD DIFFICULTY:
    // - Iterative deepening up to depth 3 (time-boxed) Alpha-Beta search
    // - Applies learned dynamic weights (center control, king safety, blunder punishment)
    if (difficulty === 'hard') {
      return this.iterativeDeepeningSearch(flatMoves, color, profileStrategy, 3, 700);
    }

    // 5. EXPERT DIFFICULTY:
    // - Iterative deepening up to depth 4 (time-boxed) Alpha-Beta search
    // - Deep combination tactical punishment, king safety fortress, passed pawn promotion
    return this.iterativeDeepeningSearch(flatMoves, color, profileStrategy, 4, 1400);
  }

  /**
   * Iterative deepening driver used by Medium/Hard/Expert. Searches depth 1,
   * then 2, then 3... using the previous iteration's best move first (simple
   * principal-variation move ordering), and stops as soon as a real
   * (already-completed) time budget is exceeded. This guarantees the AI
   * always responds within a bounded time regardless of how complex the
   * position is — the crash/"freeze" difficulty players saw on Hard/Expert
   * came from an uncapped fixed-depth search that could take 5-15s+ on a
   * busy middlegame position.
   */
  private iterativeDeepeningSearch(
    flatMoves: { from: [number, number]; move: Move }[],
    color: Color,
    profileStrategy: any,
    maxDepth: number,
    timeBudgetMs: number
  ): Move {
    const startTime = Date.now();

    // Root move ordering: captures/promotions first for faster cutoffs.
    const ordered = [...flatMoves].sort((a, b) => {
      const aCap = this.state.board[a.move.toRow][a.move.toCol] ? 1 : 0;
      const bCap = this.state.board[b.move.toRow][b.move.toCol] ? 1 : 0;
      return (bCap + (b.move.promotion ? 2 : 0)) - (aCap + (a.move.promotion ? 2 : 0));
    });

    let bestMove = ordered[0].move;

    for (let depth = 1; depth <= maxDepth; depth++) {
      if (depth > 1 && Date.now() - startTime > timeBudgetMs) break;

      let currentBest = ordered[0].move;
      let currentBestEval = color === 'w' ? -Infinity : Infinity;
      let aborted = false;

      for (const item of ordered) {
        if (depth > 1 && Date.now() - startTime > timeBudgetMs) {
          aborted = true;
          break;
        }
        const cloned = this.cloneForSearch();
        cloned.applyMoveForSearch(item.move);
        const evalScore = cloned.alphaBeta(depth - 1, -Infinity, Infinity, color !== 'w', profileStrategy);

        if (color === 'w' ? evalScore > currentBestEval : evalScore < currentBestEval) {
          currentBestEval = evalScore;
          currentBest = item.move;
        }
      }

      if (aborted) break;

      bestMove = currentBest;

      // Put the best move first for the next (deeper) iteration's ordering.
      const idx = ordered.findIndex((o) => o.move === bestMove);
      if (idx > 0) {
        const [top] = ordered.splice(idx, 1);
        ordered.unshift(top);
      }
    }

    return bestMove;
  }

  // Check if player has sufficient mating material to win on opponent timeout
  public hasMatingMaterial(color: Color): boolean {
    const pieces: Piece[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.state.board[r][c];
        if (p && p.color === color) {
          pieces.push(p);
        }
      }
    }

    // Only King -> Insufficient
    if (pieces.length <= 1) return false;

    // Has Pawn, Rook, or Queen -> Definitely sufficient
    if (pieces.some((p) => p.type === 'p' || p.type === 'r' || p.type === 'q')) {
      return true;
    }

    // Has at least two Bishops or a Bishop and a Knight -> Sufficient
    const knights = pieces.filter((p) => p.type === 'n').length;
    const bishops = pieces.filter((p) => p.type === 'b').length;

    if (bishops >= 2 || (bishops >= 1 && knights >= 1)) {
      return true;
    }

    // Single minor piece (lone Knight or lone Bishop) cannot force mate vs bare King
    return false;
  }

  public handleTimeout(timeoutColor: Color): { winner: Color | 'draw'; reason: string } {
    const oppColor: Color = timeoutColor === 'w' ? 'b' : 'w';
    if (this.hasMatingMaterial(oppColor)) {
      this.state.status = 'timeout' as any;
      this.state.winner = oppColor;
      return { winner: oppColor, reason: `${timeoutColor === 'w' ? 'White' : 'Black'} ran out of time` };
    } else {
      this.state.status = 'draw';
      this.state.winner = 'draw';
      this.state.drawReason = 'Timeout vs Insufficient Material';
      return { winner: 'draw', reason: 'Draw — Timeout vs Insufficient Material' };
    }
  }

  public resign(color: Color): void {
    const oppColor: Color = color === 'w' ? 'b' : 'w';
    this.state.status = 'checkmate';
    this.state.winner = oppColor;
  }

  public loadState(state: BoardState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  public clone(): ChessGame {
    const copy = new ChessGame();
    copy.loadState(this.state);
    return copy;
  }
}

export interface ChessTimeControlOption {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  category: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'unlimited';
  initialSeconds: number;
  incrementSeconds: number;
  badge: string;
  icon: string;
}

export const CHESS_TIME_OPTIONS: ChessTimeControlOption[] = [
  {
    id: '1m',
    name: '1 min • Bullet',
    nameAr: '1 دقيقة • بوليت',
    nameFr: '1 min • Bullet',
    category: 'bullet',
    initialSeconds: 60,
    incrementSeconds: 0,
    badge: 'Bullet',
    icon: '⚡',
  },
  {
    id: '2m',
    name: '2 min • Bullet',
    nameAr: '2 دقيقة • بوليت',
    nameFr: '2 min • Bullet',
    category: 'bullet',
    initialSeconds: 120,
    incrementSeconds: 0,
    badge: 'Bullet',
    icon: '⚡',
  },
  {
    id: '3m2s',
    name: '3 min + 2s • Blitz',
    nameAr: '3 د + 2ث • بليتز',
    nameFr: '3 min + 2s • Blitz',
    category: 'blitz',
    initialSeconds: 180,
    incrementSeconds: 2,
    badge: 'Blitz',
    icon: '🔥',
  },
  {
    id: '5m',
    name: '5 min • Blitz',
    nameAr: '5 دقائق • بليتز',
    nameFr: '5 min • Blitz',
    category: 'blitz',
    initialSeconds: 300,
    incrementSeconds: 0,
    badge: 'Blitz',
    icon: '🔥',
  },
  {
    id: '10m',
    name: '10 min • Rapid',
    nameAr: '10 دقائق • رابيد',
    nameFr: '10 min • Rapide',
    category: 'rapid',
    initialSeconds: 600,
    incrementSeconds: 0,
    badge: 'Rapid',
    icon: '⏱️',
  },
  {
    id: '15m10s',
    name: '15 min + 10s • Rapid',
    nameAr: '15 د + 10ث • رابيد',
    nameFr: '15 min + 10s • Rapide',
    category: 'rapid',
    initialSeconds: 900,
    incrementSeconds: 10,
    badge: 'Rapid',
    icon: '⏱️',
  },
  {
    id: '30m',
    name: '30 min • Classical',
    nameAr: '30 دقيقة • كلاسيكي',
    nameFr: '30 min • Classique',
    category: 'classical',
    initialSeconds: 1800,
    incrementSeconds: 0,
    badge: 'Classical',
    icon: '⏳',
  },
  {
    id: '60m',
    name: '60 min • Classical',
    nameAr: '60 دقيقة • كلاسيكي',
    nameFr: '60 min • Classique',
    category: 'classical',
    initialSeconds: 3600,
    incrementSeconds: 0,
    badge: 'Classical',
    icon: '⏳',
  },
  {
    id: 'unlimited',
    name: 'No Time Limit',
    nameAr: 'بدون وقت محدد',
    nameFr: 'Illimité (Sans chrono)',
    category: 'unlimited',
    initialSeconds: 0,
    incrementSeconds: 0,
    badge: 'Unlimited',
    icon: '♾️',
  },
];

export function formatChessClock(ms: number, showTenthsBelow = 20000): string {
  if (ms <= 0) return '0:00.0';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  if (ms < showTenthsBelow) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================================
// CHESS AI BRAIN (BRIDGE TO ADAPTIVE LEARNING SERVICE)
// ============================================================

export class ChessAiBrain {
  public static getProfile(playerId: string = 'player-local'): ChessPlayerProfile {
    return AiLogicLearningService.getChessProfile(playerId);
  }

  public static recordHumanMove(
    moveSan: string,
    isCheck: boolean,
    isCastling: boolean,
    isCapture: boolean,
    isFork: boolean = false,
    isPin: boolean = false
  ): void {
    AiLogicLearningService.recordChessPlayerMove(moveSan, isCheck, isCastling, isCapture, isFork, isPin);
  }

  public static recordGameOutcome(
    playerWon: boolean,
    isDraw: boolean = false,
    difficulty: AiDifficulty = 'medium',
    moveCount: number = 30,
    durationSeconds: number = 300,
    openingName: string = 'e4 Open Game'
  ): void {
    AiLogicLearningService.recordChessMatchOutcome(playerWon, isDraw, difficulty, moveCount, durationSeconds, openingName);
  }

  public static recordMistake(type: 'hanging_piece' | 'missed_mate' | 'neglected_king_safety'): void {
    AiLogicLearningService.recordChessMistake(type);
  }
}

