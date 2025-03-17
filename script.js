document.addEventListener('DOMContentLoaded', () => {
    // 游戏元素
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highscoreElement = document.getElementById('highscore');
    const finalScoreElement = document.getElementById('finalScore');
    const gameOverElement = document.getElementById('gameOver');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    
    // 游戏参数
    const gridSize = 20; // 格子大小
    const initialSpeed = 150; // 初始速度（毫秒）
    let gameInterval; // 游戏循环定时器
    let gameRunning = false;
    
    // 彩色配置
    const snakeColors = [
        '#FF5252', // 红色
        '#FF9800', // 橙色
        '#FFEB3B', // 黄色
        '#4CAF50', // 绿色
        '#2196F3', // 蓝色
        '#9C27B0', // 紫色
        '#E91E63'  // 粉色
    ];
    
    // 游戏状态
    let snake = [];
    let snakeColor;
    let direction;
    let nextDirection;
    let food = {};
    let specialFood = null;
    let score;
    let eatenFoodCount;
    let isSnakeSplit = false;
    let highscore = localStorage.getItem('snakeHighscore') || 0;
    highscoreElement.textContent = highscore;
    
    // 初始化游戏
    function initGame() {
        // 初始化蛇
        snake = [
            {x: 10 * gridSize, y: 10 * gridSize}
        ];
        
        // 随机设置蛇的颜色
        snakeColor = getRandomColor();
        
        // 设置初始方向
        direction = 'right';
        nextDirection = 'right';
        
        // 生成食物
        generateFood();
        
        // 初始化分数和计数器
        score = 0;
        eatenFoodCount = 0;
        scoreElement.textContent = score;
        
        // 移除特殊食物
        specialFood = null;
        
        // 重置分裂状态
        isSnakeSplit = false;
        
        // 开始游戏循环
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, initialSpeed);
        gameRunning = true;
    }
    
    // 游戏主循环
    function gameLoop() {
        update();
        draw();
    }
    
    // 更新游戏状态
    function update() {
        // 更新方向
        direction = nextDirection;
        
        // 获取蛇头位置
        const head = {...snake[0]};
        
        // 根据方向更新蛇头位置
        switch (direction) {
            case 'up':
                head.y -= gridSize;
                break;
            case 'down':
                head.y += gridSize;
                break;
            case 'left':
                head.x -= gridSize;
                break;
            case 'right':
                head.x += gridSize;
                break;
        }
        
        // 检测碰撞墙壁
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            endGame();
            return;
        }
        
        // 检测碰撞自身
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                endGame();
                return;
            }
        }
        
        // 将新的头部添加到蛇身前端
        snake.unshift(head);
        
        // 检测吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 生成新的食物
            generateFood();
            
            // 增加食物计数器
            eatenFoodCount++;
            
            // 每吃4个蛋随机变色
            if (eatenFoodCount % 4 === 0) {
                snakeColor = getRandomColor();
            }
            
            // 每吃5个蛋长度减少三分之一
            if (eatenFoodCount % 5 === 0 && snake.length > 3) {
                const reductionLength = Math.floor(snake.length / 3);
                snake = snake.slice(0, snake.length - reductionLength);
            }
            
            // 每吃6个蛋生成特殊食物
            if (eatenFoodCount % 6 === 0) {
                generateSpecialFood();
            }
        } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
            // 处理吃到特殊食物
            handleSpecialFood();
            specialFood = null;
        } else {
            // 没吃到食物，移除尾部
            snake.pop();
        }
    }
    
    // 绘制游戏
    function draw() {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        for (let i = 0; i < snake.length; i++) {
            // 为蛇身绘制渐变色
            const segment = snake[i];
            
            ctx.fillStyle = i === 0 ? darkenColor(snakeColor) : snakeColor;
            
            // 如果蛇分裂，在中间段添加一点间隔
            if (isSnakeSplit && i === Math.floor(snake.length / 2)) {
                ctx.globalAlpha = 0.5;
            } else {
                ctx.globalAlpha = 1;
            }
            
            // 圆形蛇身
            ctx.beginPath();
            ctx.arc(segment.x + gridSize/2, segment.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 恢复透明度
            ctx.globalAlpha = 1;
        }
        
        // 绘制食物
        ctx.fillStyle = '#FF5252';
        ctx.beginPath();
        ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制特殊食物
        if (specialFood) {
            // 创建彩虹渐变
            const gradient = ctx.createRadialGradient(
                specialFood.x + gridSize/2, specialFood.y + gridSize/2, 0,
                specialFood.x + gridSize/2, specialFood.y + gridSize/2, gridSize
            );
            gradient.addColorStop(0, "yellow");
            gradient.addColorStop(0.25, "orange");
            gradient.addColorStop(0.5, "red");
            gradient.addColorStop(0.75, "purple");
            gradient.addColorStop(1, "blue");
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(specialFood.x + gridSize/2, specialFood.y + gridSize/2, gridSize/1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加星光效果
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            const time = Date.now() / 200;
            const size = 3 + Math.sin(time) * 2;
            
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2) + time / 3;
                const distance = 8 + Math.sin(time * 1.5) * 2;
                
                const startX = specialFood.x + gridSize/2 + Math.cos(angle) * distance;
                const startY = specialFood.y + gridSize/2 + Math.sin(angle) * distance;
                const endX = specialFood.x + gridSize/2 + Math.cos(angle) * (distance + size);
                const endY = specialFood.y + gridSize/2 + Math.sin(angle) * (distance + size);
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
    
    // 生成普通食物
    function generateFood() {
        food = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
        };
        
        // 确保食物不会出现在蛇身上
        for (let i = 0; i < snake.length; i++) {
            if (food.x === snake[i].x && food.y === snake[i].y) {
                generateFood();
                return;
            }
        }
    }
    
    // 生成特殊食物
    function generateSpecialFood() {
        specialFood = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
            type: Math.floor(Math.random() * 3) // 0: 分数加倍, 1: 蛇头蛇身互换, 2: 蛇分裂
        };
        
        // 确保特殊食物不会出现在蛇身上或普通食物上
        for (let i = 0; i < snake.length; i++) {
            if ((specialFood.x === snake[i].x && specialFood.y === snake[i].y) || 
                (specialFood.x === food.x && specialFood.y === food.y)) {
                generateSpecialFood();
                return;
            }
        }
    }
    
    // 处理特殊食物效果
    function handleSpecialFood() {
        switch (specialFood.type) {
            case 0: // 分数加倍
                score *= 2;
                scoreElement.textContent = score;
                displayEffect("分数加倍！");
                break;
                
            case 1: // 蛇头蛇身互换
                snake.reverse();
                
                // 设置新的方向（原来的反方向）
                switch (direction) {
                    case 'up': nextDirection = 'down'; break;
                    case 'down': nextDirection = 'up'; break;
                    case 'left': nextDirection = 'right'; break;
                    case 'right': nextDirection = 'left'; break;
                }
                
                displayEffect("蛇头蛇身互换！");
                break;
                
            case 2: // 蛇分裂
                isSnakeSplit = !isSnakeSplit;
                displayEffect("蛇分裂！");
                break;
        }
    }
    
    // 显示效果提示
    function displayEffect(message) {
        const effect = document.createElement('div');
        effect.textContent = message;
        effect.style.position = 'absolute';
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.background = 'rgba(0,0,0,0.7)';
        effect.style.color = 'white';
        effect.style.padding = '10px 20px';
        effect.style.borderRadius = '20px';
        effect.style.fontWeight = 'bold';
        effect.style.fontSize = '24px';
        effect.style.zIndex = '10';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(effect);
            }, 500);
        }, 1500);
    }
    
    // 结束游戏
    function endGame() {
        gameRunning = false;
        clearInterval(gameInterval);
        
        // 更新最高分
        if (score > highscore) {
            highscore = score;
            localStorage.setItem('snakeHighscore', highscore);
            highscoreElement.textContent = highscore;
        }
        
        // 显示游戏结束界面
        finalScoreElement.textContent = score;
        gameOverElement.style.display = 'flex';
        restartBtn.style.display = 'block';
        startBtn.style.display = 'none';
    }
    
    // 随机颜色
    function getRandomColor() {
        return snakeColors[Math.floor(Math.random() * snakeColors.length)];
    }
    
    // 颜色加深函数（用于蛇头）
    function darkenColor(color) {
        // 如果是十六进制颜色代码
        if (color.startsWith('#')) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            
            r = Math.max(0, r - 40);
            g = Math.max(0, g - 40);
            b = Math.max(0, b - 40);
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch (e.key) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                e.preventDefault();
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                e.preventDefault();
                break;
        }
    });
    
    // 按钮事件
    startBtn.addEventListener('click', () => {
        initGame();
        startBtn.style.display = 'none';
        restartBtn.style.display = 'block';
    });
    
    restartBtn.addEventListener('click', () => {
        initGame();
    });
    
    playAgainBtn.addEventListener('click', () => {
        gameOverElement.style.display = 'none';
        initGame();
    });
});