function randomizeList (list) {
  const picker = list.slice()
  const result = []
  while (picker.length) {
    const i = Math.floor(Math.random() * picker.length)
    const e = picker.splice(i, 1)[0]
    result.push(e)
  }
  return result
}

// vn = Von Neumann, as in Von Neumann neighborhood
function vnAdjacencies ([y, x], matrix) {
  const result = []
  for (const i of [1, 0, -1]) {
    for (const j of [1, 0, -1]) {
      if (i || j) {
        const yy = y + i
        const xx = x + j
        if (
          yy >= 0 && xx >= 0 &&
          yy < matrix.length &&
          xx < matrix[yy].length
        ) {
          result.push(matrix[yy][xx])
        }
      }
    }
  }
  return result
}
function randomQuadrant () {
  return ['<3 ', '<3<', '<> '][Math.floor(Math.random() * 3)]
}

/**
 *
 * @param {string[]} names - list of people who are part of the polycule
 * @param {number} extraChance - chance each extra edge on the diagram will be added after a spanning tree is created
 * @returns {object} - {grid: str[][], adjacencies: mapobject<str, str[]>, edges: [str, str][], positions: mapobject<str, [int, int]>}
 */
function polycule (names, extraChance = 0.35) {
  names = randomizeList(names)

  // We want to be able to draw a layout of this
  // So instead of generating a random adjacency matrix we draw a layout first
  // and then pick random vnAdjacencies from edges which are possible to draw

  // We lay out our vertices inside a square-ish matrix because that sounds about right to me
  const size = Math.ceil(Math.sqrt(names.length))
  const grid = []
  let j = 0 // have to declare j outside so that i loop can access it for condition
  const pos = {}
  for (let i = -1; i * size + j < names.length;) {
    i++
    const row = []
    grid.push(row)
    for (j = 0; i * size + j < names.length && j < size; j++) {
      const name = names[i * size + j]
      row.push(name)
      pos[name] = [i, j]
    }
  }

  // didn't bother trying to make this fast because why would you want a randomly generated 1024-polycule
  const edges = []
  const adj = {}
  names.forEach((n) => { adj[n] = [] })
  const namePicker = randomizeList(names)
  // why yes i AM very proud of this variable name thank you for asking
  const sittingInATree = [namePicker.pop()]
  while (namePicker.length) {
    const name = namePicker.pop()
    const candidates = vnAdjacencies(pos[name], grid)
      .filter(n => sittingInATree.indexOf(n) >= 0)
    if (!candidates.length) {
      namePicker.unshift(name)
      continue
    }
    const beaux = randomizeList(candidates).pop()
    edges.push([name, beaux])
    adj[name].push(beaux)
    adj[beaux].push(name)
    sittingInATree.push(name)
  }

  // halfChance is the solution to the equation 1 - (1 - hC) * (1 - hC) = eF
  // by using it in place of extraChance and double-counting vnAdjacencies
  // we end up as if we didn't do either of those things
  const halfChance = (2 - Math.sqrt(4 - 4 * extraChance)) / 2
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const candidates = vnAdjacencies(pos[name], grid)
      .filter(n => adj[name].indexOf(n) === -1)
    for (const beaux of candidates) {
      if (Math.random() < halfChance) {
        edges.push([name, beaux])
        adj[name].push(beaux)
        adj[beaux].push(name)
      }
    }
  }

  return {
    grid, positions: pos, adjacencies: adj, edges
  }
}

/**
 *
 * @param {string[][]} grid
 * @param {mapobject<string, str[]>} adjacencies
 * @param {boolean} homestuck - whether to use quadrants
 * @returns {string}
 */
function renderGridGraph ({ grid, adjacencies }, homestuck = true) {
  const result = []
  const adj = adjacencies
  for (let i = 0; i < grid.length; i++) {
    const inRow = grid[i]
    const outRow = []
    result.push(outRow)

    // add horizontal edges
    for (let j = 0; j < inRow.length; j++) {
      const name = inRow[j]
      outRow.push(name)
      if (inRow[j + 1]) {
        if (adj[name].indexOf(inRow[j + 1]) >= 0) {
          if (homestuck) outRow.push(`-${randomQuadrant()}-`)
          else outRow.push('-----')
        } else {
          outRow.push('     ')
        }
      }
    }

    // add diagonal and vertical edges
    if (grid[i + 1]) {
      const or1 = []
      const or2 = []
      const or3 = []
      result.push(or1, or2, or3)
      for (let j = 0; j < inRow.length; j++) {
        // get each cell directly below and to the right of grid[i][j]
        const cName = grid[i][j] // center
        const eName = grid[i][j + 1] // east
        const sName = grid[i + 1][j] // south
        const seName = grid[i + 1][j + 1] // southeast

        // add vertical edges
        let s; let
          s1
        if (adj[cName].indexOf(sName) >= 0) s = '  |  '
        else s = '     '
        if (adj[cName].indexOf(sName) >= 0 && homestuck) s1 = ` ${randomQuadrant()} `
        else s1 = s
        or1.push(s)
        or2.push(s1)
        or3.push(s)

        // add diagonal edges
        if (eName) {
          let diagonal = false // \
          let crosswise = false // /

          if (seName) {
            diagonal = adj[cName].indexOf(seName) >= 0
          }
          if (eName) {
            crosswise = adj[eName].indexOf(sName) >= 0
          }

          const fs = crosswise ? '/' : ' '
          const fs_ = crosswise ? '_' : ' '
          const bs = diagonal ? '\\' : ' '
          const bs_ = diagonal ? '_' : ' '
          const ex = diagonal
            ? crosswise ? 'X' : '\\'
            : crosswise ? '/' : ' '
          let top; let
            middle
          if (homestuck) {
            top = `${bs}   ${fs}`
            middle = (crosswise || diagonal) ? ` ${randomQuadrant()} ` : '   '
          } else {
            top = `${bs}${bs_} ${fs_}${fs}`
            middle = ` ${fs_ + ex + bs_} `
          }
          const bottom = `${fs}   ${bs}`
          or1.push(top)
          or2.push(middle)
          or3.push(bottom)
        }
      }
    }
  }

  // pad each column to the same length
  for (let j = 0; j < result[0].length; j++) {
    const column = []
    for (let i = 0; i < result.length; i++) {
      if (result[i][j]) column.push(result[i][j])
    }
    const w = column.reduce((a, b) => Math.max(a, b.length), 0)
    for (let i = 0; i < column.length; i++) {
      let s = column[i]
      const pad = w - s.length
      const lpad = ' '.repeat(Math.floor(pad / 2))
      const rpad = ' '.repeat(Math.ceil(pad / 2))
      s = lpad + s + rpad
      result[i][j] = s
    }
  }

  // add [] around each name
  for (let j = 0; j < result[0].length; j += 2) {
    for (let i = 0; i < result.length; i++) {
      const item = result[i][j]
      if (item) {
        if (!(i % 4)) result[i][j] = `[${item}]`
        else result[i][j] = ` ${item} `
      }
    }
  }

  return result.map(r => r.join('')).join('\n')
}

function test () {
  console.log(renderGridGraph(polycule([
    'Foo Bar', '2 Foo 2 Bar', 'Foo Bar: Xyzzy', 'Foobar', 'Bar Five', 'Foo 6', 'Foo 7', 'Foo Baz'
  ])))
}

module.exports = {
  polycule,
  renderGridGraph,
  test
}
