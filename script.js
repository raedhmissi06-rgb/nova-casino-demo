/**
 * ============================================================================
 * BETMAX ENTERPRISE PLATFORM - CORE JAVASCRIPT ENGINE
 * Version: 4.0.0 Pro
 * Language: ES6+ Pure Vanilla JavaScript
 * ============================================================================
 */

'use strict';

// ==========================================
// 1. GLOBAL STATE MANAGEMENT (إدارة حالة المنصة)
// ==========================================
const AppState = {
    user: {
        isLoggedIn: true,
        username: "HeroUser2026",
        balance: 1450.00,
        bonusBalance: 300.00,
        currency: "TND"
    },
    betslip: {
        type: "single", // 'single' | 'accumulator' | 'system'
        items: [],      // Array of bet objects: { matchId, matchTitle, pick, odd }
        stake: 10,
        acceptOddsChanges: true
    },
    filter: {
        sport: "all",
        league: "all",
        searchQuery: ""
    }
};

// ==========================================
// 2. DOM ELEMENTS SELECTORS (محددات العناصر)
// ==========================================
const DOM = {
    // Clock & Top Bar
    systemClock: document.getElementById('systemClock'),
    
    // Auth & User Panel
    guestActionsGroup: document.getElementById('guestActionsGroup'),
    userLoggedPanel: document.getElementById('userLoggedPanel'),
    userMainBalance: document.getElementById('userMainBalance'),
    
    // Search
    globalSearchInput: document.getElementById('globalSearchInput'),
    
    // Modals & Drawers
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    depositDrawer: document.getElementById('depositDrawer'),
    closeDepositDrawerBtn: document.getElementById('closeDepositDrawer'),
    triggerDepositDrawerBtn: document.getElementById('triggerDepositDrawer'),
    
    // Betslip Elements
    betslipWidget: document.getElementById('betslipWidget'),
    betslipCount: document.getElementById('betslipCount'),
    betslipContainer: document.getElementById('betslipItemsContainer'),
    emptyBetslipState: document.getElementById('emptyBetslipState'),
    betslipTotalOdds: document.getElementById('betslipTotalOdds'),
    betslipStakeInput: document.getElementById('betslipStakeInput'),
    betslipPotentialPayout: document.getElementById('betslipPotentialPayout'),
    placeBetBtn: document.getElementById('placeBetBtn'),
    
    // Canvas Engine
    livePitchCanvas: document.getElementById('livePitchCanvas'),
    pitchEventOverlay: document.getElementById('pitchEventOverlay')
};

