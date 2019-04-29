import * as Raphael from 'raphael';

/**
 * A 2-dimensional maze generated based on "hunt-and-kill" algorithm.
 */
export class Maze {
  nodeSize = 20;
  rows: number;
  columns: number;
  private maze: Maze;
  private paper: RaphaelPaper;
  private rects: RaphaelElement[][];
  private startNode: RaphaelElement;
  private endNode: RaphaelElement;
  private path: RaphaelElement;
  private coordDirty: boolean[][];
  private blockedNodes: RaphaelElement[][];

  public nodeStyle = {
    normal: {
        fill: 'white',
        'stroke-opacity': 0.2, // the border
    },
    blocked: {
        fill: 'grey',
        'stroke-opacity': 0.2,
    },
    start: {
        fill: '#0d0',
        'stroke-opacity': 0.2,
    },
    end: {
        fill: '#e40',
        'stroke-opacity': 0.2,
    },
    opened: {
        fill: '#98fb98',
        'stroke-opacity': 0.2,
    },
    closed: {
        fill: '#afeeee',
        'stroke-opacity': 0.2,
    },
    failed: {
        fill: '#ff8888',
        'stroke-opacity': 0.2,
    },
    tested: {
        fill: '#e5e5e5',
        'stroke-opacity': 0.2,
    }
  };

  public nodeColorizeEffect = {
    duration: 50,
  };

  supportedOperations = ['opened', 'closed', 'tested'];

  nodeZoomEffect = {
    duration: 200,
    transform: 's1.2', // scale by 1.2x
    transformBack: 's1.0',
  };

  pathStyle = {
    stroke: 'yellow',
    'stroke-width': 3,
  };

  constructor(public nRow: number, public nCol: number) {
    this.columns = nCol;
    this.rows = nRow;
    this.paper = Raphael("draw_area", this.columns * this.nodeSize, this.rows * this.nodeSize);
  }

  drawMaze() {
    this.rects = [];
    this.paper.setSize(this.columns * this.nodeSize, this.rows * this.nodeSize);
    for (let i = 0; i < this.rows; ++i) {
      this.rects[i] = [];
      for (let j = 0; j < this.columns; ++j) {
        let x = j * this.nodeSize;
        let y = i * this.nodeSize;

        let rect = this.paper.rect(x, y, this.nodeSize, this.nodeSize);
        rect.attr(this.nodeStyle.normal);
        this.rects[i].push(rect);
      }  
    }
  }

  setStartPos(gridX: number, gridY: number) {
    var coord = this.toPageCoordinate(gridX, gridY);
    if (!this.startNode) {
        this.startNode = this.paper.rect(
            coord[0],
            coord[1],
            this.nodeSize,
            this.nodeSize
        ).attr(this.nodeStyle.normal)
         .animate(this.nodeStyle.start, 1000);
    } else {
        this.startNode.attr({ x: coord[0], y: coord[1] }).toFront();
    }
  }

