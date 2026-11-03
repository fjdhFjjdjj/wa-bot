const { default: makeWASocket, useMultiFileAuthState, Browsers } = require("@whiskeysockets/baileys")
const P = require("pino")
const fs = require("fs")
let chats = {}
try { chats = JSON.parse(fs.readFileSync('./chats.json','utf8')) } catch(e){ chats = {} }
function save(){ fs.writeFileSync('./chats.json', JSON.stringify(chats)) }
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, browser: Browsers.ubuntu("Chrome"), syncFullHistory: false, logger: P({ level: 'silent' }) })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', c => { if(c.connection === 'open') console.log("شغال"); if(c.connection === 'close') start() })
  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if(!msg.message || msg.key.remoteJid.includes("@g.us")) return
    const from = msg.key.remoteJid
    if(msg.key.fromMe){ chats[from]=null; save(); return }
    const now = Date.now()
    if(!chats[from]) chats[from] = { count: 0, lastTime: 0 }
    if(now - chats[from].lastTime > 10*60*1000) chats[from].count = 0
    chats[from].count += 1
    chats[from].lastTime = now
    save()
    if(chats[from].count === 1) await sock.sendMessage(from, { text: "مرحبا\nنقدر نساعدك بايه؟" })
    else if(chats[from].count === 2) await sock.sendMessage(from, { text: "استنى على ما صاحب الشغل يرد عليك" })
    else if(chats[from].count === 3) await sock.sendMessage(from, { text: "بعد اذنك استنى خمس دقايق" })
  })
}
start()
