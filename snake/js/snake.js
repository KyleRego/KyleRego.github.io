const NUMBER_OF_SQUARES = 20 * 20;
const timeInterval = 150;

class Game extends React.Component {
  constructor(props) {
    super(props);
    let snakePositions = [this.calculateRandomPosition()];
    let snakeDirection = this.calculateInitialSnakeDirection();
    let foodPosition = this.calculateRandomPosition();
    this.gameRef = React.createRef();
    this.state = {
      snakePositions: snakePositions,
      snakeDirection: snakeDirection,
      foodPosition: foodPosition,
      isGameOver: false,
    }
  }

  render() {
    return (
      <div className="game"
        ref = {this.gameRef}
        onKeyDown={(e) => this.handleKeyPress(e)}
        tabIndex = "0"
      >
        <h1>
          {this.state.isGameOver ? 'Game over!' : 'Snake'}
        </h1>
        <Board snakePositions={this.state.snakePositions} foodPosition={this.state.foodPosition}/>
        <MobileControls 
          onClickUp={this.setSnakeDirectionPositiveY.bind(this)}
          onClickDown={this.setSnakeDirectionNegativeY.bind(this)}
          onClickLeft={this.setSnakeDirectionNegativeX.bind(this)}
          onClickRight={this.setSnakeDirectionPositiveX.bind(this)}
        />
      </div>
    )
  }

  focusGame() {
    this.gameRef.current.focus();
  }

  setSnakeDirectionPositiveY() {
    this.setState((state, props) => ({
      snakePositions: state.snakePositions,
      snakeDirection: 'positive-y',
    }));
  }

  setSnakeDirectionNegativeY() {
    this.setState((state, props) => ({
      snakePositions: state.snakePositions,
      snakeDirection: 'negative-y',
    }));
  }

  setSnakeDirectionPositiveX() {
    this.setState((state, props) => ({
      snakePositions: state.snakePositions,
      snakeDirection: 'positive-x',
    }));
  }

  setSnakeDirectionNegativeX() {
    this.setState((state, props) => ({
      snakePositions: state.snakePositions,
      snakeDirection: 'negative-x',
    }));
  }