// ==========================================
// 3. BETSLIP MANAGER (محرك قسيمة الرهان)
// ==========================================
const BetslipEngine = {
    
    init() {
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        // Event Delegation لأزرار الأودز في كل الصفحة
        document.addEventListener('click', (e) => {
            const oddBtn = e.target.closest('.odd-btn');
            if (oddBtn) {
                this.handleOddClick(oddBtn);
            }

            // حذف رهان محدد من القسيمة
            const removeBtn = e.target.closest('.btn-remove-bet');
            if (removeBtn) {
                const matchId = removeBtn.dataset.matchId;
                this.removeBet(matchId);
            }
        });

        // تغيير مبلغ الرهان
        if (DOM.betslipStakeInput) {
            DOM.betslipStakeInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) || 0;
                AppState.betslip.stake = val;
                this.calculateCalculations();
            });
        }

        // الأزرار السريعة للمبالغ (+5, +10, +50...)
        document.querySelectorAll('.btn-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const addVal = parseFloat(btn.dataset.stake);
                const currentVal = parseFloat(DOM.betslipStakeInput.value) || 0;
                const newVal = currentVal + addVal;
                DOM.betslipStakeInput.value = newVal;
                AppState.betslip.stake = newVal;
                this.calculateCalculations();
            });
        });

        // تغيير نوع الرهان (فردي / تراكمي)
        document.querySelectorAll('.betslip-type-tabs .type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.betslip-type-tabs .type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.betslip.type = btn.dataset.type;
                this.calculateCalculations();
            });
        });

        // زر تأكيد الرهان
        if (DOM.placeBetBtn) {
            DOM.placeBetBtn.addEventListener('click', () => this.placeBet());
        }
    },

    handleOddClick(btn) {
        const matchId = btn.dataset.matchId;
        const matchTitle = btn.dataset.matchTitle;
        const pick = btn.dataset.pick;
        const odd = parseFloat(btn.dataset.odd);

        // التثبت هل المباراة موجودة سابقاً بالقسيمة
        const existingIndex = AppState.betslip.items.findIndex(item => item.matchId === matchId);

        if (existingIndex > -1) {
            // إذا ضغط على نفس الخيار يقوم بإلغائه
            if (AppState.betslip.items[existingIndex].pick === pick) {
                AppState.betslip.items.splice(existingIndex, 1);
                btn.classList.remove('selected');
                ToastSystem.show('تم إزالة الرهان من القسيمة', 'info');
            } else {
                // إذا اختيار آخر لنفس المباراة -> يتم تحديث الخيار
                AppState.betslip.items[existingIndex].pick = pick;
                AppState.betslip.items[existingIndex].odd = odd;
                this.updateOddsButtonSelection(matchId, pick);
                ToastSystem.show('تم تحديث الخيار لهذه المباراة', 'warning');
            }
        } else {
            // إضافة رهان جديد
            AppState.betslip.items.push({ matchId, matchTitle, pick, odd });
            btn.classList.add('selected');
            ToastSystem.show(`تمت إضافة [${pick}] للقسيمة!`, 'success');
        }

        this.render();
    },

    removeBet(matchId) {
        AppState.betslip.items = AppState.betslip.items.filter(item => item.matchId !== matchId);
        
        // إلغاء التحديد البصري من أزرار الصفحة
        document.querySelectorAll(`.odd-btn[data-match-id="${matchId}"]`).forEach(btn => {
            btn.classList.remove('selected');
        });

        this.render();
        ToastSystem.show('تم إزالة المباراة من القسيمة', 'info');
    },

    updateOddsButtonSelection(matchId, selectedPick) {
        document.querySelectorAll(`.odd-btn[data-match-id="${matchId}"]`).forEach(btn => {
            if (btn.dataset.pick === selectedPick) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    },

    calculateCalculations() {
        if (AppState.betslip.items.length === 0) {
            DOM.betslipTotalOdds.textContent = "0.00";
            DOM.betslipPotentialPayout.textContent = "0.00 TND";
            DOM.placeBetBtn.disabled = true;
            return;
        }

        let totalOdds = 1.0;

        if (AppState.betslip.type === "accumulator") {
            // الرهان التراكمي: ضرب كل الاحتمالات في بعضها
            totalOdds = AppState.betslip.items.reduce((acc, item) => acc * item.odd, 1.0);
        } else {
            // الرهان الفردي: مجموع الاحتمالات كمتوسط أو حسب التطبيق
            totalOdds = AppState.betslip.items.reduce((acc, item) => acc + item.odd, 0);
        }

        const payout = totalOdds * AppState.betslip.stake;

        DOM.betslipTotalOdds.textContent = totalOdds.toFixed(2);
        DOM.betslipPotentialPayout.textContent = `${payout.toFixed(2)} ${AppState.user.currency}`;
        DOM.placeBetBtn.disabled = false;
    },

    render() {
        const count = AppState.betslip.items.length;
        DOM.betslipCount.textContent = count;

        if (count === 0) {
            DOM.betslipContainer.innerHTML = `
                <div class="empty-betslip-state">
                    <i class="fa-solid fa-ticket-simple empty-icon"></i>
                    <p>انقر على أي احتمال (Odd) لإضافته مباشرة إلى قسيمة الرهان الخاص بك.</p>
                </div>
            `;
            this.calculateCalculations();
            return;
        }

        // رندر عناصر الرهان المضافة
        DOM.betslipContainer.innerHTML = AppState.betslip.items.map(item => `
            <div class="betslip-card-item">
                <div class="card-item-header flex-between">
                    <span class="match-name">${item.matchTitle}</span>
                    <button class="btn-remove-bet" data-match-id="${item.matchId}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="card-item-body flex-between">
                    <span class="pick-badge">${item.pick}</span>
                    <span class="odd-val-highlight">${item.odd.toFixed(2)}</span>
                </div>
            </div>
        `).join('');

        this.calculateCalculations();
    },

    placeBet() {
        if (AppState.betslip.items.length === 0) return;

        const totalCost = AppState.betslip.stake;
        if (AppState.user.balance < totalCost) {
            ToastSystem.show('رصيدك غير كافي لإجراء هذا الرهان! يرجى الإيداع.', 'error');
            return;
        }

        // خفض الرصيد
        AppState.user.balance -= totalCost;
        DOM.userMainBalance.textContent = AppState.user.balance.toFixed(2);

        // إظهار رسالة النجاح
        ToastSystem.show(`تم قبول الرهان بنجاح! المبلغ: ${totalCost} TND`, 'success');

        // تفريغ القسيمة
        AppState.betslip.items = [];
        document.querySelectorAll('.odd-btn').forEach(btn => btn.classList.remove('selected'));
        this.render();
    }
};

// ==========================================
// 4. LIVE MATCH CANVAS VISUALIZER ENGINE (محرك الملعب ثلاثي الأبعاد)
// ==========================================
const PitchCanvasEngine = {
    canvas: null,
    ctx: null,
    ball: { x: 350, y: 110, targetX: 350, targetY: 110 },
    eventsText: ["هجمة مرتدة سريعة!", "ركنية للترجي", "تمريرة في الوسط", "تسديدة خطيرة!"],

    init() {
        this.canvas = DOM.livePitchCanvas;
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // بدء الحلقة التكرارية للرسم Animation Loop
        this.animate();
        
        // محاكاة تحريك الكرة كل 3 ثواني
        setInterval(() => this.updateBallPosition(), 3000);
    },

    drawPitch() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // خلفية الملعب (عشب أخضر)
        this.ctx.fillStyle = '#1e5128';
        this.ctx.fillRect(0, 0, w, h);

        // رسم خطوط الملعب البيضاء
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;

        // الحدود الخارجية
        this.ctx.strokeRect(10, 10, w - 20, h - 20);

        // خط الوسط
        this.ctx.beginPath();
        this.ctx.moveTo(w / 2, 10);
        this.ctx.lineTo(w / 2, h - 10);
        this.ctx.stroke();

        // دائرة المنتصف
        this.ctx.beginPath();
        this.ctx.arc(w / 2, h / 2, 35, 0, Math.PI * 2);
        this.ctx.stroke();

        // منطقة الجزاء اليسرى واليمنى
        this.ctx.strokeRect(10, h / 2 - 45, 60, 90);
        this.ctx.strokeRect(w - 70, h / 2 - 45, 60, 90);
    },

    drawBall() {
        // LERP الحركة السلسة للكرة
        this.ball.x += (this.ball.targetX - this.ball.x) * 0.05;
        this.ball.y += (this.ball.targetY - this.ball.y) * 0.05;

        // رسم الكرة (دائرة صفراء متميزة)
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
    },

    updateBallPosition() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // توليد موقع عشوائي للكرة داخل الملعب
        this.ball.targetX = Math.random() * (w - 60) + 30;
        this.ball.targetY = Math.random() * (h - 40) + 20;

        // إظهار إشعار حدث على الملعب
        if (DOM.pitchEventOverlay) {
            const randomEvent = this.eventsText[Math.floor(Math.random() * this.eventsText.length)];
            DOM.pitchEventOverlay.innerHTML = `<i class="fa-solid fa-futbol text-gold pulse"></i> ${randomEvent}`;
        }
    },

    animate() {
        this.drawPitch();
        this.drawBall();
        requestAnimationFrame(() => this.animate());
    }
};

