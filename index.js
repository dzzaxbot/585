// ✅ مكتبات أساسية
const { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, ChannelType } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');
const Canvas = require('canvas');
require('dotenv').config();

// ✅ إعداد البوت
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: ['CHANNEL', 'MESSAGE']
});

// ✅ إعداد السيرفر المحلي
const app = express();
const port = 3000;
app.use('/images', express.static(path.join(__dirname, 'images')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(port, () => console.log(`[ SERVER ] SH : http://localhost:${port}`));

// ✅ حالة البوت
const statusMessages = ['📌 اكثرو من الاستغفار', '❤️ ولا تنسو ذكر الله'];
const statusTypes = ['dnd', 'idle'];
let currentStatusIndex = 0;
let currentTypeIndex = 0;
function updateStatus() {
  const currentStatus = statusMessages[currentStatusIndex];
  const currentType = statusTypes[currentTypeIndex];
  client.user.setPresence({
    activities: [{ name: currentStatus, type: ActivityType.Custom }],
    status: currentType
  });
  currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
  currentTypeIndex = (currentTypeIndex + 1) % statusTypes.length;
}
function heartbeat() {
  setInterval(() => console.log(`[ HEARTBEAT ] Bot is alive at ${new Date().toLocaleTimeString()}`), 30000);
}

// ✅ كود الترحيب بالصورة
const WELCOME_CHANNEL_ID = '1156212711080857600'; // ← عدل هذا بالمعرف الصحيح

client.on('guildMemberAdd', async member => {
  try {
    const background = await Canvas.loadImage(path.join(__dirname, 'images', 'wellcome322.jpg'));
    const canvas = Canvas.createCanvas(750, 350);
    const ctx = canvas.getContext('2d');

    // الخلفية
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // نص الترحيب (لو حبيت تضيفه)
    ctx.font = '29px sans-serif';
    ctx.fillStyle = '#290000';
    ctx.textAlign = 'center';
    ctx.fillText(`${member.user.username}`, canvas.width / 2, canvas.height - 137);

    // تحميل صورة الأفاتار
    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png' }));

    // قص دائرية للأفاتار
    ctx.save();
    ctx.beginPath();
    ctx.arc(377, 87, 60, 0, Math.PI * 2, true); // ← وسط الدائرة البيضاء في الصورة
    ctx.closePath();
    ctx.clip();

    // رسم الأفاتار في المكان الصحيح
    ctx.drawImage(avatar, 317, 27, 120, 120);
    ctx.restore();

    // إرسال الصورة
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

    if (channel && channel.type === ChannelType.GuildText) {
      await channel.send({ content: `👋 مرحبا بيك لعزيز ${member}`, files: [attachment] });
    } else {
      console.warn('⚠️ لم يتم العثور على غرفة الترحيب أو نوعها غير نصي.');
    }
  } catch (error) {
    console.error('❌ خطأ أثناء إرسال رسالة الترحيب:', error);
  }
});

// ✅ عند تشغيل البوت
client.once('ready', async () => {
  console.log(`✅ البوت جاهز: ${client.user.tag}`);
  updateStatus();
  setInterval(updateStatus, 10000);
  heartbeat();

  const slashCommands = [
    new SlashCommandBuilder().setName('ping').setDescription('رد بسيط لاختبار البوت'),
    new SlashCommandBuilder()
      .setName('deleteone')
      .setDescription('🧹 حذف رسالة واحدة من عضو معين')
      .addUserOption(option => option.setName('العضو').setDescription('اختر العضو').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString()),
    new SlashCommandBuilder()
      .setName('deleteall')
      .setDescription('🧹 حذف كل رسائل عضو من كل الغرف')
      .addUserOption(option => option.setName('العضو').setDescription('اختر العضو').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString()),
    new SlashCommandBuilder()
      .setName('deletebotmessages')
      .setDescription('🧹 حذف جميع رسائل البوت من جميع الغرف')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString()),
    new SlashCommandBuilder()
      .setName('clearallmessages')
      .setDescription('🧹 حذف كل الرسائل في الغرفة الحالية')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString()),
    new SlashCommandBuilder()
      .setName('refreshstatus')
      .setDescription('♻️ تحديث حالة البوت يدويًا')
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    console.log('✅ تم تسجيل أوامر Slash بنجاح.');
  } catch (error) {
    console.error('❌ فشل في تسجيل أوامر Slash:', error);
  }
});