  componentDidMount() {
    this.intervalId = setInterval(() => this.tick(), timeInterval);
    this.focusGame();
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  tick() {
    if (this.state.isGameOver) {
      clearInterval(this.intervalId)
    }
    else if (this.snakeIsOverlappingItself(this.state.snakePositions)) {
      this.endGame();
    }
    else if (this.snakeIsOverLappingFood(this.state.snakePositions, this.state.foodPosition)) {
      this.moveSnake(true);
      this.moveFood();
    } else {
      this.moveSnake(false);
    }
  }

  moveSnake(keepTail) {
    this.setState((state, props) => ({
      snakePositions: this.calculateNewSnakePositions(state.snakePositions, state.snakeDirection, keepTail),
      snakeDirection: state.snakeDirection,
      foodPosition: state.foodPosition,
      isGameOver: false,
    }));
  }

  moveFood() {
    this.setState((state, props) => ({
      snakePositions: state.snakePositions,
      snakeDirection: state.snakeDirection,
      foodPosition: this.calculateRandomPosition(),
      isGameOver: false,
    }));
  }

  endGame() {
    this.setState((state, props) => ({
      snakePositions: state.snakePositions,
      snakeDirection: state.snakeDirection,
      foodPosition: state.foodPosition,
      isGameOver: true,
    }));
  }

  snakeIsOverLappingFood(snakePositions, foodPosition) {
    return snakePositions.some(snakePosition => {
      return snakePosition[0] === foodPosition[0] && snakePosition[1] === foodPosition[1];
    })
  }

  snakeIsOverlappingItself(snakePositions) {
    const head = snakePositions[snakePositions.length - 1];
    for (let i = 0; i < snakePositions.length - 2; i += 1) {
      if (head[0] === snakePositions[i][0] && head[1] === snakePositions[i][1]) {
        return true;
      }
    }
    return false;
  }

  calculateNewSnakePositions(snakePositions, direction, keepTail) {
    const head = snakePositions[snakePositions.length - 1];
    let newHead;
    switch (direction) {
      case 'positive-x':
        newHead = [head[0], head[1] + 1];
        break;
      case 'negative-x':
        newHead = [head[0], head[1] - 1];
        break;
      case 'positive-y':
        newHead = [head[0] - 1, head[1]];
        break;
      case 'negative-y':
        newHead = [head[0] + 1, head[1]];
        break;
      default:
        break;
    }
    newHead = this.adjustPositionsToKeepWithinBoundaries(newHead);
    snakePositions.push(newHead);
    if (!keepTail) {
      snakePositions.shift();
    }
    return snakePositions;
  }

  adjustPositionsToKeepWithinBoundaries(position) {
    const gridLength = Math.sqrt(NUMBER_OF_SQUARES);
    if (position[0] === gridLength) {
      position[0] = 0;
    } else if (position[0] === -1) {
      position[0] = gridLength - 1;
    } else if (position[1] === gridLength) {
      position[1] = 0;
    } else if (position[1] === -1) {
      position[1] = gridLength - 1;
    }
    return position;
  }

  calculateRandomPosition() {
    return [
      Math.floor(Math.random() * Math.sqrt(NUMBER_OF_SQUARES)),
      Math.floor(Math.random() * Math.sqrt(NUMBER_OF_SQUARES))
    ]
  }

  calculateInitialSnakeDirection() {
    const directions = ['positive-x', 'negative-x', 'positive-y', 'negative-y'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  handleKeyPress(event) {
    switch (event.key) {
      case 'Down':
      case 'ArrowDown':
        this.setSnakeDirectionNegativeY();
        break;
      case 'Up':
      case 'ArrowUp':
        this.setSnakeDirectionPositiveY();
        break;
      case 'Left':
      case 'ArrowLeft':
        this.setSnakeDirectionNegativeX();
        break;
      case 'Right':
      case 'ArrowRight':
        this.setSnakeDirectionPositiveX();
        break;
      default:
        break;
    }
  }
}

class Board extends React.Component {
  constructor(props) {
    super(props);
    let squares = [];
    for (let i = 0; i < Math.sqrt(NUMBER_OF_SQUARES); i += 1) {
      squares.push(Array(Math.sqrt(NUMBER_OF_SQUARES)).fill(null));
    }
    this.state = {
      squares: squares,
    }
  }

  render() {
    return (
      <div className="board">
        {this.state.squares.map((row, rowIndex) => {
        let rowSnakePositions = this.props.snakePositions.filter(snakePosition => {
          return snakePosition[0] === rowIndex;
        }).map(rowSnakePosition => rowSnakePosition[1]);
        
        return (<Row row={row} rowSnakePositions={rowSnakePositions} foodPosition={this.props.foodPosition} rowIndex={rowIndex} key={rowIndex}/>)
      })}
      </div>
      
    )
  }
}

class MobileControls extends React.Component {
  render() {
    return (
      <div className="mobile-controls">
          <div 
            onClick={this.props.onClickUp}
            className="mobile-control"
          >
            Up
          </div>

          <div className="middle-mobile-buttons-container">
            <div 
              onClick={this.props.onClickLeft}
              className="mobile-control"
            >
              Left
            </div>
            
            <div 
              onClick={this.props.onClickRight}
              className="mobile-control"
            >
              Right
            </div>
          </div>

          <div 
            onClick={this.props.onClickDown}
            className="mobile-control"
          >
            Down
          </div>
      </div>
    )  
  }
}

class Row extends React.Component {
  render() {
    return (
      <div className="row">
        {
          this.props.row.map((square, columnIndex) => {
            if (this.props.rowSnakePositions.includes(columnIndex)) {
              square = 'snake';
            } else if (this.props.foodPosition[0] === this.props.rowIndex && this.props.foodPosition[1] === columnIndex) {
              square = 'food';
            }
            return <Square value={square} key={columnIndex}/>;
          })
        }
      </div>
    )
  }
}

class Square extends React.Component {
  render() {
    return (
      <div className={"square " + this.props.value}>
         
      </div>
    )
  }
}

const root = ReactDOM.createRoot(document.getElementById("snake-container"));
root.render(<Game />);