// ==========================================
// 5. LIVE ODDS SIMULATOR (محاكي تقلبات الاحتمالات)
// ==========================================
const LiveOddsSimulator = {
    init() {
        // تحديث الأودز كل 5 ثواني لإعطاء واقعية للمنصة
        setInterval(() => this.mutateOdds(), 5000);
    },

    mutateOdds() {
        const oddsBtns = document.querySelectorAll('.odd-btn');
        if (oddsBtns.length === 0) return;

        // اختيار زر أودز عشوائي لتعديله
        const randomBtn = oddsBtns[Math.floor(Math.random() * oddsBtns.length)];
        const currentOdd = parseFloat(randomBtn.dataset.odd);
        
        // تغيّر طفيف (+0.10 أو -0.10)
        const delta = (Math.random() > 0.5 ? 0.08 : -0.08);
        let newOdd = +(currentOdd + delta).toFixed(2);
        if (newOdd < 1.05) newOdd = 1.05;

        randomBtn.dataset.odd = newOdd;
        const valSpan = randomBtn.querySelector('.val');
        
        if (valSpan) {
            valSpan.innerHTML = `${newOdd} ${delta > 0 ? '<i class="fa-solid fa-caret-up text-success"></i>' : '<i class="fa-solid fa-caret-down text-danger"></i>'}`;
        }

        // فلاش لون أخضر أو أحمر
        const flashClass = delta > 0 ? 'flash-green' : 'flash-red';
        randomBtn.classList.add(flashClass);
        setTimeout(() => randomBtn.classList.remove(flashClass), 1500);
    }
};

