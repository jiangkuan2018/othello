import { 
  BLACK, WHITE, SIZE,
  initBoard, checkStone, 
  renderBoard, getAllAllowPut,
} from './othello.js'

function sleep(ms = 500) {
  return new Promise((ok, no) => {
    setTimeout(ok, ms)
  })
}

/**
 * @param {HTMLDivElement} dom 
 * @param {number[]} boardData 
 * @param {number} turn
 * @returns {Promise<{poss: number[], nextTurn: number}>}
 */
function waitPutStone(dom, boardData, turn) {
  return new Promise((resolve, reject) => {
    const handler = ({ target }) => {
      const x = Number(target.dataset.x)
      const y = Number(target.dataset.y)
      const idx = Number(target.dataset.idx)
      /** @type {number[]} */ // @ts-ignore
      const allowPut = checkStone(boardData, turn, x, y)
      // 当前位置有没有可以改变的棋子
      if (allowPut && allowPut.length) {
        boardData[idx] = turn
        for (let i = 0; i < allowPut.length; i++) {
          boardData[allowPut[i]] = turn
        }
        const nextTurn = turn === BLACK ? WHITE : BLACK
        const poss = getAllAllowPut(boardData, nextTurn)
        renderBoard(boardData, nextTurn, poss, dom)
        dom.removeEventListener('click', handler)
        resolve({ poss, nextTurn })
      } else {
        console.log('位置不允许放置棋子')
      }
    }
    dom.addEventListener('click', handler)
  })
}

async function pvp() {
  /** @type {HTMLDivElement} */ // @ts-ignore
  const boardDom = document.querySelector('#board')
  let turn = BLACK
  const boardData = initBoard(boardDom, turn)
  while (true) {
    const { poss, nextTurn } = await waitPutStone(boardDom, boardData, turn)
    if (poss.length) {
      turn = nextTurn
    } else {
      const res = boardData.filter(v => v === BLACK)
      const half = SIZE / 2
      if (res.length > half) {
        console.log('黑棋胜')
      } else if (res.length < half) {
        console.log('白棋胜')
      } else {
        console.log('平局')
      }
      break
    }
  }
}

/**
 * 
 * 
 * 
 * @param {number[]} boardData 
 */
function evaluate(boardData) {
  const p1 = getAllAllowPut(boardData, BLACK)
  const p2 = getAllAllowPut(boardData, WHITE)

  if (p1.length === 0 && p2.length === 0) {
    return (boardData.filter(d => d === BLACK).length - boardData.filter(d => d === WHITE).length) * 10000
  } else {
    const actionForce = p1.length - p2.length
    return actionForce * 10
  }
}

/**
 * 
 * @param {number[]} data 
 * @param {number} turn 
 * @param {number} depth 
 * @param {number} maxDepth 
 * @param {number | null} ab 
 * @returns {number}
 */
function search(data, turn, depth, maxDepth, ab = null) {
  /**
   * 第一轮 turn=2 deep=0
   * 第二轮 turn=1 deep=1
   * 第三轮 turn=2 deep=2
   */
  const poss = getAllAllowPut(data, turn) // AI回合所有可能的落子点
  /**
   * AI=false
   * 玩家=true
   * depth为偶数时表示AI回合 计算的最优落子点，isSearchMax=false
   * depth为奇数时表示玩家回合 计算最差落子点，最差的落子点意味着是AI的最有利的情况
   * 循环maxDepth次之后（maxDepth始终为偶数），找到的位置，会是最有利的落子点（自己最有利，对手最差）
   */
  const isSearchMax = !!(depth % 2) // 奇数层找最大值
  let v = isSearchMax ? -Infinity : Infinity // 返回的默认值
  const opTurn = turn === BLACK ? WHITE : BLACK
  
  if (poss.length <= 0) { // 本轮计算没有可落子的点
    if (getAllAllowPut(data, opTurn).length <= 0) { // 对手也没有可落子的点
      return evaluate(data) // 返回最终的盘面估值
    } else {
      // 如果对手有可落子的点，那么递归计算对手可落子的最佳位置
      return search(data, opTurn, depth + 1, maxDepth, ab)
    }
  }
  if (depth > maxDepth) {
    return evaluate(data)
  }
  let pidx = -1
  for (let i = 0; i < poss.length; i++) { // 所有的落子点
    const idx = poss[i]
    const x = idx % 8
    const y = Math.floor(idx / 8)
    // 试走
    const aw = checkStone(data, turn, x, y)
    if (aw && aw.length) {
      // 当前位置可以落子的点全部改为自己的值
      data[idx] = turn
      for (let i = 0; i < aw.length; i++) {
        data[aw[i]] = turn
      }
      // 开始计算下回合的落子点情况
      const vv = search(data, opTurn, depth + 1, maxDepth, v)

      // 还原操作开始 ⬇️⬇️⬇️⬇️
      data[idx] = 0
      for (let i = 0; i < aw.length; i++) {
        data[aw[i]] = opTurn
      }
      // 还原操作结束 ⬆️⬆️⬆️⬆️

      if (ab !== null && isSearchMax && vv >= ab) {
        return vv
      }
      if (ab !== null && !isSearchMax && vv <= ab) {
        return vv
      }

      if (isSearchMax) {
        v = Math.max(v, vv)
      } else {
        if (depth === 0 && vv < v) {
          pidx = idx
        }
        v = Math.min(v, vv)
      }
    }
  }
  if (depth === 0) {
    return pidx
  }
  return v
}

async function pve() {
  let round = 0
  let maxDepth = 0
  let step = 0
  /** @type {HTMLDivElement} */ // @ts-ignore
  const boardDom = document.querySelector('#board')
  /** @type {HTMLDivElement} */ // @ts-ignore
  const result = document.querySelector('#result')
  let turn = BLACK
  const boardData = initBoard(boardDom, turn)
  while (round++ < 100) {
    let { poss } = await waitPutStone(boardDom, boardData, turn) // 玩家
    let nextPoss
    step++
    while (poss.length) { // AI
      result.innerHTML = 'AI turn'
      await sleep(500)
      if(step < 40) {
        maxDepth = 4
      } else if(step < 48) {
        maxDepth = 6
      } else if(step < 52) {
        maxDepth = 10
      } else {
        maxDepth = 6
      }
      const idx = search([...boardData], WHITE, 0, maxDepth)
      result.innerHTML = ''
      const x = idx % 8
      const y = Math.floor(idx / 8)
      const aw = checkStone(boardData, WHITE, x, y)
      if (aw && aw.length) {
        boardData[idx] = WHITE
        for (let i = 0; i < aw.length; i++) {
          boardData[aw[i]] = WHITE
        }
        nextPoss = getAllAllowPut(boardData, BLACK)
      }
      step++
      if (nextPoss && nextPoss.length) { // 玩家有落子的空间
        break
      } else {
        poss = getAllAllowPut(boardData, WHITE) // 玩家没有落子空间AI继续
      }
      renderBoard(boardData, WHITE, [], boardDom)
    }
    poss = nextPoss || getAllAllowPut(boardData, BLACK)
    renderBoard(boardData, BLACK, poss, boardDom)
  }
}

pve()