/* ==========================================================================
   BETMAX PRO - FULL JAVASCRIPT ENGINE (script.js)
   ========================================================================== */

// 1. STATE & USER DATA
const AppState = {
    balance: 100.00,
    currency: 'TND'
};

// قائمة رموز لعبة الـ Slots
const slotSymbols = ['7️⃣', '💎', '🍒', '🍋', '🔔', '🍇', '⭐'];

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    updateBalanceUI();
    initClock();
});

// 3. UI UPDATES & UTILITIES
function updateBalanceUI() {
    const balanceElem = document.getElementById('userBalanceText');
    if (balanceElem) {
        balanceElem.textContent = AppState.balance.toFixed(2);
    }
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-gold"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function initClock() {
    const clockElem = document.getElementById('clockText');
    if (!clockElem) return;

    setInterval(() => {
        clockElem.textContent = new Date().toLocaleTimeString('ar-TN') + ' (UTC+1)';
    }, 1000);
}

// 4. NAVIGATION & TAB SWITCHING
function switchMainTab(tab) {
    const sportsView = document.getElementById('sportsView');
    const jsSlotView = document.getElementById('jsSlotView');
    const iframeCasinoView = document.getElementById('iframeCasinoView');

    const tabSports = document.getElementById('tabSports');
    const tabJsSlot = document.getElementById('tabJsSlot');
    const tabIframe = document.getElementById('tabIframe');

    // إخفاء جميع الأقسام
    if (sportsView) sportsView.style.display = 'none';
    if (jsSlotView) jsSlotView.style.display = 'none';
    if (iframeCasinoView) iframeCasinoView.style.display = 'none';

    // إلغاء تفعيل جميع الأزرار
    if (tabSports) tabSports.classList.remove('active');
    if (tabJsSlot) tabJsSlot.classList.remove('active');
    if (tabIframe) tabIframe.classList.remove('active');

    // إظهار القسم المحدد وتفعيل زرّه
    if (tab === 'jsSlot' && jsSlotView) {
        jsSlotView.style.display = 'block';
        if (tabJsSlot) tabJsSlot.classList.add('active');
    } else if (tab === 'iframeCasino' && iframeCasinoView) {
        iframeCasinoView.style.display = 'block';
        if (tabIframe) tabIframe.classList.add('active');
    } else if (sportsView) {
        sportsView.style.display = 'block';
        if (tabSports) tabSports.classList.add('active');
    }
}

// 5. INTERACTIVE SLOT MACHINE ENGINE
function spinSlotMachine() {
    const stakeInput = document.getElementById('slotStakeInput');
    const stake = parseFloat(stakeInput?.value) || 0;

    if (stake <= 0) {
        showToast('الرجاء إدخال مبلغ رهان صحيح!');
        return;
    }

    if (stake > AppState.balance) {
        showToast('رصيدك غير كافٍ للعب!');
        return;
    }

    // خصم الرهان من الرصيد
    AppState.balance -= stake;
    updateBalanceUI();

    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    const btnSpin = document.getElementById('btnSpinSlot');

    if (!reel1 || !reel2 || !reel3) return;

    if (btnSpin) btnSpin.disabled = true;

    // إضافة تأثير الدوران
    reel1.classList.add('spinning');
    reel2.classList.add('spinning');
    reel3.classList.add('spinning');

    let counter = 0;
    const spinInterval = setInterval(() => {
        reel1.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        reel2.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        reel3.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        counter++;

        if (counter > 15) {
            clearInterval(spinInterval);

            reel1.classList.remove('spinning');
            reel2.classList.remove('spinning');
            reel3.classList.remove('spinning');

            if (btnSpin) btnSpin.disabled = false;

            // توليد النتيجة النهائية
            const res1 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            const res2 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            const res3 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];

            reel1.textContent = res1;
            reel2.textContent = res2;
            reel3.textContent = res3;

            calculateSlotPayout(res1, res2, res3, stake);
        }
    }, 100);
}

function calculateSlotPayout(s1, s2, s3, stake) {
    let winMultiplier = 0;

    if (s1 === '7️⃣' && s2 === '7️⃣' && s3 === '7️⃣') {
        winMultiplier = 50; // الجائزة الكبرى JackPot
    } else if (s1 === s2 && s2 === s3) {
        winMultiplier = 10; // 3 رموز متشابهة
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        winMultiplier = 2;  // رمزان متشابهان
    }

    if (winMultiplier > 0) {
        const winAmount = stake * winMultiplier;
        AppState.balance += winAmount;
        updateBalanceUI();
        showToast(`🎉 مبروك! كسبت ${winAmount.toFixed(2)} ${AppState.currency} (${winMultiplier}x)`);
    } else {
        showToast('حظاً موفقاً في الدورة القادمة!');
    }
}

// 6. IFRAME GAME SWITCHER (PRAGMATIC / AMATIC)
function changeIframeGame(url) {
    const iframe = document.getElementById('casinoIframe');
    if (iframe) {
        iframe.src = url;
        showToast('جاري تحميل اللعبة الجديدة...');
    }
}