// ==========================================
// 6. UI MODALS & DRAWER CONTROLLER (التحكم في الواجهات)
// ==========================================
const UIController = {
    init() {
        this.initClock();
        this.bindDrawerEvents();
        this.bindSearchFilter();
    },

    initClock() {
        setInterval(() => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            if (DOM.systemClock) {
                DOM.systemClock.innerHTML = `<i class="fa-regular fa-clock"></i> ${hours}:${minutes}:${seconds} (UTC+1)`;
            }
        }, 1000);
    },

    bindDrawerEvents() {
        // فتح درج الإيداع
        if (DOM.triggerDepositDrawerBtn && DOM.depositDrawer) {
            DOM.triggerDepositDrawerBtn.addEventListener('click', () => {
                DOM.depositDrawer.classList.add('open');
            });
        }

        // إغلاق درج الإيداع
        if (DOM.closeDepositDrawerBtn && DOM.depositDrawer) {
            DOM.closeDepositDrawerBtn.addEventListener('click', () => {
                DOM.depositDrawer.classList.remove('open');
            });
        }
    },

    bindSearchFilter() {
        if (!DOM.globalSearchInput) return;

        DOM.globalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const matches = document.querySelectorAll('.match-row-card');

            matches.forEach(match => {
                const text = match.textContent.toLowerCase();
                if (text.includes(query)) {
                    match.style.display = 'flex';
                } else {
                    match.style.display = 'none';
                }
            });
        });
    }
};

// ==========================================
// 7. TOAST NOTIFICATION SYSTEM (نظام الإشعارات)
// ==========================================
const ToastSystem = {
    show(message, type = 'info') {
        let toastContainer = document.getElementById('appToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'appToastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        
        let bgColor = '#333';
        if (type === 'success') bgColor = '#28a745';
        if (type === 'error') bgColor = '#dc3545';
        if (type === 'warning') bgColor = '#ffc107';

        toast.style.cssText = `
            background: ${bgColor};
            color: #fff;
            padding: 12px 20px;
            border-radius: 6px;
            font-family: 'Tajawal', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeIn 0.3s ease-in-out;
        `;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
};

// ==========================================
// 8. APP INITIALIZATION (تطبيق المنصة)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 BETMAX Platform Engine Initialized.");
    
    // تشغيل جميع المحركات
    BetslipEngine.init();
    PitchCanvasEngine.init();
    LiveOddsSimulator.init();
    UIController.init();
});
