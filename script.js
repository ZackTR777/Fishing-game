class FishingGame {
    constructor() {
        this.currentUser = null;
        this.isGuest = false;
        this.gameData = {
            money: 100,
            score: 0,
            inventory: {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            },
            upgrades: {
                rod: 1,
                bait: 1,
                line: 1
            },
            fishingState: 'idle',
            chatUnread: 0
        };
        
        this.prices = {
            common: 10,
            rare: 50,
            epic: 200,
            legendary: 1000,
            rod: 500,
            bait: 200,
            line: 300
        };
        
        this.leaderboard = [];
        this.chatMessages = [];
        this.unreadMessages = 0;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadMockData();
        this.updateChatBadge();
    }
    
    bindEvents() {
        // Login events
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('registerBtn').addEventListener('click', () => this.register());
        document.getElementById('playAsGuest').addEventListener('click', () => this.playAsGuest());
        
        // Game events
        document.getElementById('castBtn').addEventListener('click', () => this.castLine());
        document.getElementById('reelBtn').addEventListener('click', () => this.reelIn());
        document.getElementById('sellAllBtn').addEventListener('click', () => this.sellAllFish());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Modal events
        document.getElementById('openChat').addEventListener('click', () => this.openChat());
        document.getElementById('openLeaderboard').addEventListener('click', () => this.openLeaderboard());
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        // Shop events
        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', (e) => this.buyUpgrade(e.target.dataset.item));
        });
        
        // Chat events
        document.getElementById('sendMessage').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Leaderboard tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchLeaderboardTab(e.target.dataset.tab));
        });
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveGame(), 30000);
    }
    
    loadMockData() {
        // Mock users for testing
        const mockUsers = [
            { username: 'fisher1', password: '123', score: 1500, money: 450 },
            { username: 'pro_fisher', password: '123', score: 3200, money: 1200 },
            { username: 'catch_master', password: '123', score: 5400, money: 2500 }
        ];
        
        localStorage.setItem('fishing_users', JSON.stringify(mockUsers));
        
        // Mock leaderboard
        this.leaderboard = mockUsers.map(user => ({
            username: user.username,
            score: user.score,
            rank: 0
        })).sort((a, b) => b.score - a.score);
        
        // Add mock chat messages
        this.chatMessages = [
            { username: 'System', message: 'Welcome to Fishing Adventure!', time: '10:00', type: 'system' },
            { username: 'pro_fisher', message: 'Just caught a legendary fish!', time: '10:05', type: 'other' },
            { username: 'catch_master', message: 'Anyone wants to trade bait?', time: '10:10', type: 'other' }
        ];
    }
    
    login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        if (!username || !password) {
            this.showError('Please enter username and password');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('fishing_users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            this.loadGameData();
            this.showGameScreen();
            this.showMessage(`Welcome back, ${username}!`);
        } else {
            this.showError('Invalid username or password');
        }
    }
    
    register() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showError('Please enter username and password');
            return;
        }
        
        if (username.length < 3) {
            this.showError('Username must be at least 3 characters');
            return;
        }
        
        if (password.length < 3) {
            this.showError('Password must be at least 3 characters');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('fishing_users') || '[]');
        
        if (users.some(u => u.username === username)) {
            this.showError('Username already exists');
            return;
        }
        
        const newUser = {
            username,
            password,
            score: 0,
            money: 100,
            inventory: { common: 0, rare: 0, epic: 0, legendary: 0 },
            upgrades: { rod: 1, bait: 1, line: 1 },
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('fishing_users', JSON.stringify(users));
        
        this.currentUser = newUser;
        this.gameData = { ...newUser };
        this.showGameScreen();
        this.showMessage(`Account created! Welcome ${username}!`);
    }
    
    playAsGuest() {
        this.currentUser = {
            username: 'Guest_' + Math.floor(Math.random() * 10000),
            score: 0,
            money: 100,
            isGuest: true
        };
        
        this.isGuest = true;
        this.showGameScreen();
        this.showMessage('Playing as guest. Data will not be saved!');
    }
    
    showGameScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        this.updateUI();
    }
    
    updateUI() {
        if (!this.currentUser) return;
        
        document.getElementById('playerName').textContent = this.currentUser.username;
        document.getElementById('money').textContent = this.gameData.money;
        document.getElementById('score').textContent = this.gameData.score;
        
        // Update inventory
        document.getElementById('commonCount').textContent = this.gameData.inventory.common;
        document.getElementById('rareCount').textContent = this.gameData.inventory.rare;
        document.getElementById('epicCount').textContent = this.gameData.inventory.epic;
        document.getElementById('legendaryCount').textContent = this.gameData.inventory.legendary;
        
        // Update upgrade prices
        document.querySelectorAll('.shop-item').forEach(item => {
            const upgrade = item.dataset.upgrade;
            const price = this.prices[upgrade] * this.gameData.upgrades[upgrade];
            item.querySelector('.price').textContent = `$${price}`;
            item.querySelector('.btn-buy').textContent = 
                this.gameData.upgrades[upgrade] >= 5 ? 'MAX' : 'Buy';
        });
    }
    
    castLine() {
        if (this.gameData.fishingState !== 'idle') return;
        
        const castBtn = document.getElementById('castBtn');
        const reelBtn = document.getElementById('reelBtn');
        const fishingLine = document.querySelector('.fishing-line');
        
        castBtn.disabled = true;
        this.gameData.fishingState = 'casting';
        
        // Animate casting
        fishingLine.style.height = '0px';
        setTimeout(() => {
            fishingLine.style.height = '150px';
            this.gameData.fishingState = 'waiting';
            
            // Random waiting time
            const waitTime = 1000 + Math.random() * 2000;
            setTimeout(() => {
                if (this.gameData.fishingState === 'waiting') {
                    this.gameData.fishingState = 'fish_on';
                    reelBtn.disabled = false;
                    this.showMessage('Fish is biting! Reel it in!');
                    
                    // Fish escape timer
                    setTimeout(() => {
                        if (this.gameData.fishingState === 'fish_on') {
                            this.gameData.fishingState = 'idle';
                            reelBtn.disabled = true;
                            castBtn.disabled = false;
                            fishingLine.style.height = '0px';
                            this.showMessage('Fish got away!');
                        }
                    }, 3000);
                }
            }, waitTime);
        }, 500);
    }
    
    reelIn() {
        if (this.gameData.fishingState !== 'fish_on') return;
        
        const castBtn = document.getElementById('castBtn');
        const reelBtn = document.getElementById('reelBtn');
        const fishingLine = document.querySelector('.fishing-line');
        
        this.gameData.fishingState = 'idle';
        reelBtn.disabled = true;
        
        // Calculate catch chance based on upgrades
        const baseChance = 0.7;
        const rodBonus = this.gameData.upgrades.rod * 0.05;
        const catchChance = Math.min(baseChance + rodBonus, 0.95);
        
        if (Math.random() < catchChance) {
            this.catchFish();
        } else {
            this.showMessage('Fish got away!');
        }
        
        fishingLine.style.height = '0px';
        castBtn.disabled = false;
    }
    
    catchFish() {
        // Determine fish rarity based on bait level
        const baitBonus = this.gameData.upgrades.bait * 0.05;
        const rand = Math.random();
        
        let fishType;
        if (rand < 0.6) {
            fishType = 'common';
        } else if (rand < 0.85 + baitBonus) {
            fishType = 'rare';
        } else if (rand < 0.95 + baitBonus) {
            fishType = 'epic';
        } else {
            fishType = 'legendary';
        }
        
        // Add to inventory
        this.gameData.inventory[fishType]++;
        
        // Calculate score
        const scoreMap = {
            common: 10,
            rare: 50,
            epic: 200,
            legendary: 1000
        };
        
        const score = scoreMap[fishType];
        this.gameData.score += score;
        
        // Show message
        const messages = {
            common: ['Nice catch! Common fish.', 'Common fish added to inventory.'],
            rare: ['Great! Rare fish!', 'You caught a rare species!'],
            epic: ['Amazing! Epic fish!', 'Epic catch!'],
            legendary: ['LEGENDARY FISH! INCREDIBLE!', 'Once in a lifetime catch! LEGENDARY!']
        };
        
        const fishMessages = messages[fishType];
        const randomMessage = fishMessages[Math.floor(Math.random() * fishMessages.length)];
        this.showMessage(randomMessage);
        
        this.updateUI();
        this.updateLeaderboard();
    }
    
    sellAllFish() {
        let total = 0;
        
        for (const [type, count] of Object.entries(this.gameData.inventory)) {
            if (count > 0) {
                total += count * this.prices[type];
                this.gameData.inventory[type] = 0;
            }
        }
        
        if (total > 0) {
            this.gameData.money += total;
            this.showMessage(`Sold all fish for $${total}!`);
            this.updateUI();
            this.saveGame();
        } else {
            this.showMessage('No fish to sell!');
        }
    }
    
    buyUpgrade(item) {
        const price = this.prices[item] * this.gameData.upgrades[item];
        
        if (this.gameData.money < price) {
            this.showMessage('Not enough money!');
            return;
        }
        
        if (this.gameData.upgrades[item] >= 5) {
            this.showMessage('Maximum level reached!');
            return;
        }
        
        this.gameData.money -= price;
        this.gameData.upgrades[item]++;
        this.gameData.score += price / 10;
        
        this.showMessage(`${item.toUpperCase()} upgraded to level ${this.gameData.upgrades[item]}!`);
        this.updateUI();
        this.saveGame();
    }
    
    openChat() {
        document.getElementById('chatModal').classList.remove('hidden');
        this.updateChatDisplay();
        this.unreadMessages = 0;
        this.updateChatBadge();
    }
    
    openLeaderboard() {
        document.getElementById('leaderboardModal').classList.remove('hidden');
        this.updateLeaderboardDisplay();
    }
    
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
    
    sendChatMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || !this.currentUser) return;
        
        const chatMessage = {
            username: this.currentUser.username,
            message: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'own'
        };
        
        this.chatMessages.push(chatMessage);
        input.value = '';
        
        // Add auto-response
        setTimeout(() => {
            const responses = [
                'Nice catch!',
                'Great fishing spot!',
                'Anyone caught anything big?',
                'I need better bait...',
                'The fish are biting today!'
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            const botMessage = {
                username: 'FishingBot',
                message: randomResponse,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'system'
            };
            
            this.chatMessages.push(botMessage);
            this.updateChatDisplay();
        }, 1000 + Math.random() * 2000);
        
        this.updateChatDisplay();
    }
    
    updateChatDisplay() {
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        
        this.chatMessages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type} ${msg.type === 'own' ? 'own' : 'other'}`;
            
            if (msg.type === 'system') {
                messageDiv.textContent = msg.message;
            } else {
                messageDiv.innerHTML = `
                    <strong>${msg.username}</strong> 
                    <span class="time">${msg.time}</span>
                    <div>${msg.message}</div>
                `;
            }
            
            container.appendChild(messageDiv);
        });
        
        container.scrollTop = container.scrollHeight;
    }
    
    updateChatBadge() {
        document.getElementById('chatBadge').textContent = this.unreadMessages;
    }
    
    updateLeaderboard() {
        if (this.isGuest) return;
        
        const users = JSON.parse(localStorage.getItem('fishing_users') || '[]');
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        
        if (userIndex !== -1) {
            users[userIndex].score = this.gameData.score;
            users[userIndex].money = this.gameData.money;
            localStorage.setItem('fishing_users', JSON.stringify(users));
        }
        
        // Update leaderboard array
        this.leaderboard = users
            .map(user => ({ username: user.username, score: user.score }))
            .sort((a, b) => b.score - a.score);
    }
    
    updateLeaderboardDisplay() {
        const container = document.getElementById('leaderboardList');
        container.innerHTML = '';
        
        this.leaderboard.slice(0, 10).forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            entryDiv.innerHTML = `
                <div class="rank ${index < 3 ? 'rank-' + (index + 1) : ''}">${index + 1}</div>
                <div class="entry-info">
                    <h4>${entry.username}</h4>
                    <p>Top Fisher</p>
                </div>
                <div class="entry-score">${entry.score} pts</div>
            `;
            container.appendChild(entryDiv);
        });
        
        // Update player rank
        const playerRank = this.leaderboard.findIndex(entry => entry.username === this.currentUser?.username) + 1;
        document.getElementById('playerRank').innerHTML = playerRank 
            ? `#${playerRank} - ${this.currentUser.username} (${this.gameData.score} pts)`
            : 'Not ranked';
    }
    
    switchLeaderboardTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        // In a real app, you would fetch different leaderboards here
        this.updateLeaderboardDisplay();
    }
    
    saveGame() {
        if (this.isGuest || !this.currentUser) return;
        
        const users = JSON.parse(localStorage.getItem('fishing_users') || '[]');
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                ...this.gameData
            };
            localStorage.setItem('fishing_users', JSON.stringify(users));
            console.log('Game saved!');
        }
    }
    
    loadGameData() {
        const users = JSON.parse(localStorage.getItem('fishing_users') || '[]');
        const user = users.find(u => u.username === this.currentUser.username);
        
        if (user) {
            this.gameData = {
                money: user.money || 100,
                score: user.score || 0,
                inventory: user.inventory || { common: 0, rare: 0, epic: 0, legendary: 0 },
                upgrades: user.upgrades || { rod: 1, bait: 1, line: 1 },
                fishingState: 'idle',
                chatUnread: 0
            };
        }
    }
    
    logout() {
        this.saveGame();
        this.currentUser = null;
        this.isGuest = false;
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        
        // Clear login fields
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('loginError').style.display = 'none';
    }
    
    showMessage(text) {
        const messageDiv = document.getElementById('gameMessage');
        messageDiv.textContent = text;
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 2000);
    }
    
    showError(text) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = text;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new FishingGame();
});
