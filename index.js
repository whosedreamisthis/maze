const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = 600;
const height = 600;
const cells = 6;

const unitLength = width / cells;
const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, {
    isStatic: true,
  }),
  Bodies.rectangle(width / 2, height, width, 2, {
    isStatic: true,
  }),
  Bodies.rectangle(0, height / 2, 2, height, {
    isStatic: true,
  }),
  Bodies.rectangle(width, height / 2, 2, height, {
    isStatic: true,
  }),
];

World.add(world, walls);

// Maze Generation
const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter = counter - 1;
    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }
  return arr;
};
const grid = Array(cells)
  .fill(null)
  .map(() => Array(cells).fill(false));

const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false));
const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startCol = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
  // if I have visited the cell at [row,column] then return

  if (grid[row][column]) {
    return;
  }
  // Mark this cell as being visited
  grid[row][column] = true;
  // for each neighbour...
  const neighbors = shuffle([
    [row + 1, column, "down"],
    [row - 1, column, "up"],
    [row, column - 1, "left"],
    [row, column + 1, "right"],
  ]);
  // see if that neighbor is out of bounds
  for (let n of neighbors) {
    const [nextRow, nextColumn, direction] = n;
    if (
      nextRow < 0 ||
      nextRow >= cells ||
      nextColumn < 0 ||
      nextColumn >= cells
    ) {
      continue;
    }
    // if we have visited that neighbour, continue to next eighbour
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    // remove a wall from either horizontals or verticals
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }
    stepThroughCell(nextRow, nextColumn);
  }

  // visit next cell
};

stepThroughCell(startRow, startCol);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLength + unitLength / 2,
      rowIndex * unitLength + unitLength,
      unitLength,
      10,
      {
        label: "wall",
        isStatic: true,
        fillStroke: "red",
        wireframes: false,
        background: "white",
        strokeWidth: 10,
        fill: "white",
        render: {
          fillStyle: "white",
        },
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, colIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      colIndex * unitLength + unitLength,
      rowIndex * unitLength + unitLength / 2,
      10,
      unitLength,
      {
        isStatic: true,
        label: "wall",
        fillStroke: "red",
        wireframes: false,
        background: "white",
        strokeWidth: 10,
        fill: "white",
        render: {
          fillStyle: "white",
        },
      }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitLength / 2,
  height - unitLength / 2,
  unitLength / 2,
  unitLength / 2,
  {
    label: "goal",
    isStatic: true,
    render: {
      fillStyle: "green",
    },
  }
);
World.add(world, goal);

//Ball
const ball = Bodies.circle(unitLength / 2, unitLength / 2, unitLength * 0.25, {
  label: "ball",
  render: {
    fillStyle: "white",
  },
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;
  if (event.code === "KeyW") {
    Body.setVelocity(ball, { x, y: y - 5 });
  } else if (event.code === "KeyA") {
    Body.setVelocity(ball, { x: x - 5, y: y });
  } else if (event.code === "KeyD") {
    Body.setVelocity(ball, { x: x + 5, y });
  } else if (event.code === "KeyS") {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
});

//win condition
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;

      for (body of world.bodies) {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      }
    }
  });
});
