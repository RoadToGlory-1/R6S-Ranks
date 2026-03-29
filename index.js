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
  'r6_copper': 'Copper',
  'r6_bronze': 'Bronze',
  'r6_silver': 'Silver',
  'r6_gold': 'Gold',
  'r6_platinum': 'Platinum',
  'r6_emerald': 'Emerald',
  'r6_diamond': 'Diamond',
  'r6_champion': 'Champion',
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
        '<:r6_copper:1487845670382469250> — Copper\n' +
        '<:r6_bronze:1487845778637721752> — Bronze\n' +
        '<:r6_silver:1487845814276456518> — Silver\n' +
        '<:r6_gold:1487845830911332555> — Gold\n' +
        '<:r6_platinum:1487845842005004419> — Platinum\n' +
        '<:r6_emerald:1487845850431488040> — Emerald\n' +
        '<:r6_diamond:1487845860791287871> — Diamond\n' +
        '<:r6_champion:1487845885978345472> — Champion'
      )
      .setFooter({ text: 'يمكنك تغيير رتبتك في أي وقت' });

    const sent = await message.channel.send({ embeds: [embed] });
    RANKS_MESSAGE_ID = sent.id;

    // أضف الإيموجيات تلقائياً
    const emojisToReact = [
      '🎯',
      '1487845670382469250',
      '1487845778637721752',
      '1487845814276456518',
      '1487845830911332555',
      '1487845842005004419',
      '1487845850431488040',
      '1487845860791287871',
      '1487845885978345472',
    ];
    for (const emoji of emojisToReact) {
      await sent.react(emoji);
    }

    // احذف أمر الأدمن
    message.delete().catch(() => {});
  }
});

// ─── الـ ID لكل رتبة ──────────────────────────────────────────────────────────
const EMOJI_ID_TO_RANK = {
  '🎯': 'Casual',
  '1487845670382469250': 'Copper',
  '1487845778637721752': 'Bronze',
  '1487845814276456518': 'Silver',
  '1487845830911332555': 'Gold',
  '1487845842005004419': 'Platinum',
  '1487845850431488040': 'Emerald',
  '1487845860791287871': 'Diamond',
  '1487845885978345472': 'Champion',
};

// ─── عند إضافة reaction ───────────────────────────────────────────────────────
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.id !== RANKS_MESSAGE_ID) return;

  const key = reaction.emoji.id || reaction.emoji.name;
  const roleName = EMOJI_ID_TO_RANK[key];
  if (!roleName) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);
  const role = guild.roles.cache.find(r => r.name === roleName);

  if (!role) {
    console.log(`❌ الرتبة "${roleName}" ما موجودة في السيرفر!`);
    return;
  }

  // أزل رتب اللعبة الثانية قبل ما تضيف الجديدة
  const rankRoles = Object.values(EMOJI_ID_TO_RANK);
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

  const key = reaction.emoji.id || reaction.emoji.name;
  const roleName = EMOJI_ID_TO_RANK[key];
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
