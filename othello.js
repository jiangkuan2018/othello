export const SIZE = 64
export const BLACK = 1
export const WHITE = 2
const EMPTY = 0

/**
 * @description 根据 x y 返回数组的值
 * @param {number[]} data 
 * @param {number} x 
 * @param {number} y 
 * @returns {number}
 */
function getStone(data, x, y) {
  return data[x + 8 * y]
}

/**
 * @description 检查当前位置到 上下左右 左上 坐下 右上 右下 的可修改的棋子，并且返回所有
 * @param {number[]} data 
 * @param {number} turn 
 * @param {number} x 
 * @param {number} y 
 * @returns {false | number[]}
 */
export function checkStone(data, turn, x, y) {
  const stone = getStone(data, x, y)
  if (stone) {
    return false
  }
  const aw = []
  const w = []
  /**
   * 检查当前回合和位置是不是可以落子，如果可以则记录当前的位置（数组下标）
   * @param {number} x 
   * @param {number} y 
   * @returns {boolean | void}
   */
  function check(x, y) {
    // 当前位置的落子
    const ns = getStone(data, x, y)
    if (ns === 0) { // 0 跳过
      return false
    }
    // 如果本回合是黑子下，遇到白子则记录白子的位置
    if ((ns ^ turn) === 3) {
      w.push(x + 8 * y)
    }
    // 如果本回合是盒子下，当前的位置也是黑子，那么检查就结束
    if (ns === turn) {
      aw.push(...w) // 8个方向可以被修改的反色旗子位置
      return false
    }
  }
  w.length = 0 // 向左移动
  for (let i = x - 1; i >= 0; i--) {
    if (check(i, y) === false) {
      break
    }
  }
  
  w.length = 0 // 向右移动
  for (let i = x + 1; i < 8; i++) {
    if (check(i, y) === false) {
      break
    }
  }
  
  w.length = 0 // 向上移动
  for (let i = y - 1; i >= 0; i--) {
    if (check(x, i) === false) {
      break
    }
  }
  w.length = 0 // 向下移动
  for (let i = y + 1; i < 8; i++) {
    if (check(x, i) === false) {
      break
    }
  }

  w.length = 0 // 左上移动
  for (let i = x - 1, j = y - 1; i >= 0 && j >= 0; i--, j--) {
    if (check(i, j) === false) {
      break
    }
  }

  w.length = 0 // 左下移动
  for (let i = x - 1, j = y + 1; i >= 0 && j < 8; i--, j++) {
    if (check(i, j) === false) {
      break
    }
  }

  w.length = 0 // 右上移动
  for (let i = x + 1, j = y - 1; i < 8 && j >=0; i++, j--) {
    if (check(i, j) === false) {
      break
    }
  }

  w.length = 0 // 右下
  for (let i = x + 1, j = y + 1; i < 8 && j < 8; i++, j++) {
    if (check(i, j) === false) {
      break
    }
  }

  return aw
}

/**
 * 渲染棋盘和棋子
 * @param {number[]} data 
 * @param {number} turn 
 * @param {number[]} allowPut 
 * @param {HTMLDivElement} dom 
 */
export function renderBoard(data, turn, allowPut, dom) {
  dom.innerHTML = ''
  for (let i = 0; i < SIZE; i++) {
    const x = i % 8
    const y = Math.floor(i / 8)
    const cell = document.createElement('div')
    Object.assign(cell.dataset, {
      x,
      y,
      idx: i
    })
    if (data[i] === BLACK) {
      cell.classList.add('black')
    } else if (data[i] === WHITE) {
      cell.classList.add('white')
    } else {
      cell.classList.add('empty')
    }
    if (allowPut.includes(i)) {
      cell.dataset.allow = 'yes'
    } else {
      cell.dataset.allow = 'no'
    }
    dom.appendChild(cell)
  }
  dom.dataset.turn = turn === BLACK ? 'black' : 'white'
}

/**
 * @description 获取当前回合所有可以放置棋子的位置
 * @param {number[]} data 
 * @param {number} turn 
 * @returns {number[]}
 */
export function getAllAllowPut(data, turn) {
  const allowPut = []
  for (let i = 0; i < SIZE; i++) {
    const x = i % 8
    const y = Math.floor(i / 8)
    const aw = checkStone(data, turn, x, y)
    if (Array.isArray(aw) && aw.length) {
      allowPut.push(i)
    }
  }
  return allowPut
}

/**
 * 初始化棋盘数据
 * @param {number} size 
 * @returns {number[]}
 */
function initData(size) {
  const data = new Array(size).fill(EMPTY)
  data[27] = WHITE
  data[28] = BLACK
  data[35] = BLACK
  data[36] = WHITE
  return data
}

/**
 * 初始化棋盘
 * @param {HTMLDivElement} dom 
 * @param {number} turn
 */
export function initBoard(dom, turn) {
  const data = initData(SIZE)
  // 黑子先手
  const allowPut = getAllAllowPut(data, turn)
  renderBoard(data, turn, allowPut, dom)
  return data
}
