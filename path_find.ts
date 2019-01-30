import * as fs from 'fs';

interface PositionInterface {
    x: string| number;
    y: string| number;
}

interface NodeInterface {
    position: PositionInterface;
    cost: number;
    parent: NodeInterface|null;
}

interface AstarListInterface {
    open: Node[];
    close: Node[];
}
class AstarList implements AstarListInterface {
    public open: Node[] = [];
    public close: Node[] = [];

    public addOrUpdateNodeToOpenList(newNode: Node) {
        // remove previous Node
        this.open = this.open.filter(node => {
            if(node.position.x === newNode.position.x && node.position.y === newNode.position.y) {
                this.close.push(node);
                return false;
            } else {
                return true;
            }
        });
        this.open.push(newNode);
    }

    public checkIfNodeIsOnCloseList(newNode: Node) {
        let newPosition = newNode.position;
        let filter = this.close.filter(({position}) => position.x === newPosition.x && position.y === newPosition.y);
        return filter.length === 0;
    }

    public findNodeWithPosition(position: PositionInterface): Node|null {
        let filter = this.open.filter(node => {
            return node.position.x === position.x && node.position.y === position.y;
        });
        return filter.length > 0 ? filter[0] : null;
    }

}

class Node implements NodeInterface {
    public position: PositionInterface;
    public cost: number;
    public parent: NodeInterface;

    public constructor(position: PositionInterface,
                       cost: number = 0,
                       parent: NodeInterface = null) {
        this.position = position;
        this.cost = cost;
        this.parent = parent;
    }
}

class PathFinding {
    public grid: string[][];
    public gridSizeX: number;
    public gridSizeY: number;

    public setGrid(grid: string[][]) {
        this.grid = grid;
        this.gridSizeX = grid.length;
        this.gridSizeY = grid[0].length; // LOL
    }

    public displayGrid(grid: string[][]) {
        console.log(grid.map((line: string[]) => line.join('')).join("\n"));
    }
    
    private addSolutionToGrid(solution: PositionInterface[]) {
        solution.forEach(pos => {
            if(this.grid[<number>pos.x][<number>pos.y] === ' ') {
                this.grid[<number>pos.x][<number>pos.y] = '.';
            }
        });
    }

    public getSolutionToGrid(solution: PositionInterface[], grid: string[][]) {
        let newGrid = grid.map(arr => arr.slice());

        solution.forEach(pos => {
            if(newGrid[<number>pos.x][<number>pos.y] === ' ') {
                newGrid[<number>pos.x][<number>pos.y] = '.';
            } else if(newGrid[<number>pos.x][<number>pos.y] === 'o') {
                newGrid[<number>pos.x][<number>pos.y] = 'x';
            }
        });
        return newGrid;
    }