// ✅ ردود تلقائية + تفاعل مع الصور ويوتيوب
client.on('messageCreate', async message => {
  // ✅ تعريف الغرف المسموح بها إرسال الروابط فيها
const allowedChannels = ['1301158588395290665', '1215038154286047356', '1215074186058272778', '1232453279904960512']; // ضع هنا معرفات القنوات المسموح بها

// ✅ الحدث messageCreate لمراقبة الرسائل
client.on('messageCreate', async message => {
  if (message.author.bot) return; // تجاهل رسائل البوتات
  if (allowedChannels.includes(message.channel.id)) return; // إذا كانت الغرفة مسموح بها، تجاهل

  // تحقق إذا الرسالة تحتوي على رابط
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  if (urlRegex.test(message.content)) {
    try {
      // أولًا: أعطاء Timeout لمدة 5 دقائق (300 ثانية)
      await message.member.timeout(5 * 60 * 1000, 'إرسال روابط ممنوعة');

      // ثانيًا: حذف الرسالة التي تحتوي على الرابط
      await message.delete();

      // ثالثًا: إرسال تحذير خاص له (اختياري)
      await message.channel.send({ content: `⚠️ ${message.author}   😐 ياودي روح تلعب بعيد.` });

      console.log(`⏳ تم إعطاء Timeout وحذف الرسالة لـ ${message.author.tag} بسبب إرسال رابط.`);
    } catch (error) {
      console.error('❌ خطأ أثناء محاولة إعطاء Timeout أو حذف الرسالة:', error);
    }
  }
});

if (message.author.bot) return;
  const content = message.content.toLowerCase();

  // ردود تلقائية
  if (content.includes('سلام')) message.reply('وعليكم السلام ورحمة الله وبركاته 🌸');
  if (content.includes('كيفك') || content.includes('أخبارك')) message.reply('الحمد لله بخير! وأنت؟ 😊');
  if (content.includes('بوت')) message.reply('أنا هنا في خدمتك 🤖');
  if (content.includes('ديزاكس')) message.reply('اذا رد عليك البوت  فعلم انني لست  في الديسكورد اتركلي رسالة في الخاص و انشاء الله رايح نرد عليك');

  // تفاعل مع صور وفيديوهات وGIF
  if (message.attachments.size > 0 || message.embeds.some(e => e.image || e.video)) {
    const emojis = ['minecraftheart', 'emoji_6', 'peeposit69', 'all', 'salchicha55', 'orangealert'];
    for (const emojiName of emojis) {
      const emoji = message.guild.emojis.cache.find(e => e.name === emojiName);
      if (emoji) {
        try { await message.react(emoji); } catch (e) { console.warn(`⚠️ خطأ في ${emojiName}`); }
      }
    }
  }

  // تفاعل مع روابط يوتيوب
  const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/\S+/gi;
  if (youtubeRegex.test(content)) {
    const emojis = ['minecraftheart', 'emoji_6', 'peeposit69', 'all', 'salchicha55', 'orangealert'];
    for (const emojiName of emojis) {
      const emoji = message.guild.emojis.cache.find(e => e.name === emojiName);
      if (emoji) {
        try { await message.react(emoji); } catch (e) { console.warn(`⚠️ خطأ في ${emojiName}`); }
      }
    }
  }
});

// ✅ أوامر Slash
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const { commandName } = interaction;
    // تحقق أن المستخدم هو فقط المسموح له
    const OWNER_ID = '957969430145560626';
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: '❌ ليس لديك صلاحية استخدام هذا الأمر.', ephemeral: true });
    }
  

  try {
    if (commandName === 'ping') return interaction.reply('🏓 Pong! البوت شغال ✅');

    if (commandName === 'deleteone') {
      const member = interaction.options.getUser('العضو');
      const messages = await interaction.channel.messages.fetch({ limit: 50 });
      const targetMsg = messages.find(msg => msg.author.id === member.id);
      if (targetMsg) {
        await targetMsg.delete();
        return interaction.reply({ content: `🗑️ تم حذف رسالة واحدة من ${member.tag}`, ephemeral: true });
      } else {
        return interaction.reply({ content: '❌ لم يتم العثور على رسالة لهذا العضو.', ephemeral: true });
      }
    }

    if (commandName === 'deleteall') {
      const member = interaction.options.getUser('العضو');
      await interaction.reply({ content: `🔄 جاري حذف رسائل ${member.tag}...`, ephemeral: true });
      let totalDeleted = 0;
      for (const [, channel] of interaction.guild.channels.cache) {
        if (channel.isTextBased() && channel.viewable && channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'ReadMessageHistory', 'ManageMessages'])) {
          try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const userMessages = messages.filter(msg => msg.author.id === member.id && (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
            const deleted = await channel.bulkDelete(userMessages, true);
            totalDeleted += deleted.size;
          } catch {}
        }
      }
      await interaction.followUp({ content: `✅ تم حذف ${totalDeleted} رسالة.`, ephemeral: true });
    }

    if (commandName === 'deletebotmessages') {
      await interaction.reply({ content: '🔄 حذف رسائل البوت...', ephemeral: true });
      let totalDeleted = 0;
      for (const [, channel] of interaction.guild.channels.cache) {
        if (channel.isTextBased() && channel.viewable && channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'ReadMessageHistory', 'ManageMessages'])) {
          try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const botMessages = messages.filter(msg => msg.author.id === client.user.id && (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
            const deleted = await channel.bulkDelete(botMessages, true);
            totalDeleted += deleted.size;
          } catch {}
        }
      }
      await interaction.followUp({ content: `✅ تم حذف ${totalDeleted} من رسائل البوت.`, ephemeral: true });
    }

    if (commandName === 'clearallmessages') {
      await interaction.reply({ content: '🧹 حذف كل الرسائل...', ephemeral: true });
      let deletedCount = 0;
      let lastId;
      while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;
        const messages = await interaction.channel.messages.fetch(options);
        if (messages.size === 0) break;
        const deletable = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
        await interaction.channel.bulkDelete(deletable, true);
        deletedCount += deletable.size;
        lastId = messages.last().id;
      }
      await interaction.followUp({ content: `✅ تم حذف ${deletedCount} رسالة.`, ephemeral: true });
    }

    if (commandName === 'refreshstatus') {
      updateStatus();
      return interaction.reply({ content: '♻️ تم تحديث حالة البوت.', ephemeral: true });
    }
  } catch (error) {
    console.error(`❌ خطأ في تنفيذ الأمر ${commandName}:`, error);
    return interaction.reply({ content: '❌ حصل خطأ أثناء تنفيذ الأمر.', ephemeral: true });
  }
});

// ✅ تشغيل البوت
client.login(process.env.TOKEN);
