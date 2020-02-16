function randomizeList (list) {
  let picker = list.slice()
  let result = []
  while (picker.length) {
    let i = Math.floor(Math.random() * picker.length)
    let e = picker.splice(i, 1)[0]
    result.push(e)
  }
  return result
}

// vn = Von Neumann, as in Von Neumann neighborhood
function vnAdjacencies ([y, x], matrix) {
  let result = []
  for (let i of [1, 0, -1]) {
    for (let j of [1, 0, -1]) {
      if (i || j) {
        let yy = y + i
        let xx = x + j
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
  let size = Math.ceil(Math.sqrt(names.length))
  let grid = []
  let j = 0 // have to declare j outside so that i loop can access it for condition
  let pos = {}
  for (let i = -1; i * size + j < names.length;) {
    i++
    let row = []
    grid.push(row)
    for (j = 0; i * size + j < names.length && j < size; j++) {
      let name = names[i * size + j]
      row.push(name)
      pos[name] = [i, j]
    }
  }

  // didn't bother trying to make this fast because why would you want a randomly generated 1024-polycule
  let edges = []
  let adj = {}
  names.forEach(n => { adj[n] = [] })
  let namePicker = randomizeList(names)
  // why yes i AM very proud of this variable name thank you for asking
  let sittingInATree = [namePicker.pop()]
  while (namePicker.length) {
    let name = namePicker.pop()
    let candidates = vnAdjacencies(pos[name], grid)
      .filter(n => sittingInATree.indexOf(n) >= 0)
    if (!candidates.length) {
      namePicker.unshift(name)
      continue
    }
    let beaux = randomizeList(candidates).pop()
    edges.push([name, beaux])
    adj[name].push(beaux)
    adj[beaux].push(name)
    sittingInATree.push(name)
  }

  // halfChance is the solution to the equation 1 - (1 - hC) * (1 - hC) = eF
  // by using it in place of extraChance and double-counting vnAdjacencies
  // we end up as if we didn't do either of those things
  let halfChance = (2 - Math.sqrt(4 - 4 * extraChance)) / 2
  for (let i = 0; i < names.length; i++) {
    let name = names[i]
    let candidates = vnAdjacencies(pos[name], grid)
      .filter(n => adj[name].indexOf(n) === -1)
    for (let beaux of candidates) {
      if (Math.random() < halfChance) {
        edges.push([name, beaux])
        adj[name].push(beaux)
        adj[beaux].push(name)
      }
    }
  }

  return { grid, positions: pos, adjacencies: adj, edges }
}

/**
 *
 * @param {string[][]} grid
 * @param {mapobject<string, str[]>} adjacencies
 * @param {boolean} homestuck - whether to use quadrants
 * @returns {string}
 */
function renderGridGraph ({ grid, adjacencies }, homestuck = true) {
  let result = []
  let adj = adjacencies
  for (let i = 0; i < grid.length; i++) {
    let inRow = grid[i]
    let outRow = []
    result.push(outRow)

    // add horizontal edges
    for (let j = 0; j < inRow.length; j++) {
      let name = inRow[j]
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
      let or1 = []
      let or2 = []
      let or3 = []
      result.push(or1, or2, or3)
      for (let j = 0; j < inRow.length; j++) {
        // get each cell directly below and to the right of grid[i][j]
        let cName = grid[i][j] // center
        let eName = grid[i][j + 1] // east
        let sName = grid[i + 1][j] // south
        let seName = grid[i + 1][j + 1] // southeast

        // add vertical edges
        let s, s1
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

          let fs = crosswise ? '/' : ' '
          let fs_ = crosswise ? '_' : ' '
          let bs = diagonal ? '\\' : ' '
          let bs_ = diagonal ? '_' : ' '
          let ex = diagonal
            ? crosswise ? 'X' : '\\'
            : crosswise ? '/' : ' '
          let top, middle, bottom
          if (homestuck) {
            top = `${bs}   ${fs}`
            middle = (crosswise || diagonal) ? ` ${randomQuadrant()} ` : `   `
          } else {
            top = `${bs}${bs_} ${fs_}${fs}`
            middle = ` ${fs_ + ex + bs_} `
          }
          bottom = `${fs}   ${bs}`
          or1.push(top)
          or2.push(middle)
          or3.push(bottom)
        }
      }
    }
  }

  // pad each column to the same length
  for (let j = 0; j < result[0].length; j++) {
    let column = []
    for (let i = 0; i < result.length; i++) {
      if (result[i][j]) column.push(result[i][j])
    }
    let w = column.reduce((a, b) => Math.max(a, b.length), 0)
    for (let i = 0; i < column.length; i++) {
      let s = column[i]
      let pad = w - s.length
      let lpad = ' '.repeat(Math.floor(pad / 2))
      let rpad = ' '.repeat(Math.ceil(pad / 2))
      s = lpad + s + rpad
      result[i][j] = s
    }
  }

  // add [] around each name
  for (let j = 0; j < result[0].length; j += 2) {
    for (let i = 0; i < result.length; i++) {
      let item = result[i][j]
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