    public getStartPositionsItems(nbItems = 0): any[] {
        if(nbItems === 0) {
            return this.getStartPositionsNumbers();
        }
        let nbArray: string[] = [];
        let count = 0;
        this.grid.forEach(line => {
            line.forEach(val => {
                if (!isNaN(parseInt(val))) {
                    nbArray.push(val);
                }
            });
        });
        if(nbArray.length > 0) {
            let sortArray = nbArray.sort(function (a, b) {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
            let itemsArray: any[] = [];
            this.grid.forEach((line, x) => {
                line.forEach((val, y) => {
                    if(val === 'o') {
                        if(count < nbItems) {
                            itemsArray.push({x: x.toString(), y: y.toString()});
                            count++;
                        }
                    }
                });
            });

            // sortArray contient les numero dans l'ordre,
            // il faut maintenant trouver leur position
            let goalPositions: any[] = [];
            goalPositions.push([this.getPositionByNumber(sortArray[0]), itemsArray[0]]);
            for (let i = 0; i < itemsArray.length - 1; i++) {
                goalPositions.push([itemsArray[i], itemsArray[i+1]]);
            }
            goalPositions.push([itemsArray[0], this.getPositionByNumber(sortArray.slice(-1)[0])]);

            // for (let i = 0; i < nbArray.length - 1; i++) {
            //     goalPositions.push([this.getPositionByNumber(sortArray[i]), this.getPositionByNumber(sortArray[i+1])]);
            // }
            return goalPositions;
            // return sortArray.map(nb => this.getPositionByNumber(nb));
        } else {
            console.error('No position defined!!!');
            process.exit();
        }

    }
    public getStartPositionsNumbers(): PositionInterface[][] {
        let nbArray: string[] = [];
        this.grid.forEach((line) => {
            line.forEach((val) => {
                if(!isNaN(parseInt(val))) {
                    nbArray.push(val);
                }
            })
        });
        if(nbArray.length > 0) {
            let sortArray = nbArray.sort(function (a, b) {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
            // sortArray contient les numero dans l'ordre,
            // il faut maintenant trouver leur position
            let goalPositions: PositionInterface[][] = [];
            for (let i = 0; i < nbArray.length - 1; i++) {
                   goalPositions.push([this.getPositionByNumber(sortArray[i]), this.getPositionByNumber(sortArray[i+1])]);
            }
            return goalPositions;
            // return sortArray.map(nb => this.getPositionByNumber(nb));
        } else {
            console.error('No position defined!!!');
            process.exit();
        }

    }
    
    private getPositionByNumber(nb: string): PositionInterface {
        for(let i = 0; i < this.grid.length; i++) {
            for(let j = 0; j < this.grid[i].length; j++) {
                if(this.grid[i][j] === nb) {
                    return {x: i.toString(), y: j.toString()};
                }
            }
        }
    }

    private getAroundValidPosition(position: PositionInterface, grid: string[][]) {
        let x = parseInt(<string>position.x);
        let y = parseInt(<string>position.y);
        let aroundPositions: PositionInterface[] = [
            {x: (x + 1).toString(), y: y.toString()},
            {x: x.toString(), y: (y + 1).toString()},
            {x: (x - 1).toString(), y: y.toString()},
            {x: x.toString(), y: (y - 1).toString()},
        ];
        return aroundPositions.filter(position => {
            return this.isNotOnWall(position) && this.isNotOutOfBound(position, grid);
        });
    }

    private isNotOnWall(position: PositionInterface): boolean {
        return parseInt(<string>position.x) >= 0
            && parseInt(<string>position.x) < this.gridSizeX
            && parseInt(<string>position.y) >= 0
            && parseInt(<string>position.y) < this.gridSizeY;
    }

    private isNotOutOfBound(position: PositionInterface, grid: string[][]): boolean {
        return grid[<number>position.x][<number>position.y] !== '#';
    }


    private getSolutionPositions(goal: Node): PositionInterface[] {
        if(goal.parent === null) return [];
        let positions: PositionInterface[] = [];
        let node = goal.parent;
        positions.push(goal.position);
        while (node.parent !== null) {
            positions.push(node.position);
            node = node.parent;
        }
        return positions;
    }
    
    private initPathFinding(startPosition: PositionInterface, goalPosition: PositionInterface, grid: string[][]) {
        let astarList = new AstarList();

        let solutions: any[] = [];
        let queue: Node[] = [];
        queue.push(new Node(startPosition));

        while(queue.length > 0) {
            let currentNode = queue.shift();
            if(this.checkIfCurrentIsGoal(currentNode.position, goalPosition )) {
                solutions.push(this.getSolutionPositions(currentNode));
            }

            this.getAroundValidPosition(currentNode.position, grid).forEach(nextPosition => {
                let newCost: number = currentNode.cost + 1;
                let nextNode: Node = new Node(nextPosition, newCost, currentNode);

                if(astarList.checkIfNodeIsOnCloseList(nextNode)) {
                    let nodeIfAlreadyOpen: Node = astarList.findNodeWithPosition(nextPosition);
                    if(nodeIfAlreadyOpen === null) {
                        astarList.addOrUpdateNodeToOpenList(nextNode);
                        queue.push(nextNode);
                    } else if(newCost < nodeIfAlreadyOpen.cost) {
                        astarList.addOrUpdateNodeToOpenList(nextNode);
                        queue.push(nextNode);
                    }
                }
            });
        }
        return solutions[0];
    }

    private checkIfCurrentIsGoal(current: PositionInterface, goal: PositionInterface): boolean {
        return current.x === goal.x && current.y === goal.y;
    }

    public startPathWithNumber(grid: string[][]) {
        this.setGrid(grid);
        this.displayGrid(this.grid);
        let goalPositions = this.getStartPositionsNumbers();
        goalPositions.forEach(pos => {
            let solution = this.initPathFinding(pos[0], pos[1], this.grid);

            let grid = this.getSolutionToGrid(solution, this.grid);
            this.displayGrid(grid);
        });
    }

    public startPathWithItems(grid: string[][], nbItems = 0) {
        this.setGrid(grid);
        this.displayGrid(this.grid);
        let nGrid = grid;
        let goalPositions = this.getStartPositionsItems(nbItems);

        goalPositions.forEach(pos => {
            let solution = this.initPathFinding(pos[0], pos[1], this.grid);
            nGrid = this.getSolutionToGrid(solution, nGrid);
        });
        this.displayGrid(nGrid);

    }

    private initTest() {
        let pos1: PositionInterface = { x: '1', y: '2'};
        let node1 = new Node(pos1);

        let pos2: PositionInterface = { x: '4', y: '8'};
        let node2 = new Node(pos2, 2, node1);

        let node11 = new Node(pos1, 2, node1);

        let astarList = new AstarList();
        // let openList: Node[] = [];
        // let closeList: Node[] = [];
        console.log('open');
        console.log(astarList.open);
        console.log('close');
        console.log(astarList.close);
        astarList.addOrUpdateNodeToOpenList(node1);
        console.log('open');
        console.log(astarList.open);
        console.log('close');
        console.log(astarList.close);
        astarList.addOrUpdateNodeToOpenList(node11);
        console.log('open');
        console.log(astarList.open);
        console.log('close');
        console.log(astarList.close);
    }

    static parseGridString(gridString: string) {
        return gridString.split('\n')
            .map(line => line.split('')) ;
    }
}

let gridString = fs.readFileSync('/dev/stdin').toString();
let gridArray = PathFinding.parseGridString(gridString);

let pf = new PathFinding();
pf.startPathWithNumber(gridArray);
// pf.startPathWithItems(gridArray, 3);

