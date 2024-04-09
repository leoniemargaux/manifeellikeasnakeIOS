// Set screen dimensions
const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 400;

// Set colors
const BACKGROUND_COLOUR = "#E6E6FA"; // Lavender
const SNAKE_COLOUR = "#F984EF"; // Light purple
const FOOD_COLOUR = "#00CCCC"; // Dark cyan

// Set snake properties
const BLOCK_SIZE = 30;

// Define directions
const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

class Snake {
    constructor() {
        this.length = 1;
        this.positions = [{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 }];
        this.direction = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][Math.floor(Math.random() * 4)]; // Random initial direction
        this.color = SNAKE_COLOUR;
        this.score = 1;
        this.scores = [];
        this.gameOver = false; // Added game over flag
        this.game_over_sound = new Audio("static/sounds/explode.mp3");
        // Initialize an empty array to store MP3 file names in the 'sounds' directory
        this.eat_sounds = [];
        // Load all MP3 files from the 'sounds' directory
        const soundFiles = ['boy.mp3','fetch.mp3', 'fluffy.mp3', 'man.mp3', 'stomach.mp3', 'what.mp3', 'unicorn.mp3']; 
        soundFiles.forEach(file => {
            this.eat_sounds.push(new Audio("static/sounds/" + file));
        });
    }

    get_head_position() {
        return this.positions[0];
    }

    turn(point) {
        // Avoid reversing direction directly into itself
        if (this.length > 1 && (point.x * -1 === this.direction.x) && (point.y * -1 === this.direction.y)) {
            return;
        } else {
            this.direction = point;
        }
    }

    move(food) {
        const cur = this.get_head_position();
        const x = this.direction.x;
        const y = this.direction.y;
        const newHead = { x: (cur.x + (x * BLOCK_SIZE) + SCREEN_WIDTH) % SCREEN_WIDTH, y: (cur.y + (y * BLOCK_SIZE) + SCREEN_HEIGHT) % SCREEN_HEIGHT };
        if (this.positions.slice(1).some(p => p.x === newHead.x && p.y === newHead.y)) {
            this.reset();
        } else {
            this.positions.unshift(newHead);
            if (this.positions.length > this.length) {
                this.positions.pop();
            }
            if (this.get_head_position().x === food.position.x && this.get_head_position().y === food.position.y) {
                this.length += 1;
                this.score += 1;
                this.scores.push(this.score);
                // Play a random sound from the 'eat_sounds' array
                const randomIndex = Math.floor(Math.random() * this.eat_sounds.length);
                this.eat_sounds[randomIndex].play();
                food.randomize_position();
            }
        }
    }

    reset() {
        this.length = 1;
        this.positions = [{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 }];
        this.direction = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][Math.floor(Math.random() * 4)];
        this.score = 0;
        this.gameOver = true; // Set game over flag
        this.game_over_sound.volume = 0.5;
        this.game_over_sound.play();
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        this.positions.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x + BLOCK_SIZE / 2, p.y + BLOCK_SIZE / 2, BLOCK_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    handle_keys(event) {
        switch(event.key) {
            case "ArrowUp":
                this.turn({ x: 0, y: -1 });
                break;
            case "ArrowDown":
                this.turn({ x: 0, y: 1 });
                break;
            case "ArrowLeft":
                this.turn({ x: -1, y: 0 });
                break;
            case "ArrowRight":
                this.turn({ x: 1, y: 0 });
                break;
        }
    }
}

