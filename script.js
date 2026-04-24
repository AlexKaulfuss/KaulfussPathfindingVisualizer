class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isWall = false;
        this.isVisited = false;
        this.parent = null;
        this.element = null; 
        
        this.g = Infinity; 
        this.f = Infinity; 
    }
}

class Pathfinder {
    constructor(grid, startNode, goalNode) {
        this.grid = grid;
        this.startNode = startNode;
        this.goalNode = goalNode;
        this.visitedOrder = []; 
    }

    search() { 
        throw new Error("Method 'search()' must be implemented."); 
    }

    reconstructPath() {
        const path = [];
        let curr = this.goalNode;
        while (curr) {
            path.push(curr);
            curr = curr.parent;
        }
        return path.reverse();
    }
}


class BFS extends Pathfinder {
    search() {
        const queue = [this.startNode];
        this.startNode.isVisited = true;

        while (queue.length > 0) {
            const curr = queue.shift();
            
            if (curr !== this.startNode && curr !== this.goalNode) {
                this.visitedOrder.push(curr);
            }

            if (curr === this.goalNode) return true;

            for (const neighbor of this.grid.getNeighbors(curr)) {
                if (!neighbor.isVisited && !neighbor.isWall) {
                    neighbor.isVisited = true;
                    neighbor.parent = curr;
                    queue.push(neighbor);
                }
            }
        }
        return false;
    }
}


class AStar extends Pathfinder {
    constructor(grid, startNode, goalNode) {
        super(grid, startNode, goalNode);
        this.openSet = [this.startNode];
        
        this.grid.nodes.forEach(row => row.forEach(n => {
            n.g = Infinity;
            n.f = Infinity;
        }));

        this.startNode.g = 0;
        this.startNode.f = this.getHeuristic(this.startNode, this.goalNode);
    }

    getHeuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    search() {
        while (this.openSet.length > 0) {
            this.openSet.sort((a, b) => a.f - b.f);
            const curr = this.openSet.shift();

            if (curr !== this.startNode && curr !== this.goalNode) {
                this.visitedOrder.push(curr);
            }

            if (curr === this.goalNode) return true;

            for (const neighbor of this.grid.getNeighbors(curr)) {
                if (neighbor.isWall) continue;

                const tentativeG = curr.g + 1;
                if (tentativeG < neighbor.g) {
                    neighbor.parent = curr;
                    neighbor.g = tentativeG;
                    neighbor.f = neighbor.g + this.getHeuristic(neighbor, this.goalNode);

                    if (!this.openSet.includes(neighbor)) {
                        this.openSet.push(neighbor);
                    }
                }
            }
        }
        return false;
    }
}

class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.nodes = [];
        this.container = document.getElementById('gridContainer');
        this.createGrid();
    }

    createGrid() {
        const table = document.createElement('table');
        for (let r = 0; r < this.rows; r++) {
            this.nodes[r] = [];
            const tr = document.createElement('tr');
            for (let c = 0; c < this.cols; c++) {
                const node = new Node(r, c);
                const td = document.createElement('td');
                
                td.addEventListener('mousedown', () => {
                    node.isWall = !node.isWall;
                    this.render();
                });

                node.element = td;
                this.nodes[r][c] = node;
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        this.container.innerHTML = '';
        this.container.appendChild(table);

        this.start = this.nodes[Math.floor(this.rows / 2)][5];
        this.goal = this.nodes[Math.floor(this.rows / 2)][this.cols - 6];
        this.render();
    }

    getNeighbors(node) {
        const neighbors = [];
        const offsets = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [dr, dc] of offsets) {
            const r = node.row + dr, c = node.col + dc;
            if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                neighbors.push(this.nodes[r][c]);
            }
        }
        return neighbors;
    }

    render() {
        this.nodes.forEach(row => row.forEach(n => {
            n.element.className = n.isWall ? 'wall' : '';
            if (n === this.start) n.element.classList.add('start');
            if (n === this.goal) n.element.classList.add('goal');
        }));
    }

    clearSearchData() {
        this.nodes.forEach(row => row.forEach(n => {
            n.isVisited = false;
            n.parent = null;
            n.g = Infinity;
            n.f = Infinity;
            n.element.classList.remove('visited', 'path');
        }));
    }
}

const myGrid = new Grid(20, 20);

document.getElementById('runBtn').onclick = async () => {
    myGrid.clearSearchData();
    const type = document.getElementById('algoSelect').value;
    
    let solver;
    if (type === "BFS") solver = new BFS(myGrid, myGrid.start, myGrid.goal);
    if (type === "AStar") solver = new AStar(myGrid, myGrid.start, myGrid.goal);

    if (solver && solver.search()) {
        for (const node of solver.visitedOrder) {
            await new Promise(r => setTimeout(r, 5));
            node.element.classList.add('visited');
        }
        const path = solver.reconstructPath();
        for (const node of path) {
            if (node !== myGrid.start && node !== myGrid.goal) {
                await new Promise(r => setTimeout(r, 20));
                node.element.classList.add('path');
            }
        }
    } else {
        alert("No path found!");
    }
};

document.getElementById('resetBtn').onclick = () => {
    myGrid.nodes.forEach(row => row.forEach(n => n.isWall = false));
    myGrid.clearSearchData();
    myGrid.render();
};