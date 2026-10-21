const express = require('express');
const https = require('https');
const http = require('http');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ১. অ্যাকাউন্ট, সেশন এবং টার্মিনাল লগ ডেটা স্টোরেজ
let registeredAccounts = {};
let activeSessions = new Set();
let terminalLogs = [];

function addTerminalLog(type, endpoint, ip) {
    let time = new Date().toLocaleTimeString();
    let logMessage = `[${time}] [${type.toUpperCase()}] Request to -> ${endpoint} (IP: ${ip}) Success [200 OK]`;
    terminalLogs.unshift(logMessage);
    if (terminalLogs.length > 50) terminalLogs.pop();
}

// ২. ডাইনামিক ইভেন্ট লুপ কনফিগারেশন (অটো-রিস্টার্ট সাইকেল)
let eventStartTime = Date.now();
let eventDurationDays = 7; 
let eventDurationMs = eventDurationDays * 24 * 60 * 60 * 1000;

function getCurrentEventStatus() {
    let now = Date.now();
    let elapsed = now - eventStartTime;
    
    if (elapsed >= eventDurationMs) {
        eventStartTime = now;
        elapsed = 0;
    }

    let timeLeft = eventDurationMs - elapsed;
    return {
        event_name: "Ultimate Free Fire Update Event Loop",
        status: "active",
        start_timestamp: eventStartTime,
        end_timestamp: eventStartTime + eventDurationMs,
        time_remaining_ms: timeLeft,
        is_looped: true
    };
}