class Food {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.color = FOOD_COLOUR;
        this.randomize_position();
    }

    randomize_position() {
        this.position = { x: Math.floor(Math.random() * (SCREEN_WIDTH / BLOCK_SIZE)) * BLOCK_SIZE, y: Math.floor(Math.random() * (SCREEN_HEIGHT / BLOCK_SIZE)) * BLOCK_SIZE };
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        const centerX = this.position.x + BLOCK_SIZE / 2;
        const centerY = this.position.y + BLOCK_SIZE / 2;
        const outerRadius = BLOCK_SIZE / 2;
        const innerRadius = outerRadius * 0.5; // Adjust inner radius as needed

        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = Math.PI * 2 * i / 10 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Initialize snake and food objects
    const snake = new Snake();
    const food = new Food();

    // Variable to track if the game is in automated mode
    let automateInterval;

    // Add event listener for arrow key press to control snake movement
    document.addEventListener("keydown", event => snake.handle_keys(event));

    // Add event listeners for arrow button clicks to control snake movement
    document.getElementById("upButton").addEventListener("click", () => snake.turn({ x: 0, y: -1 }));
    document.getElementById("downButton").addEventListener("click", () => snake.turn({ x: 0, y: 1 }));
    document.getElementById("leftButton").addEventListener("click", () => snake.turn({ x: -1, y: 0 }));
    document.getElementById("rightButton").addEventListener("click", () => snake.turn({ x: 1, y: 0 }));

    // Add event listener for Robot Player button
    document.getElementById("robotButton").addEventListener("click", () => automateGame());

    // Function to automate the game using a greedy algorithm
    function automateGame() {   
        // Clear any existing interval
        clearInterval(automateInterval);

        // Set interval for automated movement
        automateInterval = setInterval(() => {
            // Check if the game is over
            if (snake.gameOver) { // Check game over flag
                clearInterval(automateInterval); // Stop the game loop
                return; // Exit the function
            }

            // Find the direction that minimizes the Manhattan distance to the food without turning on itself
            let direction = findGreedyDirection();

            // Move the snake in the chosen direction
            snake.turn(direction);         
          
            // Update the score display
            document.getElementById('score').textContent = snake.score;
            
        }, 1000 / 20); // Adjust the speed as needed
    }

    // Function to find the direction that minimizes the Manhattan distance to the food while avoiding collisions
    function findGreedyDirection() {
        let head = snake.get_head_position();
        let foodPos = food.position;

        // Calculate Manhattan distances in all four directions
        let distances = [
            { direction: { x: 0, y: -1 }, distance: Math.abs(head.x - foodPos.x) + Math.abs((head.y - BLOCK_SIZE) - foodPos.y) }, // Up
            { direction: { x: 0, y: 1 }, distance: Math.abs(head.x - foodPos.x) + Math.abs((head.y + BLOCK_SIZE) - foodPos.y) }, // Down
            { direction: { x: -1, y: 0 }, distance: Math.abs((head.x - BLOCK_SIZE) - foodPos.x) + Math.abs(head.y - foodPos.y) }, // Left
            { direction: { x: 1, y: 0 }, distance: Math.abs((head.x + BLOCK_SIZE) - foodPos.x) + Math.abs(head.y - foodPos.y) } // Right
        ];

        // Filter out directions that lead to collision with the snake's body
        distances = distances.filter(item => {
            let nextCell = {
                x: head.x + item.direction.x * BLOCK_SIZE,
                y: head.y + item.direction.y * BLOCK_SIZE
            };
            return !snake.positions.some(pos => pos.x === nextCell.x && pos.y === nextCell.y);
        });

        if (distances.length === 0) {
            // If no valid direction found (e.g., snake is surrounded by its body), return current direction
            return snake.direction;
        }

        // Find the direction with the minimum distance
        let minDistance = Infinity;
        let minDirection = { x: 0, y: 0 };
        distances.forEach(item => {
            if (item.distance < minDistance) {
                minDistance = item.distance;
                minDirection = item.direction;
            }
        });

        return minDirection;
    }

    // Function to display the final score window
    function displayFinalScore() {
        scoreWindow.style.display = "block";
        document.getElementById("finalScore").textContent = Math.max(...snake.scores);
        // Array of different shades of pink
        const pinkShades = [
            [255, 182, 193], // Light Pink
            [255, 192, 203], // Pink
            [255, 228, 225], // Misty Rose
            [255, 105, 180], // Hot Pink
            [219, 112, 147], // Pale Violet Red
            [255, 20, 147], // Deep Pink
            [228, 0, 124], // Mexican Pink
            [252, 15, 192], // Shocking Pink
            [226, 80, 152], // Raspberry Pink
            [236, 88, 149], // Cherry Blossom Pink
            [255, 181, 197], // Carnation Pink
            [255, 110, 180], // Flamingo Pink
            [236, 193, 204], // Pink Lace
            [255, 160, 122], // Peach Pink
            [254, 183, 165], // Tea Rose
            [255, 153, 153], // Bubble Gum Pink
            [255, 182, 193], // Piggy Pink
            [255, 192, 203], // Tickle Me Pink
            [255, 182, 193], // Cotton Candy Pink
            [255, 192, 203], // Lavender Pink
        ];
        // Randomly select an RGB value from the array
        const randomIndex = Math.floor(Math.random() * pinkShades.length);
        const randomPink = pinkShades[randomIndex];
        // Set the background color to the selected shade of pink
        document.body.style.backgroundColor = `rgb(${randomPink[0]}, ${randomPink[1]}, ${randomPink[2]})`;
    }

    // Event listener for restart button click
    restartButton.addEventListener("click", function() {
        // Hide score window
        scoreWindow.style.display = "none";
        snake.gameOver = false;
        startGame();
    });

    // Game loop
    function gameLoop() {
        setTimeout(function() {
        
            // Move snake and draw game elements
            snake.move(food);
            ctx.fillStyle = BACKGROUND_COLOUR;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            snake.draw(ctx);
            food.draw(ctx);

            // Update the score display
            document.getElementById('score').textContent = snake.score;

            if (snake.score == 0) {
                displayFinalScore();
                snake.scores = [];
                snake.score = 1;
            }

            requestAnimationFrame(gameLoop);
        }, 1000 / 20); // Adjust the divisor value to change the speed (lower value -> faster speed)
    }

    // Start the game loop
    gameLoop();
});