  setEndPos(gridX: number, gridY: number) {
      var coord = this.toPageCoordinate(gridX, gridY);
      if (!this.endNode) {
          this.endNode = this.paper.rect(
              coord[0],
              coord[1],
              this.nodeSize,
              this.nodeSize
          ).attr(this.nodeStyle.normal)
          .animate(this.nodeStyle.end, 1000);
      } else {
          this.endNode.attr({ x: coord[0], y: coord[1] }).toFront();
      }
  }

/**
 * Set the attribute of the node at the given coordinate.
 */
setAttributeAt(gridX:number, gridY:number, attr:any, value:any) {
    var color, nodeStyle = this.nodeStyle;
    switch (attr) {
    case 'walkable':
        color = value ? nodeStyle.normal.fill : nodeStyle.blocked.fill;
        this.setWalkableAt(gridX, gridY, value);
        break;
    case 'opened':
        this.colorizeNode(this.rects[gridY][gridX], nodeStyle.opened.fill);
        this.setCoordDirty(gridX, gridY, true);
        break;
    case 'closed':
        this.colorizeNode(this.rects[gridY][gridX], nodeStyle.closed.fill);
        this.setCoordDirty(gridX, gridY, true);
        break;
    case 'tested':
        color = (value === true) ? nodeStyle.tested.fill : nodeStyle.normal.fill;

        this.colorizeNode(this.rects[gridY][gridX], color);
        this.setCoordDirty(gridX, gridY, true);
        break;
    case 'parent':
        // XXX: Maybe draw a line from this node to its parent?
        // This would be expensive.
        break;
    default:
        console.error('unsupported operation: ' + attr + ':' + value);
        return;
    }
}

colorizeNode(node:RaphaelElement, color:any) {
  node.animate({
        fill: color
  }, this.nodeColorizeEffect.duration);
}

zoomNode(node:RaphaelElement) {
    node.toFront().attr({
        transform: this.nodeZoomEffect.transform,
    }).animate({
        transform: this.nodeZoomEffect.transformBack,
    }, this.nodeZoomEffect.duration);
}

setWalkableAt(gridX:number, gridY:number, value:any) {
    var node, i, blockedNodes = this.blockedNodes;
    if (!blockedNodes) {
        blockedNodes = this.blockedNodes = new Array(this.rows);
        for (i = 0; i < this.rows; ++i) {
            blockedNodes[i] = [];
        }
    }
    node = blockedNodes[gridY][gridX];
    if (value) {
        // clear blocked node
        if (node) {
            this.colorizeNode(node, this.rects[gridY][gridX].attr('fill'));
            this.zoomNode(node);
            setTimeout(function() {
                node.remove();
            }, this.nodeZoomEffect.duration);
            blockedNodes[gridY][gridX] = null;
        }
    } else {
        // draw blocked node
        if (node) {
            return;
        }
        
        node = blockedNodes[gridY][gridX] = this.rects[gridY][gridX].clone();
        this.colorizeNode(node, this.nodeStyle.blocked.fill);
        this.zoomNode(node);
    }
}

clearFootprints() {
    var i, x, y, coord, coords = this.getDirtyCoords();
    for (i = 0; i < coords.length; ++i) {
        coord = coords[i];
        x = coord[0];
        y = coord[1];
        this.rects[y][x].attr(this.nodeStyle.normal);
        this.setCoordDirty(x, y, false);
    }
}

clearBlockedNodes() {
    var i, j, blockedNodes = this.blockedNodes;
    if (!blockedNodes) {
        return;
    }
    for (i = 0; i < this.rows; ++i) {
        for (j = 0 ;j < this.columns; ++j) {
            if (blockedNodes[i][j]) {
                blockedNodes[i][j].remove();
                blockedNodes[i][j] = null;
            }
        }
    }
}

drawPath(path: RaphaelSet) {
    if (!path.length) {
        return;
    }
    var svgPath = this.buildSvgPath(path);
    this.path = this.paper.path(svgPath).attr(this.pathStyle);
}

/**
 * Given a path, build its SVG represention.
 */
buildSvgPath(path: RaphaelSet) {
    var i, strs = [], size = this.nodeSize;

    strs.push('M' + (path[0][0] * size + size / 2) + ' ' +
              (path[0][1] * size + size / 2));
    for (i = 1; i < path.length; ++i) {
        strs.push('L' + (path[i][0] * size + size / 2) + ' ' +
                  (path[i][1] * size + size / 2));
    }

    return strs.join('');
}

clearPath() {
    if (this.path) {
        this.path.remove();
    }
}

/**
 * Helper function to convert the page coordinate to grid coordinate
 */
toGridCoordinate(pageX: number, pageY: number) {
  let posY = pageY - this.paper.canvas.getBoundingClientRect().top;
  let posX = pageX - this.paper.canvas.getBoundingClientRect().left;
  return [
        Math.floor(posX / this.nodeSize),
        Math.floor(posY / this.nodeSize)
    ];
}

/**
 * helper function to convert the grid coordinate to page coordinate
 */
toPageCoordinate(gridX: number, gridY: number) {
    return [
        gridX * this.nodeSize,
        gridY * this.nodeSize
    ];
}

setCoordDirty(gridX: number, gridY: number, isDirty: boolean) {
    var x, y,
        numRows = this.rows,
        numCols = this.columns,
        coordDirty;

    if (this.coordDirty === undefined) {
        coordDirty = this.coordDirty = [];
        for (y = 0; y < numRows; ++y) {
            coordDirty.push([]);
            for (x = 0; x < numCols; ++x) {
                coordDirty[y].push(false);
            }
        }
    }

    this.coordDirty[gridY][gridX] = isDirty;
}

getDirtyCoords() {
    var x, y,
        numRows = this.rows,
        numCols = this.columns,
        coordDirty = this.coordDirty,
        coords = [];

    if (coordDirty === undefined) {
        return [];
    }

    for (y = 0; y < numRows; ++y) {
        for (x = 0; x < numCols; ++x) {
            if (coordDirty[y][x]) {
                coords.push([x, y]);
            }
        }
    }
    return coords;
}

