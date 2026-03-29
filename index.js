require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── الرتب والإيموجيات ────────────────────────────────────────────────────────
// غيّر أسماء الرتب لتطابق أسماءها بالضبط في سيرفرك
const RANKS = {
  '🎯': 'Casual',
  '🟤': 'Copper',
  '🥉': 'Bronze',
  '🥈': 'Silver',
  '🥇': 'Gold',
  '💎': 'Platinum',
  '🟢': 'Emerald',
  '💠': 'Diamond',
  '👑': 'Champion',
};

// ID الرسالة اللي سيتفاعل معها الأعضاء — يتحدد بعد إرسال !sendranks
let RANKS_MESSAGE_ID = null;

client.once('ready', () => {
  console.log(`✅ بوت الرتب شغال كـ ${client.user.tag}`);
  client.user.setActivity('اختر رتبتك!', { type: 3 });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const command = message.content.slice(1).trim().toLowerCase();

  // ─── !sendranks — يرسل رسالة الرتب (للأدمن فقط) ──────────────────────────
  if (command === 'sendranks') {
    if (!message.member.permissions.has('Administrator'))
      return message.reply('❌ هذا الأمر للإدارة فقط!');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎮 اختر رتبتك في Rainbow Six Siege')
      .setDescription(
        'تفاعل بالإيموجي المناسب لرتبتك وراح تنحط الرتبة عليك تلقائياً!\n\n' +
        '🎯 — Casual\n' +
        '🟤 — Copper\n' +
        '🥉 — Bronze\n' +
        '🥈 — Silver\n' +
        '🥇 — Gold\n' +
        '💎 — Platinum\n' +
        '🟢 — Emerald\n' +
        '💠 — Diamond\n' +
        '💠 — Diamond\n' +
        '👑 — Champion'
      )
      .setFooter({ text: 'يمكنك تغيير رتبتك في أي وقت' });

    const sent = await message.channel.send({ embeds: [embed] });
    RANKS_MESSAGE_ID = sent.id;

    // أضف الإيموجيات تلقائياً
    for (const emoji of Object.keys(RANKS)) {
      await sent.react(emoji);
    }

    // احذف أمر الأدمن
    message.delete().catch(() => {});
  }
});

// ─── عند إضافة reaction ───────────────────────────────────────────────────────
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.id !== RANKS_MESSAGE_ID) return;

  const roleName = RANKS[reaction.emoji.name];
  if (!roleName) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);
  const role = guild.roles.cache.find(r => r.name === roleName);

  if (!role) {
    console.log(`❌ الرتبة "${roleName}" ما موجودة في السيرفر!`);
    return;
  }

  // أزل رتب اللعبة الثانية قبل ما تضيف الجديدة
  const rankRoles = Object.values(RANKS);
  for (const rName of rankRoles) {
    const r = guild.roles.cache.find(x => x.name === rName);
    if (r && member.roles.cache.has(r.id)) {
      await member.roles.remove(r);
    }
  }

  await member.roles.add(role);
  console.log(`✅ تمت إضافة رتبة ${roleName} لـ ${user.username}`);
});

// ─── عند إزالة reaction ──────────────────────────────────────────────────────
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.id !== RANKS_MESSAGE_ID) return;

  const roleName = RANKS[reaction.emoji.name];
  if (!roleName) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);
  const role = guild.roles.cache.find(r => r.name === roleName);

  if (!role) return;

  await member.roles.remove(role);
  console.log(`🗑️ تمت إزالة رتبة ${roleName} من ${user.username}`);
});

// ─── HTTP Server عشان Railway/Render ─────────────────────────────────────────
const http = require('http');
http.createServer((req, res) => res.end('بوت الرتب شغال!')).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN);