// ৩. টার্মিনাল স্টাইল লাইভ ড্যাশবোর্ড
app.get('/live/', (req, res) => {
    let totalAccounts = Object.keys(registeredAccounts).length;
    let activeCount = activeSessions.size;
    let inactiveCount = totalAccounts > activeCount ? totalAccounts - activeCount : 0;
    let serverAddress = req.protocol + '://' + req.get('host') + req.originalUrl;

    addTerminalLog('GET', '/live/', req.ip || '127.0.0.1');

    const htmlDashboard = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Free Fire v1.70.0 - Termux Live Dashboard</title>
        <style>
            body { font-family: 'Courier New', Courier, monospace; background: #090d16; color: #00ff66; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .card { background: #111827; border: 1px solid #1f2937; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            h1 { color: #38bdf8; text-align: center; font-size: 22px; }
            .status-dot { height: 12px; width: 12px; background-color: #22c55e; border-radius: 50%; display: inline-block; animation: blink 1s infinite; box-shadow: 0 0 8px #22c55e; }
            @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
            .stat { font-size: 20px; font-weight: bold; color: #facc15; }
            .url-box { background: #1f2937; padding: 8px; border-radius: 4px; word-break: break-all; color: #38bdf8; font-size: 14px; }
            .terminal { background: #000000; border: 1px solid #374151; padding: 15px; border-radius: 6px; height: 250px; overflow-y: scroll; font-size: 13px; color: #00ff66; text-align: left; }
            .log-line { margin: 4px 0; border-bottom: 1px dashed #111; }
        </style>
        <script>
            setTimeout(() => { location.reload(); }, 5000);
        </script>
    </head>
    <body>
        <div class="container">
            <h1><span class="status-dot"></span> FREE FIRE PRIVATE SERVER - LIVE DASHBOARD</h1>
            <div class="card">
                <h3>Server Status: <span style="color: #22c55e;">RUNNING & ACTIVE (24/7)</span></h3>
                <p>Total Accounts: <span class="stat">${totalAccounts}</span> | Active: <span class="stat" style="color: #38bdf8;">${activeCount}</span> | Inactive: <span class="stat" style="color: #f87171;">${inactiveCount}</span></p>
            </div>
            <div class="card">
                <h3>Backend Server Address (For localConfig.json)</h3>
                <div class="url-box">${serverAddress}</div>
            </div>
            <div class="card">
                <h3>🖥️ Termux Style Request Console (Live Player Requests)</h3>
                <div class="terminal">
                    ${terminalLogs.length === 0 ? '<div class="log-line">> Waiting for incoming player requests...</div>' : terminalLogs.map(log => `<div class="log-line">> ${log}</div>`).join('')}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    res.send(htmlDashboard);
});

// ৪. গেস্ট লগইন ও ভেরিফিকেশন ফিক্সড হ্যান্ডলার (অনবরত লোডিং ও ভেরিফিকেশন এরর সমাধান)
app.all(['/live/login', '/live/account/login', '/live/guest_login', '/live/auth/*'], (req, res) => {
    let uid = "100001";
    addTerminalLog('POST', req.path, req.ip || 'Client');
    
    if (!registeredAccounts[uid]) {
        registeredAccounts[uid] = {
            uid: uid,
            nickname: "ProPlayer",
            diamond: 999999,
            gold: 50000,
            level: 70,
            equipped_items: [101, 201, 501]
        };
    }

    activeSessions.add(uid);
    setTimeout(() => { activeSessions.delete(uid); }, 15 * 60 * 1000);

    // ভেরিফিকেশন ও ইনফিনিট লোডিং বাইপাস করার জন্য পূর্ণাঙ্গ অথেনটিকেশন ডাটা
    res.status(200).json({
        code: 0,
        result: 0,
        status: 200,
        msg: "Success",
        open_id: "ff_guest_100001",
        token: "ff_session_token_bypass_100001",
        session_key: "ff_active_session_100001",
        account_info: registeredAccounts[uid],
        user_info: {
            uid: 100001,
            nickname: "ProPlayer",
            diamond: 999999,
            gold: 50000,
            exp: 999999
        }
    });
});

// ৫. মেইলবক্স সিস্টেম
app.all(['/live/mail', '/live/mailbox', '/live/get_mail', '/live/send_gift'], (req, res) => {
    addTerminalLog('POST', req.path, req.ip || 'Client');
    res.status(200).json({
        code: 200,
        success: true,
        mails: [
            {
                mail_id: 1,
                title: "Server & Group Gift Hub",
                content: "Claim your diamonds, gold, and shared gifts securely!",
                items: [
                    { id_item: 101, count: 50000 },
                    { id_item: 102, count: 10000 }
                ],
                is_received: false
            }
        ],
        msg: "Gift sent and received successfully in group/mailbox."
    });
});

// ৬. গিল্ড (Guild) সিস্টেম
app.all(['/live/guild', '/live/clan', '/live/create_guild'], (req, res) => {
    addTerminalLog('POST', req.path, req.ip || 'Client');
    res.status(200).json({
        code: 200,
        success: true,
        guild_info: {
            guild_id: 888888,
            guild_name: "EliteBDClan",
            level: 4,
            leader: "ProPlayer",
            members_count: 32,
            msg: "Guild created and loaded successfully."
        }
    });
});

// ৭. ইন-গেম স্টোর
app.all(['/live/shop', '/live/store', '/live/item/buy'], (req, res) => {
    addTerminalLog('POST', req.path, req.ip || 'Client');
    res.status(200).json({
        code: 200,
        success: true,
        store_items: [
            { item_id: 501, name: "Current Update Bundle", price_diamond: 99, currency: "diamond" },
            { item_id: 502, name: "Elite Pass Bundle", price_diamond: 199, currency: "diamond" }
        ],
        msg: "Success"
    });
});

// ৮. ইনস্ট্যান্ট ম্যাচ মেকিং ও বট (NPC) লবি হ্যান্ডলার
app.all(['/live/match', '/live/room', '/live/mode', '/live/matchmaking', '/live/start_game'], (req, res) => {
    addTerminalLog('POST', req.path, req.ip || 'Client');
    res.status(200).json({
        code: 200,
        status: "matched",
        match_id: "match_" + Date.now(),
        instant_start: true, 
        queue_time: 0,
        bots_enabled: true,  
        max_players: 50,
        map: "Bermuda",
        msg: "Instant match started successfully with NPC bots in all modes."
    });
});

// ৯. লাইভ ইভেন্ট লুপ হ্যান্ডলার
app.all(['/live/event', '/live/events', '/live/get_events', '/live/activity'], (req, res) => {
    addTerminalLog('GET', req.path, req.ip || 'Client');
    let eventData = getCurrentEventStatus();
    res.status(200).json({
        code: 200,
        success: true,
        current_event: eventData,
        rewards: [
            { event_id: 301, name: "Top-up Diamond Event", progress: 100, claimed: false },
            { event_id: 302, name: "Free Play Rewards", progress: 100, claimed: false }
        ],
        msg: "Event loop running smoothly."
    });
});

// ১০. অফিসিয়াল সিডিএন ও প্যাচ বাইপাস (রিসোর্স প্যাক ও ডাউনলোডের জন্য)
app.all(['/live/versioncheck', '/live/patch/*', '/live/config/*', '/live/cdn/*', '/live/res/*'], (req, res) => {
    addTerminalLog('GET', req.path, req.ip || 'Client');
    res.status(200).json({
        code: 0,
        status: "success",
        need_update: false,
        cdn_url: "https://client.freefiremobile.com",
        patch_url: "https://dl.freefiremobile.com",
        res_address: "https://freefiremobile-a.akamaihd.net"
    });
});

// ১১. গ্লোবাল ফলব্যাক রুট (যাতে অজানা রিকোয়েস্টে পেজ লোড হয়ে আটকে না থাকে)
app.use((req, res) => {
    addTerminalLog('ALL', req.path, req.ip || 'Client');
    res.status(200).json({
        code: 0,
        status: "ok",
        message: "Request handled successfully"
    });
});

// ১২. ২৪ ঘণ্টা সার্ভার সচল রাখতে অটো-পিং সিস্টেম
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || "https://bd-private-server77.onrender.com/live/";

setInterval(() => {
    const client = RENDER_URL.startsWith('https') ? https : http;
    client.get(RENDER_URL, (res) => {
    }).on('error', (err) => {
    });
}, 7 * 60 * 1000); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Ultimate Server running smoothly on port ${PORT}`);
});