  /*public readonly cells: Array<Array<Cell>> = [];

  constructor(public nRow: number, public nCol: number) {
    // initialize cells
    for (let i = 0; i < nRow; i++) {
      this.cells[i] = [];
      for (let j = 0; j < nCol; j++) {
        this.cells[i][j] = new Cell(i, j);
      }
    }

    // generate maze
    const current = this.cells[RandomNumber.within(this.nRow)][
      RandomNumber.within(this.nCol)
    ];
    this.huntAndKill(current);
  }

  draw(canvas: HTMLCanvasElement, cellPixels: number, lineThickness = 2) {
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = lineThickness;
    this.cells.forEach(x =>
      x.forEach(c => {
        c.draw(ctx, cellPixels);
      })
    );
  }

  drawPath(canvas: HTMLCanvasElement, cellPixels: number, lineThickness = 4) {
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = lineThickness;
    ctx.strokeStyle = '#4080ff';
    ctx.beginPath();
    ctx.moveTo(0, cellPixels / 2);
    
    this.findPath().forEach(x =>
        ctx.lineTo((x.col + 0.5) * cellPixels, (x.row + 0.5) * cellPixels)
    );
    ctx.lineTo(this.nCol * cellPixels, (this.nRow - 0.5) * cellPixels)
    ctx.stroke();
  }

  findPath(): Array<Cell> {
    this.cells.forEach(x => x.forEach(c => (c.traversed = false)));
    const start = this.cells[0][0];
    const end = this.cells[this.nRow - 1][this.nCol - 1];
    const path: Array<Cell> = [];
    path.unshift(start);

    while (1) {
      let current = path[0];
      current.traversed = true;

      if (current.equals(end)) {
        break;
      }

      const traversableNeighbors = this.getNeighbors(current)
        .filter(c => c.hasConnectionWith(current))
        .filter(c => !c.traversed);
      if (traversableNeighbors.length === 0) {
        path.splice(0, 1);
      } else {
        path.unshift(traversableNeighbors[0]);
      }
    }
    return path.reverse();
  }

  private huntAndKill(current: Cell) {
    const unvisitedNeighbors = this.getNeighbors(current).filter(
      c => !c.hasVisited()
    );
    if (unvisitedNeighbors.length === 0) {
      // Hunt
      for (let huntRow = 0; huntRow < this.nRow; huntRow++) {
        for (let huntColumn = 0; huntColumn < this.nCol; huntColumn++) {
          current = this.cells[huntRow][huntColumn];
          if (current.hasVisited()) {
            continue;
          }
          const visitedNeighbors = this.getNeighbors(current).filter(c =>
            c.hasVisited()
          );
          if (visitedNeighbors.length < 1) {
            continue;
          }
          const nextCell =
            visitedNeighbors[RandomNumber.within(visitedNeighbors.length)];
          current.breakWallWith(nextCell);
          this.huntAndKill(nextCell);
        }
      }
    } else {
      // Kill
      const nextCell =
        unvisitedNeighbors[RandomNumber.within(unvisitedNeighbors.length)];
      current.breakWallWith(nextCell);
      this.huntAndKill(nextCell);
    }
  }

  private getNeighbors(cell: Cell): Array<Cell> {
    const neighbors = [];
    if (cell.row - 1 >= 0) {
      neighbors.push(this.cells[cell.row - 1][cell.col]);
    }
    if (cell.row + 1 < this.nRow) {
      neighbors.push(this.cells[cell.row + 1][cell.col]);
    }
    if (cell.col - 1 >= 0) {
      neighbors.push(this.cells[cell.row][cell.col - 1]);
    }
    if (cell.col + 1 < this.nCol) {
      neighbors.push(this.cells[cell.row][cell.col + 1]);
    }
    return neighbors;
  }
}

class RandomNumber {
  static within(n: number): number {
    return Math.floor(Math.random() * n);
  }
  */
}
