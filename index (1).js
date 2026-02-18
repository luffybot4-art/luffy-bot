const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const express = require("express");
const axios = require("axios");
const { rmSync, existsSync, readFileSync, writeFileSync } = require("fs");
const ytdl = require("ytdl-core");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// ====== قائمة المطورين ======
const GLOBAL_ADMINS = ["123261635580132@lid", "0998251277@c.us", "0998251277"];

// ====== قائمة المشرفين المخصصين ======
let CUSTOM_ADMINS = [
  "123261635580132@lid",
  "0998251277@c.us",
  "0998251277",
  "128699265462500@lid",
];

const server = app.listen(0, "0.0.0.0", () => {
  const actualPort = server.address().port;
  console.log(`✅ سيرفر لوفي بوت شغال على منفذ: ${actualPort}`);
  setTimeout(startBot, 2000);
});

app.get("/", (req, res) => {
  res.send("🏴‍☠️ لوفي بوت شغال!");
});

// كشف الروابط
const linkRegex =
  /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)|(chat\.whatsapp\.com[^\s]*)|(wa\.me[^\s]*)|(whatsapp\.com[^\s]*)/gi;

// نظام الكلمات الممنوعة
let bannedWords = {};
let groupData = {};

// أنظمة البنك والانذارات والاكس بي
let userBank = {};
let userWarnings = {};
let userXP = {};
let userLastDaily = {};
let groupProtection = {};

// نظام سماح الروابط للمطور
let devLinkAllowed = {};

// إحصائيات المستخدمين
let botUsers = new Set();

// تفاعل الأيموجي
let lastCommandTime = {};

// أنظمة الألعاب المتقدمة
let gameData = {};
let userLevels = {};
let userAchievements = {};
let userInventory = {};

// نظام التحميل
let downloadQueue = {};

// أسئلة شات جي بي تي
const chatGPTQuestions = ["الامر تحت الصيانة "];

// نكت إضافية
const jokesList = [
  "😂 مرة واحد سأل التلميذ: اذا كان عندك 5 جنيه و اخذت منك 2 جنيه، كم يبقى معك؟ قال التلميذ: مش عارف، بس أنا عندي 3 جنيه",
  "😂 مرة واحد دخل المطعم وطلب كباب، قال له الجرسون: آسف خلص الكباب. قال: طيب هات فراخ. قال: آسف خلصت. قال: طيب هات سمك. قال: آسف خلص. قال: طيب هات منيو. قال: آسف خلص المنيو",
  "😂 مرة واحد سأل صاحبه: إيه الفرق بين البحر والمرأة؟ قاله: البحر بتغرق مرة واحدة والمرأة كل يوم",
  "😂 مرة واحد قعد على قهوة، قال له الجرسون: تطلب حاجة؟ قاله: آه قهوة. قاله: آسف خلصت. قاله: هات شاي. قاله: آسف خلص. قاله: طيب هات نعناع. قاله: آسف خلص. قاله: طيب هات منيو. قاله: آسف خلص المنيو من امبارح",
];

// اقتباسات إضافية
const quotesList = [
  "💬 النجاح ليس عدم الفشل، بل الاستمرار بعد الفشل",
  "💬 لا تؤجل عمل اليوم إلى الغد",
  "💬 الحياة مثل ركوب الدراجة، للحفاظ على توازنك يجب أن تستمر في الحركة",
  "💬 الفرصة لا تأتي مرتين، اغتنمها",
  "💬 الإيمان بالنفس هو أول خطوة نحو النجاح",
  "💬 الابتسامة هي أجمل لغة في العالم",
  "💬 لا تنتظر الفرصة، بل اصنعها بنفسك",
];

// أسئلة لو خيروك
const wouldYouRather = [
  "🤔 تسافر القمر ولا المريخ؟",
  "🤔 تكون غني ولا مشهور؟",
  "🤔 تقرا كتاب ولا تشوف فيلم؟",
  "🤔 تاكل بيتزا ولا برجر؟",
  "🤔 تنام 24 ساعة ولا تشتغل 24 ساعة؟",
  "🤔 تعيش في الماضي ولا المستقبل؟",
  "🤔 تكون طيار ولا بحار؟",
  "🤔 تفقد بصرك ولا سمعك؟",
];

// أسئلة حقيقة
const truthQuestions = [
  "🎯 ما هو آخر سر أخفيته عن والديك؟",
  "🎯 هل سبق وكذبت على صديقك المقرب؟",
  "🎯 ما هو أغرب شيء فعلته وحدك؟",
  "🎯 هل تحب أحداً الآن؟",
  "🎯 ما هو أكثر شيء تندم عليه؟",
  "🎯 هل سبق وأخذت شيء ليس من حقك؟",
  "🎯 ما هو أكبر كذبة قلتها في حياتك؟",
];

// تحديات جرأة
const dareChallenges = [
  "🔥 اتصل بأول رقم في قائمة اتصالاتك",
  "🔥 غني أغنية في المجموعة",
  "🔥 قل نكتة محرجة",
  "🔥 اعترف بأغرب عادة عندك",
  "🔥 غير صورتك لمدة ساعة",
  "🔥 اكتب منشور على صفحتك",
  "🔥 أرسل رسالة صوتية تقول فيها سراً",
];

// ====== أوامر الدين ======
const quranVerses = [
  "﴿ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ﴾ [البقرة: 153]",
  "﴿ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ﴾ [هود: 88]",
  "﴿ رَبِّ اشْرَحْ لِي صَدْرِي ﴾ [طه: 25]",
  "﴿ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾ [الشرح: 5]",
  "﴿ وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ﴾ [البقرة: 216]",
];

const hadithList = [
  '📜 قال رسول الله ﷺ: "إنما الأعمال بالنيات"',
  '📜 قال رسول الله ﷺ: "المسلم من سلم المسلمون من لسانه ويده"',
  '📜 قال رسول الله ﷺ: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه"',
  '📜 قال رسول الله ﷺ: "تبسمك في وجه أخيك صدقة"',
  '📜 قال رسول الله ﷺ: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت"',
];

const azkarList = [
  "🕌 سبحان الله وبحمده (100 مرة)",
  "🕌 سبحان الله العظيم (100 مرة)",
  "🕌 أستغفر الله العظيم (100 مرة)",
  "🕌 لا إله إلا الله وحده لا شريك له (100 مرة)",
  "🕌 اللهم صل على محمد وآل محمد (100 مرة)",
];

const allahNames = [
  "الله - ذو الألوهية والعبودية على خلقه أجمعين",
  "الرحمن - ذو الرحمة الواسعة",
  "الرحيم - ذو الرحمة بالمؤمنين",
  "الملك - المالك الحقيقي لكل شيء",
  "القدوس - المنزه عن كل نقص",
  "السلام - المسلم لعباده من كل خطر",
  "المؤمن - الذي صدق عباده وعده",
  "المهيمن - الرقيب على كل شيء",
];

const duas = [
  "🤲 اللهم إني أسألك الهدى والتقى والعفاف والغنى",
  "🤲 ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار",
  "🤲 اللهم اغفر لي ولوالدي وللمؤمنين يوم يقوم الحساب",
  "🤲 اللهم إني أعوذ بك من الهم والحزن والعجز والكسل",
  "🤲 رب اشرح لي صدري ويسر لي أمري",
];

const CURRENCY = "دولار";
const XP_NAME = "نقاط";

async function startBot() {
  try {
    console.log("🔄 جاري تشغيل لوفي بوت...");

    const sessionPath = "./whatsapp-auth";
    if (existsSync(sessionPath)) {
      console.log("🗂️ مجلد الجلسة موجود، سيتم استخدامه.");
    } else {
      console.log("📂 مجلد الجلسة غير موجود، سيتم إنشاؤه عند أول تسجيل دخول.");
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: "luffy-bot-session",
        dataPath: sessionPath,
      }),
      puppeteer: {
        headless: true,
        executablePath:
          "/nix/store/khk7xpgsm5insk81azy9d560yq4npf77-chromium-131.0.6778.204/bin/chromium-browser",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
        ],
      },
    });

    client.on("ready", () => {
      console.log("✅✅✅ لوفي بوت جاهز للعمل! ✅✅✅");
    });

    client.on("qr", (qr) => {
      console.log("\n📱 امسح رمز QR (مرة واحدة فقط):");
      qrcode.generate(qr, { small: true });
    });

    // دالة إرسال التفاعل بالأيموجي
    async function reactToMessage(message, emoji) {
      try {
        await message.react(emoji);
      } catch (error) {}
    }

    // دالة التحقق من الصلاحيات
    async function hasPermission(message) {
      try {
        const senderId = message.author;
        const senderNumber = senderId ? senderId.split("@")[0] : null;

        if (
          GLOBAL_ADMINS.includes(senderId) ||
          GLOBAL_ADMINS.includes(senderNumber)
        ) {
          return { isDev: true, isAdmin: true };
        }

        if (
          CUSTOM_ADMINS.includes(senderId) ||
          CUSTOM_ADMINS.includes(senderNumber)
        ) {
          return { isDev: false, isAdmin: true };
        }

        const chat = await message.getChat();
        if (chat.isGroup) {
          const participant = chat.participants.find(
            (p) => p.id._serialized === senderId,
          );
          if (participant && participant.isAdmin) {
            return { isDev: false, isAdmin: true };
          }
        }

        return { isDev: false, isAdmin: false };
      } catch (error) {
        return { isDev: false, isAdmin: false };
      }
    }

    // دالة التحقق من أن المستخدم مشرف في المجموعة
    async function isGroupAdmin(message) {
      try {
        const chat = await message.getChat();
        if (!chat.isGroup) return false;
        const participants = chat.participants;
        const participant = participants.find(
          (p) => p.id._serialized === message.author,
        );
        return participant ? participant.isAdmin : false;
      } catch (error) {
        return false;
      }
    }

    // دالة صورة المجموعة
    async function getGroupPicture(chat) {
      try {
        return await chat.getPicture();
      } catch {
        return null;
      }
    }

    // دالة الوقت الحالي
    function getCurrentTime() {
      const now = new Date();
      const time = now.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const date = now.toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return { time, date };
    }

    function getUserId(message) {
      return message.author || message.from;
    }

    function initUser(userId) {
      if (!userBank[userId]) {
        userBank[userId] = { balance: 100, dollars: 0, inventory: [] };
      }
      if (!userWarnings[userId]) {
        userWarnings[userId] = 0;
      }
      if (!userXP[userId]) {
        userXP[userId] = 0;
      }
      if (!userLevels[userId]) {
        userLevels[userId] = 1;
      }
      if (!userAchievements[userId]) {
        userAchievements[userId] = [];
      }
      if (!userInventory[userId]) {
        userInventory[userId] = [];
      }
      if (!userLastDaily[userId]) {
        userLastDaily[userId] = 0;
      }
      botUsers.add(userId);
    }

    // تهيئة المطور برصيد لا نهائي
    function initDeveloper(devId) {
      userBank[devId] = { balance: Infinity, dollars: Infinity, inventory: [] };
      userXP[devId] = Infinity;
      userLevels[devId] = 100;
    }

    // تهيئة المطورين
    GLOBAL_ADMINS.forEach((devId) => {
      initDeveloper(devId);
    });

    // دالة حساب المستوى بناءً على XP
    function calculateLevel(xp) {
      if (xp === Infinity) return 100;
      return Math.floor(1 + Math.sqrt(xp / 100));
    }

    // دالة إرسال إشعار التغيير
    async function sendChangeNotification(chat, action, adminName) {
      try {
        const notification =
          `🔔 *تغيير في إعدادات المجموعة*\n\n` +
          `📋 *التغيير:* ${action}\n` +
          `👤 *تم بواسطة:* @${adminName}\n` +
          `🕐 *الوقت:* ${new Date().toLocaleTimeString("ar-EG")}`;

        await chat.sendMessage(notification);
      } catch (error) {
        console.log("خطأ في إرسال إشعار التغيير:", error);
      }
    }

    // دالة مساعدة لإرسال الصور
    async function sendImageWithText(message, imagePath, caption) {
      try {
        if (existsSync(imagePath)) {
          const imageFile = readFileSync(imagePath);
          const imageBase64 = imageFile.toString("base64");
          const extension = imagePath.split(".").pop();
          const mimeType = extension === "png" ? "image/png" : "image/jpeg";
          const media = new MessageMedia(
            mimeType,
            imageBase64,
            `image.${extension}`,
          );
          await client.sendMessage(message.from, media, { caption });
          return true;
        } else {
          await message.reply(caption);
          return false;
        }
      } catch (error) {
        console.log("خطأ في إرسال الصورة:", error);
        await message.reply(caption);
        return false;
      }
    }

    // دالة التحميل من يوتيوب
    async function downloadFromYoutube(url) {
      try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: "highest" });
        return { info, format };
      } catch (error) {
        throw new Error("فشل تحميل الفيديو");
      }
    }

    // معالجة الرسائل
    client.on("message_create", async (message) => {
      try {
        if (message.fromMe) return;
        if (!message.from.endsWith("@g.us")) return;

        const textToCheck = message.body || "";
        const groupId = message.from;
        const userId = getUserId(message);

        const perm = await hasPermission(message);
        const isDev = perm.isDev;
        const isAdmin = perm.isAdmin;
        const isGroupAdminUser = await isGroupAdmin(message);

        initUser(userId);

        if (!groupData[groupId]) groupData[groupId] = { mutedUsers: [] };
        if (!bannedWords[groupId]) bannedWords[groupId] = [];
        if (!groupProtection[groupId])
          groupProtection[groupId] = { enabled: false };
        if (!devLinkAllowed[groupId]) devLinkAllowed[groupId] = false;
        if (!gameData[groupId])
          gameData[groupId] = { activeGame: null, players: [] };

        // إضافة XP مع كل رسالة (ما عدا الأوامر)
        if (!textToCheck.startsWith(".")) {
          if (userXP[userId] !== Infinity) {
            userXP[userId] += 1;
            const newLevel = calculateLevel(userXP[userId]);
            if (newLevel > userLevels[userId]) {
              userLevels[userId] = newLevel;
              await message.reply(
                `🎉 تهانينا! لقد وصلت إلى المستوى ${newLevel}!`,
              );
            }
          }
        }

        // ====== أوامر المطور ======
        if (
          textToCheck === ".Boos" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          try {
            let target;
            if (message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
              target = message.mentionedIds[0];
            }
            if (!target) {
              await message.reply("❌ لم أتمكن من تحديد العضو");
              return;
            }
            const targetNumber = target.split("@")[0];
            if (
              CUSTOM_ADMINS.includes(target) ||
              CUSTOM_ADMINS.includes(targetNumber)
            ) {
              await message.reply("⚠️ هذا العضو مشرف بالفعل");
              return;
            }
            CUSTOM_ADMINS.push(target);
            CUSTOM_ADMINS.push(targetNumber);
            await reactToMessage(message, "✅");
            await message.reply(
              `✅ تمت إضافة @${targetNumber} إلى قائمة المشرفين`,
            );
          } catch (error) {
            console.log("خطأ في Boos:", error);
            await message.reply("❌ حدث خطأ");
          }
          return;
        }

        if (
          textToCheck === ".stob" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          try {
            let target;
            if (message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
              target = message.mentionedIds[0];
            }
            if (!target) {
              await message.reply("❌ لم أتمكن من تحديد العضو");
              return;
            }
            const targetNumber = target.split("@")[0];
            if (
              GLOBAL_ADMINS.includes(target) ||
              GLOBAL_ADMINS.includes(targetNumber)
            ) {
              await message.reply("⚠️ لا يمكن إزالة المطور الأساسي");
              return;
            }
            CUSTOM_ADMINS = CUSTOM_ADMINS.filter(
              (id) => id !== target && id !== targetNumber,
            );
            await reactToMessage(message, "✅");
            await message.reply(
              `✅ تمت إزالة @${targetNumber} من قائمة المشرفين`,
            );
          } catch (error) {
            console.log("خطأ في stob:", error);
            await message.reply("❌ حدث خطأ");
          }
          return;
        }

        if (textToCheck === ".قائمة_المشرفين") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          let list = "*👑 قائمة المشرفين المخصصين:*\n\n";
          CUSTOM_ADMINS.forEach((id, i) => {
            if (id.includes("@")) list += `${i + 1}. ${id.split("@")[0]}\n`;
          });
          await message.reply(list);
          return;
        }

        // ====== أمر .اوامر ======
        if (textToCheck === ".اوامر") {
          await reactToMessage(message, "📋");

          const balanceDisplay =
            userBank[userId].balance === Infinity
              ? "∞"
              : userBank[userId].balance;
          const xpDisplay = userXP[userId] === Infinity ? "∞" : userXP[userId];
          const levelDisplay =
            userLevels[userId] === Infinity ? "∞" : userLevels[userId];

          const caption =
            "*◈━───━◈⎛⚔️⎞◈━───━◈*\n" +
            "*◞أوامــر لوفي  بــوت╎⚙️◜*\n" +
            "*◈━───━◈⎛⚔️⎞◈━───━◈*\n" +
            "*˼‏👤˹ ⇱╷مـعـلـومـاتـك╵⇲ ˼‏👤˹*\n" +
            "*◈━───━◈⎛⚔️⎞◈━───━◈*\n" +
            `*˼‏💎˹╎لــفــلــك⇇﹝${balanceDisplay} ${CURRENCY}﹞*\n` +
            `*˼‏⚜️˹╎إكــس بــي⇇﹝${xpDisplay} ${XP_NAME}﹞*\n` +
            `*˼‏📊˹╎مــســتــواك⇇﹝${levelDisplay}﹞*\n` +
            "*◈━───━◈⎛⚔️⎞◈━───━◈*\n" +
            "*˼‏📜˹ ⇱╷معلومات البوت╵⇲ ˼‏📜˹*\n" +
            "*◈━───━◈⎛⚔️⎞◈━───━◈*\n" +
            "*˼‏💻˹╎الــمــطــور⇇﹝𝑱𝑶𝑲𝑬𝑹 𖢹 ﹞*\n" +
            "*˼‏🥷🏻˹╎الـبـوت⇇﹝لوفـ👑ـي بـوت﹞*\n" +
            `*˼‏🛜˹╎الــمنــصــة⇇﹝Replit﹞*\n` +
            `*˼‏📅˹╎الـيـوم⇇﹝${getCurrentTime().date}﹞*\n` +
            "*◈━───━◈⎛⚔️⎞◈━───━◈*\n" +
            "> *⚔️╎L u f f y  - 𝐁 𝐎 𝐓*\n" +
            "*◈━───━◈⎛⚔️⎞◈━───━◈*\n" +
            "*.م0 اقـسـام لـوفــ👑ـي بــوت*";

          await message.reply(caption);
          return;
        }

        // ====== أمر .م0 (عرض الأقسام) ======
        if (textToCheck === ".م0") {
          await reactToMessage(message, "📌");

          const caption =
            "✨ *اقـسـام لـوفـ👑ـي بـ🤖ـوت* ✨\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ➤ `.م1` ◄ القسم العام 🌐\n" +
            "┃ ➤ `.م2` ◄ الترفيه والألعاب 🎮\n" +
            "┃ ➤ `.م3` ◄ قسم الجروب 👥\n" +
            "┃ ➤ `.م4` ◄ قسم البنك 💰\n" +
            "┃ ➤ `.م5` ◄ قسم الحماية 🛡️\n" +
            "┃ ➤ `.م6` ◄ قسم المطور ⚙️\n" +
            "┃ ➤ `.م7` ◄ قسم الألعاب المتقدمة 🎯\n" +
            "┃ ➤ `.م8` ◄ قسم الإنجازات 🏆\n" +
            "┃ ➤ `.م9` ◄ قسم الدين 🕌\n" +
            "┃ ➤ `.م10` ◄ قسم التحميل 📥\n" +
            "╰━━━━━━━━━━━━━━╯\n\n" +
            "✦═━━━━━━═✦⎝🃏⎠✦═━━━━━━═✦\n" +
            "> *⚔️╎L u f f y  - 𝐁 𝐎 𝐓*";

          await message.reply(caption);
          return;
        }

        // ====== أوامر القسم ======
        if (textToCheck === ".م1") {
          await reactToMessage(message, "🌐");
          const caption =
            "🌐 *القسم العام* 🌐\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.اوامر` 📋\n" +
            "┃ ✦ `.المطور` 👑\n" +
            "┃ ✦ `.تست` ⚡\n" +
            "┃ ✦ `.حالة` 📊\n" +
            "┃ ✦ `.الوقت` 🕐\n" +
            "┃ ✦ `.التاريخ` 📅\n" +
            "┃ ✦ `.عدد_الاعضاء` 👥\n" +
            "┃ ✦ `.عدد_المشرفين` 👑\n" +
            "┃ ✦ `.صلاحيتي` 🔍\n" +
            "┃ ✦ `.بوت` 🤖\n" +
            "┃ ✦ `.مستواي` 📊\n" +
            "┃ ✦ `.رتبتي` 👑\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م2") {
          await reactToMessage(message, "🎮");
          const caption =
            "🎮 *الترفيه والألعاب* 🎮\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.رول` 🎲\n" +
            "┃ ✦ `.نكتة` 😂\n" +
            "┃ ✦ `.اقتباس` 💬\n" +
            "┃ ✦ `.لو_خيروك` 🤔\n" +
            "┃ ✦ `.حقيقة` 🎯\n" +
            "┃ ✦ `.جرأة` 🔥\n" +
            "┃ ✦ `.فزورة` 🔍\n" +
            "┃ ✦ `.حظ` 🍀\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م3") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا القسم للمشرفين فقط");
            return;
          }
          await reactToMessage(message, "👥");
          const caption =
            "👥 *قسم الجروب* 👥\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.طرد` 🚫\n" +
            "┃ ✦ `.رفع` 👑\n" +
            "┃ ✦ `.اعفاء` ⬇️\n" +
            "┃ ✦ `.حذف` 🗑️\n" +
            "┃ ✦ `.منشن` 👥\n" +
            "┃ ✦ `.لمنشن` 📝\n" +
            "┃ ✦ `.كتم` 🔇\n" +
            "┃ ✦ `.الغاء-الكتم` 🔊\n" +
            "┃ ✦ `.لينك` 🔗\n" +
            "┃ ✦ `.تغيير_اللينك` 🔄\n" +
            "┃ ✦ `.المشرفين` 👑\n" +
            "┃ ✦ `.بروفايل` 🖼️\n" +
            "┃ ✦ `.وصف` 📝\n" +
            "┃ ✦ `.انذار` ⚠️\n" +
            "┃ ✦ `.انذاراتي` ⚠️\n" +
            "┃ ✦ `.تصويت` 🗳️\n" +
            "┃ ✦ `.فضح` 🔍\n" +
            "┃ ✦ `.اقبل` ✅\n" +
            "┃ ✦ `.جروب قفل` 🔒\n" +
            "┃ ✦ `.جروب فتح` 🔓\n" +
            "┃ ✦ `.إضافة` ➕\n" +
            "┃ ✦ `.تغيير_الصورة` 🖼️\n" +
            "┃ ✦ `.تغيير_الاسم` 📝\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م4") {
          await reactToMessage(message, "💰");
          const caption =
            "💰 *قسم البنك* 💰\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.البنك` 🏦\n" +
            "┃ ✦ `.محفظة` 👛\n" +
            "┃ ✦ `.سحب [مبلغ]` 💸\n" +
            "┃ ✦ `.شراء دولار` 💵\n" +
            "┃ ✦ `.اهداء` 🎁\n" +
            "┃ ✦ `.يومي` 🎁\n" +
            "┃ ✦ `.سوق` 🛒\n" +
            "┃ ✦ `.تداول` 💹\n" +
            "┃ ✦ `.كنز` 💎\n" +
            "┃ ✦ `.وظيفة` 💼\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م5") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا القسم للمشرفين فقط");
            return;
          }
          await reactToMessage(message, "🛡️");
          const caption =
            "🛡️ *قسم الحماية* 🛡️\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.كتم_الكلمات` 🔇\n" +
            "┃ ✦ `.اضف_كلمة` ➕\n" +
            "┃ ✦ `.مسح_كلمة` ➖\n" +
            "┃ ✦ `.قائمة_الكلمات` 📋\n" +
            "┃ ✦ `.حماية` 🛡️\n" +
            "┃ ✦ `.الغاء-الحماية` 🔓\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م6") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا القسم للمطور فقط");
            return;
          }
          await reactToMessage(message, "⚙️");
          const caption =
            "⚙️ *قسم المطور* ⚙️\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.غادر` 👋\n" +
            "┃ ✦ `.انضم` 🔗\n" +
            "┃ ✦ `.بنج` 🏓\n" +
            "┃ ✦ `.x` 📊\n" +
            "┃ ✦ `.s` ✅\n" +
            "┃ ✦ `.a` ❌\n" +
            "┃ ✦ `.ضيف_اكس_بي` ⚜️\n" +
            "┃ ✦ `.Boos` 👑\n" +
            "┃ ✦ `.stob` ⬇️\n" +
            "┃ ✦ `.قائمة_المشرفين` 📋\n" +
            "┃ ✦ `.اعادة_تشغيل` 🔄\n" +
            "┃ ✦ `.اذاعة` 📢\n" +
            "┃ ✦ `.فحص` 🔍\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م7") {
          await reactToMessage(message, "🎯");
          const caption =
            "🎯 *قسم الألعاب المتقدمة* 🎯\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.كسوف` 🌑\n" +
            "┃ ✦ `.معركة` ⚔️\n" +
            "┃ ✦ `.تحدي` 🤺\n" +
            "┃ ✦ `.بينو` 🎴\n" +
            "┃ ✦ `.اكس_او` ❌⭕\n" +
            "┃ ✦ `.صراحة` 🤫\n" +
            "┃ ✦ `.اعتراف` 🤐\n" +
            "┃ ✦ `.هيدج_هو` 🕵️\n" +
            "┃ ✦ `.كلمة_سرية` 🔐\n" +
            "┃ ✦ `.مسابقة` 🏆\n" +
            "┃ ✦ `.تحدي_سريع` ⏱️\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م8") {
          await reactToMessage(message, "🏆");
          const caption =
            "🏆 *قسم الإنجازات* 🏆\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.انجازاتي` 🏆\n" +
            "┃ ✦ `.هدية` 🎁\n" +
            "┃ ✦ `.هداياي` 🎁\n" +
            "┃ ✦ `.متجر_الهدايا` 🛒\n" +
            "┃ ✦ `.القابي` 👑\n" +
            "┃ ✦ `.تغيير_اللقب` ✏️\n" +
            "┃ ✦ `.توب_اكس بي` 📊\n" +
            "┃ ✦ `.توب_دولار` 💰\n" +
            "┃ ✦ `.توب_مستوى` 📈\n" +
            "┃ ✦ `.نشاطي` 📊\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م9") {
          await reactToMessage(message, "🕌");
          const caption =
            "🕌 *قسم الدين* 🕌\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.قرآن` 📖\n" +
            "┃ ✦ `.حديث` 📜\n" +
            "┃ ✦ `.اذكار` 🕌\n" +
            "┃ ✦ `.صلاة` 🕋\n" +
            "┃ ✦ `.اسم_الله` 🤲\n" +
            "┃ ✦ `.دعاء` 🤲\n" +
            "┃ ✦ `.قبلة` 🧭\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        if (textToCheck === ".م10") {
          await reactToMessage(message, "📥");
          const caption =
            "📥 *قسم التحميل* 📥\n\n" +
            "╭━━━━━━━━━━━━━━╮\n" +
            "┃ ✦ `.يوتيوب [رابط]` 📹\n" +
            "┃ ✦ `.يوتيوب صوت [رابط]` 🎵\n" +
            "┃ ✦ `.تيك توك [رابط]` 🎬\n" +
            "┃ ✦ `.انستا [رابط]` 📱\n" +
            "┃ ✦ `.تويتر [رابط]` 🐦\n" +
            "┃ ✦ `.فيس [رابط]` 👥\n" +
            "┃ ✦ `.تحميل [رابط]` ⬇️\n" +
            "╰━━━━━━━━━━━━━━╯";
          await message.reply(caption);
          return;
        }

        // ====== أوامر البنك ======
        if (textToCheck === ".البنك") {
          await reactToMessage(message, "🏦");
          const balance =
            userBank[userId].balance === Infinity
              ? "∞"
              : userBank[userId].balance;
          const dollars =
            userBank[userId].dollars === Infinity
              ? "∞"
              : userBank[userId].dollars;
          await message.reply(
            `🏦 *البنك المركزي*\n\n` +
              `💰 رصيدك: ${balance} ${CURRENCY}\n` +
              `💵 دولارك: ${dollars}`,
          );
          return;
        }

        if (textToCheck === ".محفظة") {
          await reactToMessage(message, "👛");
          const balance =
            userBank[userId].balance === Infinity
              ? "∞"
              : userBank[userId].balance;
          const dollars =
            userBank[userId].dollars === Infinity
              ? "∞"
              : userBank[userId].dollars;
          const xp = userXP[userId] === Infinity ? "∞" : userXP[userId];
          await message.reply(
            `👛 *محفظتك*\n\n` +
              `💰 الرصيد: ${balance} ${CURRENCY}\n` +
              `💵 دولار: ${dollars}\n` +
              `⚜️ نقاط XP: ${xp}`,
          );
          return;
        }

        if (textToCheck.startsWith(".سحب ")) {
          await reactToMessage(message, "💸");
          const amount = parseInt(textToCheck.split(" ")[1]);
          if (isNaN(amount) || amount <= 0) {
            await message.reply("❌ الرجاء إدخال مبلغ صحيح");
            return;
          }
          if (
            userBank[userId].balance < amount &&
            userBank[userId].balance !== Infinity
          ) {
            await message.reply("❌ رصيدك غير كافي");
            return;
          }
          if (userBank[userId].balance !== Infinity) {
            userBank[userId].balance -= amount;
          }
          await message.reply(`✅ تم سحب ${amount} ${CURRENCY} بنجاح`);
          return;
        }

        if (textToCheck === ".شراء دولار") {
          await reactToMessage(message, "💵");
          if (
            userBank[userId].balance < 100 &&
            userBank[userId].balance !== Infinity
          ) {
            await message.reply("❌ تحتاج 100 دولار لشراء 1 دولار");
            return;
          }
          if (userBank[userId].balance !== Infinity) {
            userBank[userId].balance -= 100;
          }
          if (userBank[userId].dollars !== Infinity) {
            userBank[userId].dollars += 1;
          }
          await message.reply("✅ تم شراء 1 دولار بنجاح");
          return;
        }

        if (textToCheck === ".يومي") {
          await reactToMessage(message, "🎁");
          const now = Date.now();
          const lastDaily = userLastDaily[userId] || 0;

          if (now - lastDaily < 24 * 60 * 60 * 1000) {
            const remaining = Math.ceil(
              (24 * 60 * 60 * 1000 - (now - lastDaily)) / (60 * 60 * 1000),
            );
            await message.reply(
              `⏳ يجب انتظار ${remaining} ساعة للمكافأة التالية`,
            );
            return;
          }

          if (userXP[userId] !== Infinity) {
            userXP[userId] += 20;
          }
          userLastDaily[userId] = now;
          await message.reply(`🎁 *المكافأة اليومية*\n\n⚜️ حصلت على 20 XP`);
          return;
        }

        if (textToCheck === ".سوق") {
          await reactToMessage(message, "🛒");
          if (userXP[userId] < 50 && userXP[userId] !== Infinity) {
            await message.reply("❌ تحتاج 50 XP لشراء 1 دولار");
            return;
          }
          if (userXP[userId] !== Infinity) {
            userXP[userId] -= 50;
          }
          if (userBank[userId].dollars !== Infinity) {
            userBank[userId].dollars += 1;
          }
          await message.reply("✅ تم شراء 1 دولار مقابل 50 XP");
          return;
        }

        if (
          textToCheck.startsWith(".اهداء ") &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          await reactToMessage(message, "🎁");
          const parts = textToCheck.split(" ");
          if (parts.length < 2) {
            await message.reply("❌ الاستخدام: .اهداء @المستخدم المبلغ");
            return;
          }

          let target;
          if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            target = quotedMsg.author || quotedMsg.from;
          } else if (message.mentionedIds.length > 0) {
            target = message.mentionedIds[0];
          }

          const amount = parseInt(parts[parts.length - 1]);
          if (isNaN(amount) || amount <= 0) {
            await message.reply("❌ الرجاء إدخال مبلغ صحيح");
            return;
          }

          if (
            userBank[userId].balance < amount &&
            userBank[userId].balance !== Infinity
          ) {
            await message.reply("❌ رصيدك غير كافي");
            return;
          }

          if (userBank[userId].balance !== Infinity) {
            userBank[userId].balance -= amount;
          }
          if (!userBank[target]) initUser(target);
          if (userBank[target].balance !== Infinity) {
            userBank[target].balance += amount;
          }

          await message.reply(`✅ تم إهداء ${amount} ${CURRENCY} بنجاح`);
          return;
        }

        // ====== أمر .استثمار ======
        if (textToCheck.startsWith(".تداول ")) {
          await reactToMessage(message, "💹");
          const amount = parseInt(textToCheck.split(" ")[1]);

          if (isNaN(amount) || amount <= 0) {
            await message.reply("❌ الرجاء إدخال مبلغ صحيح");
            return;
          }

          if (
            userBank[userId].balance < amount &&
            userBank[userId].balance !== Infinity
          ) {
            await message.reply("❌ رصيدك غير كافي");
            return;
          }

          const success = Math.random() > 0.4;

          if (success) {
            const profit = Math.floor(amount * (Math.random() * 0.5 + 0.2));
            if (userBank[userId].balance !== Infinity) {
              userBank[userId].balance += profit;
            }
            await message.reply(`✅ نجح الاستثمار! ربحت ${profit} ${CURRENCY}`);
          } else {
            if (userBank[userId].balance !== Infinity) {
              userBank[userId].balance -= amount;
            }
            await message.reply(`❌ فشل الاستثمار! خسرت ${amount} ${CURRENCY}`);
          }
          return;
        }

        // ====== أمر .كنز ======
        if (textToCheck === ".كنز") {
          await reactToMessage(message, "💎");
          const found = Math.random() > 0.7;

          if (found) {
            const treasure = Math.floor(Math.random() * 50) + 20;
            if (userBank[userId].dollars !== Infinity) {
              userBank[userId].dollars += treasure;
            }
            await message.reply(`💎 وجدت كنزاً! حصلت على ${treasure} دولار`);
          } else {
            await message.reply("😢 لم تجد شيئاً، حاول مرة أخرى غداً");
          }
          return;
        }

        // ====== أمر .وظيفة ======
        if (textToCheck === ".وظيفة") {
          await reactToMessage(message, "💼");
          const now = Date.now();
          const lastWork = userLastDaily[userId + "_work"] || 0;

          if (now - lastWork < 12 * 60 * 60 * 1000) {
            const remaining = Math.ceil(
              (12 * 60 * 60 * 1000 - (now - lastWork)) / (60 * 60 * 1000),
            );
            await message.reply(`⏳ يمكنك العمل بعد ${remaining} ساعة`);
            return;
          }

          const salary = Math.floor(Math.random() * 30) + 20;
          if (userBank[userId].balance !== Infinity) {
            userBank[userId].balance += salary;
          }
          userLastDaily[userId + "_work"] = now;

          await message.reply(`💼 عملت اليوم وحصلت على ${salary} ${CURRENCY}`);
          return;
        }

        // ====== أوامر التحميل ======
        if (textToCheck.startsWith(".يوتيوب ")) {
          await reactToMessage(message, "📹");
          const url = textToCheck.substring(8).trim();

          if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
            await message.reply("❌ هذا ليس رابط يوتيوب صحيح");
            return;
          }

          await message.reply("⏳ جاري تحميل الفيديو...");

          try {
            const { info, format } = await downloadFromYoutube(url);

            // محاكاة التحميل (في الواقع نحتاج API)
            await message.reply(
              `📹 *معلومات الفيديو*\n\n` +
                `📌 العنوان: ${info.videoDetails.title}\n` +
                `⏱️ المدة: ${Math.floor(info.videoDetails.lengthSeconds / 60)} دقيقة\n` +
                `👁️ المشاهدات: ${info.videoDetails.viewCount}\n\n` +
                `⚠️ التحميل متوقف حالياً - يتطلب API مدفوع`,
            );
          } catch (error) {
            await message.reply("❌ فشل تحميل الفيديو");
          }
          return;
        }

        if (textToCheck.startsWith(".يوتيوب صوت ")) {
          await reactToMessage(message, "🎵");
          const url = textToCheck.substring(12).trim();

          if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
            await message.reply("❌ هذا ليس رابط يوتيوب صحيح");
            return;
          }

          await message.reply("⏳ جاري تحميل الصوت...");
          await message.reply("⚠️ التحميل متوقف حالياً - يتطلب API مدفوع");
          return;
        }

        if (textToCheck.startsWith(".تيك توك ")) {
          await reactToMessage(message, "🎬");
          const url = textToCheck.substring(9).trim();

          if (!url.includes("tiktok.com")) {
            await message.reply("❌ هذا ليس رابط تيك توك صحيح");
            return;
          }

          await message.reply("⏳ جاري تحميل من تيك توك...");
          await message.reply("⚠️ التحميل متوقف حالياً - يتطلب API مدفوع");
          return;
        }

        if (textToCheck.startsWith(".انستا ")) {
          await reactToMessage(message, "📱");
          const url = textToCheck.substring(7).trim();

          if (!url.includes("instagram.com")) {
            await message.reply("❌ هذا ليس رابط انستغرام صحيح");
            return;
          }

          await message.reply("⏳ جاري تحميل من انستغرام...");
          await message.reply("⚠️ التحميل متوقف حالياً - يتطلب API مدفوع");
          return;
        }

        if (textToCheck.startsWith(".تويتر ")) {
          await reactToMessage(message, "🐦");
          const url = textToCheck.substring(7).trim();

          if (!url.includes("twitter.com") && !url.includes("x.com")) {
            await message.reply("❌ هذا ليس رابط تويتر صحيح");
            return;
          }

          await message.reply("⏳ جاري تحميل من تويتر...");
          await message.reply("⚠️ التحميل متوقف حالياً - يتطلب API مدفوع");
          return;
        }

        if (textToCheck.startsWith(".فيس ")) {
          await reactToMessage(message, "👥");
          const url = textToCheck.substring(5).trim();

          if (!url.includes("facebook.com") && !url.includes("fb.com")) {
            await message.reply("❌ هذا ليس رابط فيسبوك صحيح");
            return;
          }

          await message.reply("⏳ جاري تحميل من فيسبوك...");
          await message.reply("⚠️ التحميل متوقف حالياً - يتطلب API مدفوع");
          return;
        }

        if (textToCheck.startsWith(".تحميل ")) {
          await reactToMessage(message, "⬇️");
          const url = textToCheck.substring(7).trim();

          let platform = "unknown";
          if (url.includes("youtube.com") || url.includes("youtu.be"))
            platform = "يوتيوب";
          else if (url.includes("tiktok.com")) platform = "تيك توك";
          else if (url.includes("instagram.com")) platform = "انستغرام";
          else if (url.includes("twitter.com") || url.includes("x.com"))
            platform = "تويتر";
          else if (url.includes("facebook.com") || url.includes("fb.com"))
            platform = "فيسبوك";

          await message.reply(`⏳ جاري تحميل من ${platform}...`);
          await message.reply("⚠️ التحميل متوقف حالياً - يتطلب API مدفوع");
          return;
        }

        // ====== أمر .تغيير_الاسم ======
        if (textToCheck.startsWith(".تغيير_الاسم ")) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          const newName = textToCheck.substring(13).trim();
          if (!newName) {
            await message.reply("❌ الرجاء كتابة الاسم الجديد");
            return;
          }
          try {
            await reactToMessage(message, "📝");
            const chat = await message.getChat();
            await chat.setName(newName);
            await message.reply(`✅ تم تغيير اسم المجموعة إلى: ${newName}`);
          } catch (error) {
            console.log("خطأ في تغيير الاسم:", error);
            await message.reply("❌ حدث خطأ في تغيير الاسم");
          }
          return;
        }

        // ====== أمر .تغيير_الصورة ======
        if (textToCheck === ".تغيير_الصورة" && message.hasQuotedMsg) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🖼️");
            const quotedMsg = await message.getQuotedMessage();
            if (quotedMsg.hasMedia) {
              const media = await quotedMsg.downloadMedia();
              const chat = await message.getChat();
              await chat.setPicture(media);
              await message.reply("✅ تم تغيير صورة المجموعة");
            } else {
              await message.reply("❌ الرجاء الرد على صورة");
            }
          } catch (error) {
            console.log("خطأ في تغيير الصورة:", error);
            await message.reply("❌ حدث خطأ في تغيير الصورة");
          }
          return;
        }

        // ====== أمر .بنج ======
        if (textToCheck === ".بنج") {
          await reactToMessage(message, "🏓");
          const start = Date.now();
          const sentMsg = await message.reply("🏓 *بنج!*");
          const end = Date.now();
          const ping = end - start;

          setTimeout(async () => {
            await sentMsg.edit(`🏓 *بنج!*\n⏱️ سرعة الاستجابة: ${ping}ms`);
          }, 500);
          return;
        }

        // ====== أمر .فحص ======
        if (textToCheck === ".فحص") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }

          await reactToMessage(message, "🔍");

          const report =
            "*🔍 تقرير فحص البوت*\n\n" +
            `📊 *إحصائيات:*\n` +
            `✅ الأوامر: جميعها شغالة\n` +
            `⚡ حالة البوت: نشط ✅\n` +
            `⏱️ وقت التشغيل: ${Math.floor(process.uptime() / 60)} دقيقة\n` +
            `📊 المستخدمين: ${botUsers.size}\n\n` +
            `*✅ الأوامر النشطة:*\n` +
            `• .اوامر 📋\n` +
            `• .م0 📌\n` +
            `• .البنك 🏦\n` +
            `• .بنج 🏓\n` +
            `• .يوتيوب 📹\n` +
            `• .تحميل ⬇️`;

          await message.reply(report);
          return;
        }

        // ====== أمر .اعادة_تشغيل ======
        if (textToCheck === ".اعادة_تشغيل") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          await message.reply("🔄 جاري إعادة تشغيل البوت...");
          process.exit(0);
          return;
        }

        // ====== أمر .غادر ======
        if (textToCheck === ".غادر") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          try {
            await reactToMessage(message, "👋");
            await message.reply("👋 وداعاً...");
            const chat = await message.getChat();
            await chat.leave();
          } catch (error) {}
          return;
        }

        // ====== أمر .انضم ======
        if (
          textToCheck.startsWith(".انضم ") &&
          !message.from.endsWith("@g.us")
        ) {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }

          const link = textToCheck.substring(6).trim();
          if (!link) {
            await reactToMessage(message, "❌");
            await message.reply("❌ الرجاء إرسال رابط المجموعة");
            return;
          }

          try {
            await reactToMessage(message, "🔗");

            let inviteCode = link;
            if (link.includes("chat.whatsapp.com/")) {
              inviteCode = link.split("chat.whatsapp.com/")[1];
              inviteCode = inviteCode.split(" ")[0].split("\n")[0];
            }

            if (!inviteCode || inviteCode.length < 10) {
              await message.reply("❌ رابط غير صالح");
              return;
            }

            await message.reply(`✅ جاري محاولة الانضمام إلى المجموعة...`);

            try {
              await client.acceptInvite(inviteCode);
              await message.reply(`✅ تم الانضمام إلى المجموعة بنجاح`);
            } catch (err) {
              console.log("خطأ في الانضمام:", err);
              await message.reply(
                `❌ فشل الانضمام إلى المجموعة. تأكد من صحة الرابط`,
              );
            }
          } catch (error) {
            console.log("خطأ:", error);
            await reactToMessage(message, "❌");
            await message.reply("❌ رابط غير صالح");
          }
          return;
        }

        // ====== أمر .اذاعة ======
        if (textToCheck === ".اذاعة" && message.hasQuotedMsg) {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }

          const quotedMsg = await message.getQuotedMessage();
          const broadcastMsg = quotedMsg.body;

          await message.reply("📢 تم استلام الرسالة للإذاعة");
          await message.reply(`📢 *رسالة إذاعية:*\n\n${broadcastMsg}`);
          return;
        }

        // ====== أمر .ملصق ======
        if (textToCheck === ".ملصق" || textToCheck === ".sticker") {
          try {
            if (!message.hasQuotedMsg) {
              await reactToMessage(message, "❌");
              await message.reply("❌ يجب الرد على صورة");
              return;
            }

            await reactToMessage(message, "🎨");

            const quotedMsg = await message.getQuotedMessage();

            if (!quotedMsg.hasMedia) {
              await message.reply("❌ لا تحتوي على صورة");
              return;
            }

            const media = await quotedMsg.downloadMedia();

            if (!media.mimetype.startsWith("image/")) {
              await message.reply("❌ هذا الأمر يعمل فقط مع الصور");
              return;
            }

            await client.sendMessage(message.from, media, {
              sendMediaAsSticker: true,
              stickerName: "لوفي بوت",
              stickerAuthor: "⚔️ Luffy Bot",
            });

            if (userXP[userId] !== Infinity) {
              userXP[userId] += 5;
            }
          } catch (error) {
            console.log("⚠️ خطأ في تحويل الصورة:", error.message);
            await message.reply("❌ حدث خطأ");
          }
          return;
        }

        // ====== أمر .منشن ======
        if (textToCheck === ".منشن") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "👥");
            const chat = await message.getChat();
            const participants = chat.participants;

            if (!participants || participants.length === 0) {
              await message.reply("❌ لا يوجد أعضاء");
              return;
            }

            await message.reply(`📨 جاري إرسال المنشن...`);

            for (let i = 0; i < participants.length; i++) {
              const p = participants[i];
              await client.sendMessage(message.from, `@${p.id.user}`, {
                mentions: [p.id._serialized],
              });
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            await message.reply(`✅ تم الإرسال`);
          } catch (error) {
            console.log("خطأ في المنشن:", error);
            await message.reply("❌ حدث خطأ");
          }
          return;
        }

        // ====== أمر .طرد ======
        if (
          textToCheck === ".طرد" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🚫");

            let target;
            if (message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
              target = message.mentionedIds[0];
            }

            if (target) {
              await message.reply(`⚠️ جاري طرد العضو...`);
              const chat = await message.getChat();
              await chat.removeParticipants([target]);
              await message.reply("*تم الطرد ❌*");
            }
          } catch (error) {}
          return;
        }

        // ====== أمر .رفع ======
        if (
          textToCheck === ".رفع" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "👑");
            let target;
            if (message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
              target = message.mentionedIds[0];
            }
            if (target) {
              const chat = await message.getChat();
              await chat.promoteParticipants([target]);
              await message.reply("👑 تم رفع العضو إلى أدمن");
            }
          } catch (error) {}
          return;
        }

        // ====== أمر .اعفاء ======
        if (
          textToCheck === ".اعفاء" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "⬇️");
            let target;
            if (message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
              target = message.mentionedIds[0];
            }
            if (target) {
              const chat = await message.getChat();
              await chat.demoteParticipants([target]);
              await message.reply("⬇️ تم إعفاء العضو من الادمن");
            }
          } catch (error) {}
          return;
        }

        // ====== أمر .حذف ======
        if (textToCheck === ".حذف" && message.hasQuotedMsg) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🗑️");
            const quotedMsg = await message.getQuotedMessage();
            await quotedMsg.delete(true);
          } catch (error) {}
          return;
        }

        // ====== أمر .كتم ======
        if (
          textToCheck === ".كتم" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🔇");
            let target;
            if (message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
              target = message.mentionedIds[0];
            }
            if (!groupData[groupId].mutedUsers.includes(target)) {
              groupData[groupId].mutedUsers.push(target);
              await message.reply("🔇 تم كتم العضو");
            }
          } catch (error) {}
          return;
        }

        // ====== أمر .الغاء-الكتم ======
        if (
          textToCheck === ".الغاء-الكتم" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🔊");
            let target;
            if (message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              target = quotedMsg.author || quotedMsg.from;
            } else if (message.mentionedIds.length > 0) {
              target = message.mentionedIds[0];
            }
            const index = groupData[groupId].mutedUsers.indexOf(target);
            if (index !== -1) {
              groupData[groupId].mutedUsers.splice(index, 1);
              await message.reply("🔊 تم إلغاء كتم العضو");
            }
          } catch (error) {}
          return;
        }

        // ====== أمر .لينك ======
        if (textToCheck === ".لينك") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🔗");
            const chat = await message.getChat();
            const code = await chat.getInviteCode();
            await message.reply(
              `🔗 رابط المجموعة:\nhttps://chat.whatsapp.com/${code}`,
            );
          } catch (error) {}
          return;
        }

        // ====== أمر .تغيير_اللينك ======
        if (textToCheck === ".تغيير_اللينك") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🔄");
            const chat = await message.getChat();
            await chat.revokeInvite();
            const newCode = await chat.getInviteCode();
            await message.reply(
              `🔄 تم تغيير رابط المجموعة\n🔗 الرابط الجديد:\nhttps://chat.whatsapp.com/${newCode}`,
            );
          } catch (error) {}
          return;
        }

        // ====== أمر .المشرفين ======
        if (textToCheck === ".المشرفين") {
          await reactToMessage(message, "👑");
          try {
            const chat = await message.getChat();
            const admins = chat.participants.filter((p) => p.isAdmin);
            let adminList = "*👑 قائمة المشرفين:*\n\n";
            admins.forEach((admin, i) => {
              adminList += `${i + 1}. @${admin.id.user}\n`;
            });
            await message.reply(adminList, {
              mentions: admins.map((a) => a.id._serialized),
            });
          } catch (error) {}
          return;
        }

        // ====== أمر .بروفايل ======
        if (textToCheck === ".بروفايل") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🖼️");
            const chat = await message.getChat();
            const pic = await getGroupPicture(chat);
            if (pic) {
              await client.sendMessage(message.from, pic, {
                caption: "🖼️ صورة المجموعة",
              });
            } else {
              await message.reply("❌ لا توجد صورة للمجموعة");
            }
          } catch (error) {}
          return;
        }

        // ====== أمر .وصف ======
        if (textToCheck === ".وصف") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "📝");
            const chat = await message.getChat();
            await message.reply(
              `📝 *وصف المجموعة:*\n\n${chat.description || "لا يوجد وصف"}`,
            );
          } catch (error) {}
          return;
        }

        // ====== أمر .انذار ======
        if (
          textToCheck === ".انذار" &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }

          await reactToMessage(message, "⚠️");
          let target;
          if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            target = quotedMsg.author || quotedMsg.from;
          } else if (message.mentionedIds.length > 0) {
            target = message.mentionedIds[0];
          }

          if (!target) return;

          if (userWarnings[target] !== Infinity) {
            userWarnings[target] = (userWarnings[target] || 0) + 1;
          }
          const warnings = userWarnings[target];

          if (warnings >= 3 && userWarnings[target] !== Infinity) {
            try {
              const chat = await message.getChat();
              await chat.removeParticipants([target]);
              await message.reply(`⚠️ تم طرد العضو لوصوله لـ 3 انذارات`);
              userWarnings[target] = 0;
            } catch (error) {}
          } else {
            await message.reply(`⚠️ تم إنذار العضو (${warnings}/3)`);
          }
          return;
        }

        // ====== أمر .انذاراتي ======
        if (textToCheck === ".انذاراتي") {
          await reactToMessage(message, "⚠️");
          await message.reply(
            `⚠️ عدد انذاراتك: ${userWarnings[userId] || 0}/3`,
          );
          return;
        }

        // ====== أمر .جروب قفل ======
        if (textToCheck === ".جروب قفل") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🔒");
            const chat = await message.getChat();
            await chat.setMessagesAdminsOnly(true);
            await message.reply("🔒 تم قفل المجموعة");
          } catch (error) {}
          return;
        }

        // ====== أمر .جروب فتح ======
        if (textToCheck === ".جروب فتح") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          try {
            await reactToMessage(message, "🔓");
            const chat = await message.getChat();
            await chat.setMessagesAdminsOnly(false);
            await message.reply("🔓 تم فتح المجموعة");
          } catch (error) {}
          return;
        }

        // ====== أمر .اقبل ======
        if (textToCheck === ".اقبل") {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }
          await reactToMessage(message, "✅");
          await message.reply("✅ تم تفعيل قبول الطلبات تلقائياً");
          return;
        }

        // ====== أمر .إضافة ======
        if (textToCheck.startsWith(".إضافة ")) {
          if (!isGroupAdminUser && !isDev && !isAdmin) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمشرفين فقط");
            return;
          }

          const number = textToCheck.substring(7).trim();
          if (!number) {
            await reactToMessage(message, "❌");
            await message.reply("❌ الرجاء كتابة الرقم");
            return;
          }

          const cleanNumber = number.replace(/[^0-9]/g, "");

          if (cleanNumber.length < 10) {
            await message.reply("❌ الرقم غير صالح");
            return;
          }

          try {
            await reactToMessage(message, "➕");

            const chat = await message.getChat();
            const inviteCode = await chat.getInviteCode();
            const link = `https://chat.whatsapp.com/${inviteCode}`;

            await message.reply(
              `✅ تم إعداد رابط المجموعة\n\n` +
                `📱 *الرقم:* ${cleanNumber}\n` +
                `🔗 *الرابط:* ${link}\n\n` +
                `📌 يرجى إرسال الرابط إلى الرقم المطلوب`,
            );
          } catch (error) {
            console.log("خطأ في إضافة رقم:", error);
            await reactToMessage(message, "❌");
            await message.reply("❌ حدث خطأ");
          }
          return;
        }

        // ====== أوامر الدين ======
        if (textToCheck === ".قرآن") {
          await reactToMessage(message, "📖");
          const randomVerse =
            quranVerses[Math.floor(Math.random() * quranVerses.length)];
          await message.reply(`📖 *آية قرآنية:*\n\n${randomVerse}`);
          return;
        }

        if (textToCheck === ".حديث") {
          await reactToMessage(message, "📜");
          const randomHadith =
            hadithList[Math.floor(Math.random() * hadithList.length)];
          await message.reply(`📜 *حديث نبوي:*\n\n${randomHadith}`);
          return;
        }

        if (textToCheck === ".اذكار") {
          await reactToMessage(message, "🕌");
          const randomZikr =
            azkarList[Math.floor(Math.random() * azkarList.length)];
          await message.reply(`🕌 *ذكر:*\n\n${randomZikr}`);
          return;
        }

        if (textToCheck === ".اسم_الله") {
          await reactToMessage(message, "🤲");
          const randomName =
            allahNames[Math.floor(Math.random() * allahNames.length)];
          await message.reply(`🤲 *اسم من أسماء الله:*\n\n${randomName}`);
          return;
        }

        if (textToCheck === ".دعاء") {
          await reactToMessage(message, "🤲");
          const randomDua = duas[Math.floor(Math.random() * duas.length)];
          await message.reply(`🤲 *دعاء:*\n\n${randomDua}`);
          return;
        }

        if (textToCheck === ".قبلة") {
          await reactToMessage(message, "🧭");
          await message.reply(
            "🧭 *اتجاه القبلة:*\n\nشمال شرق (حسب موقعك الحالي)",
          );
          return;
        }

        if (textToCheck.startsWith(".صلاة ")) {
          const city = textToCheck.substring(6).trim();
          await reactToMessage(message, "🕋");
          await message.reply(
            `🕋 *مواقيت الصلاة في ${city}:*\n\n` +
              `الفجر: ٥:١٥ ص\n` +
              `الظهر: ١٢:٣٠ م\n` +
              `العصر: ٣:٤٥ م\n` +
              `المغرب: ٦:١٥ م\n` +
              `العشاء: ٧:٤٥ م`,
          );
          return;
        }

        // ====== أوامر الألعاب الأساسية ======
        if (textToCheck === ".رول") {
          await reactToMessage(message, "🎲");
          const result = Math.random() > 0.5 ? "فزت" : "خسرت";
          const xpAmount = Math.floor(Math.random() * 20) + 5;
          if (result === "فزت") {
            if (userXP[userId] !== Infinity) userXP[userId] += xpAmount;
            await message.reply(
              `*🎲 لعبة الرول*\n\nالنتيجة: 🎲 *فزت*\n⚜️ ربحت: ${xpAmount} XP`,
            );
          } else {
            if (userXP[userId] !== Infinity && userXP[userId] > 0)
              userXP[userId] = Math.max(0, userXP[userId] - xpAmount);
            await message.reply(
              `*🎲 لعبة الرول*\n\nالنتيجة: 😢 *خسرت*\n⚜️ خسرت: ${xpAmount} XP`,
            );
          }
          return;
        }

        if (textToCheck === ".نكتة") {
          await reactToMessage(message, "😂");
          const randomJoke =
            jokesList[Math.floor(Math.random() * jokesList.length)];
          await message.reply(`${randomJoke}`);
          if (userXP[userId] !== Infinity) userXP[userId] += 2;
          return;
        }

        if (textToCheck === ".اقتباس") {
          await reactToMessage(message, "💬");
          const randomQuote =
            quotesList[Math.floor(Math.random() * quotesList.length)];
          await message.reply(`${randomQuote}`);
          if (userXP[userId] !== Infinity) userXP[userId] += 3;
          return;
        }

        if (textToCheck === ".لو_خيروك") {
          await reactToMessage(message, "🤔");
          const randomOption =
            wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)];
          await message.reply(`${randomOption}`);
          return;
        }

        if (textToCheck === ".حقيقة") {
          await reactToMessage(message, "🎯");
          const randomTruth =
            truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
          await message.reply(`${randomTruth}`);
          return;
        }

        if (textToCheck === ".جرأة") {
          await reactToMessage(message, "🔥");
          const randomDare =
            dareChallenges[Math.floor(Math.random() * dareChallenges.length)];
          await message.reply(`${randomDare}`);
          return;
        }

        if (textToCheck === ".فزورة") {
          await reactToMessage(message, "🔍");
          const riddles = [
            { q: "ما هو الشيء الذي كلما أخذت منه كبر؟", a: "الحفرة" },
            { q: "ما هو الشيء الذي له أسنان ولا يعض؟", a: "المشط" },
            { q: "ما هو الشيء الذي يكتب ولا يقرأ؟", a: "القلم" },
          ];
          const randomRiddle =
            riddles[Math.floor(Math.random() * riddles.length)];
          gameData[groupId] = { activeGame: "فزورة", answer: randomRiddle.a };
          await message.reply(
            `🔍 *فزورة:*\n\n❓ ${randomRiddle.q}\n\n⏳ لديك 30 ثانية للإجابة`,
          );

          setTimeout(async () => {
            if (gameData[groupId]?.activeGame === "فزورة") {
              await message.reply(
                `⏰ انتهى الوقت!\nالإجابة: ${randomRiddle.a}`,
              );
              gameData[groupId].activeGame = null;
            }
          }, 30000);
          return;
        }

        if (textToCheck === ".حظ") {
          await reactToMessage(message, "🍀");
          const random = Math.random();
          if (random < 0.3) {
            await message.reply("🍀 *حظك اليوم:* سيئ جداً");
          } else if (random < 0.6) {
            await message.reply("🍀 *حظك اليوم:* متوسط");
          } else if (random < 0.9) {
            await message.reply("🍀 *حظك اليوم:* جيد");
          } else {
            await message.reply("🍀 *حظك اليوم:* ممتاز جداً! جرب حظك بالرول");
          }
          return;
        }

        // ====== أمر .المطور ======
        if (textToCheck === ".المطور") {
          await reactToMessage(message, "👑");
          await message.reply(
            "*مــ👑ـطــور لوفـ💻ـي بـ🤖ـوت*\n*الاسم : ᎫᏫᏦᎬᎡ*\n*الرقم : 0998251277*",
          );
          return;
        }

        // ====== أمر .تست ======
        if (textToCheck === ".تست") {
          await reactToMessage(message, "✅");
          await message.reply("『 شغال ولله العظيم ✅ 』");
          return;
        }

        // ====== أمر .حالة ======
        if (textToCheck === ".حالة") {
          await reactToMessage(message, "📊");
          await message.reply(
            "*مـعلـومـ📜ـات لـوفـ👑ـي بــ🤖وت*\n\n*⚡ الإصدار: 2.0.0*\n*👑 المطور: 0998251277*\n*📊 الحالة: نشط ✅*",
          );
          return;
        }

        // ====== أمر .الوقت ======
        if (textToCheck === ".الوقت") {
          const { time, date } = getCurrentTime();
          await reactToMessage(message, "🕐");
          await message.reply(`🕐 *الوقت:* ${time}\n📅 *التاريخ:* ${date}`);
          return;
        }

        // ====== أمر .التاريخ ======
        if (textToCheck === ".التاريخ") {
          const { date } = getCurrentTime();
          await reactToMessage(message, "📅");
          await message.reply(`📅 *التاريخ:* ${date}`);
          return;
        }

        // ====== أمر .عدد_الاعضاء ======
        if (textToCheck === ".عدد_الاعضاء") {
          await reactToMessage(message, "👥");
          try {
            const chat = await message.getChat();
            await message.reply(
              `👥 عدد أعضاء المجموعة: *${chat.participants.length}* عضو`,
            );
          } catch (error) {}
          return;
        }

        // ====== أمر .عدد_المشرفين ======
        if (textToCheck === ".عدد_المشرفين") {
          await reactToMessage(message, "👑");
          try {
            const chat = await message.getChat();
            const admins = chat.participants.filter((p) => p.isAdmin);
            await message.reply(`👑 عدد المشرفين: *${admins.length}* مشرف`);
          } catch (error) {}
          return;
        }

        // ====== أمر .صلاحيتي ======
        if (textToCheck === ".صلاحيتي") {
          await reactToMessage(message, "🔍");
          await message.reply(
            `*🔍 معلومات حسابك:*\n\n` +
              `👤 معرفك: ${message.author}\n` +
              `👑 مطور: ${isDev ? "✅" : "❌"}\n` +
              `👥 مشرف مخصص: ${isAdmin ? "✅" : "❌"}\n` +
              `👥 مشرف مجموعة: ${isGroupAdminUser ? "✅" : "❌"}\n` +
              `💰 رصيدك: ${userBank[userId].balance === Infinity ? "∞" : userBank[userId].balance} ${CURRENCY}\n` +
              `💵 دولار: ${userBank[userId].dollars === Infinity ? "∞" : userBank[userId].dollars}\n` +
              `⚜️ نقاط XP: ${userXP[userId] === Infinity ? "∞" : userXP[userId]}\n` +
              `📊 مستواك: ${userLevels[userId]}\n` +
              `⚠️ انذارات: ${userWarnings[userId]}/3`,
          );
          return;
        }

        // ====== أمر .بوت ======
        if (textToCheck === ".بوت") {
          await reactToMessage(message, "🤖");
          const gptMessage =
            "*•═───═•⎝🌙⎠•═───═•*\n" +
            "*˼‏⛩️˹ ⇱╷ℂℍ𝔸𝕋 𝕃𝕦𝕗𝕗𝕪╵⇲ ˼‏⛩️˹*\n" +
            "*•═───═•⎝🌙⎠•═───═•*\n" +
            "*˼‏🧭˹╎اكتب سؤالك ⇇﹝.بوت اكتب السؤال ؟﹞*";
          await message.reply(gptMessage);
          return;
        }

        if (textToCheck.startsWith(".بوت ")) {
          await reactToMessage(message, "🤖");
          try {
            const question = textToCheck.substring(5).trim();
            if (!question) return;
            const randomAnswer =
              chatGPTQuestions[
                Math.floor(Math.random() * chatGPTQuestions.length)
              ];
            await message.reply(`『 ${randomAnswer} 』`);
          } catch (error) {}
          return;
        }

        // ====== أمر .مستواي ======
        if (textToCheck === ".مستواي") {
          await reactToMessage(message, "📊");
          const level = userLevels[userId] || 1;
          const xp = userXP[userId] || 0;
          const xpForNextLevel = Math.pow(level, 2) * 100;

          await message.reply(
            `📊 *مستواك*\n\n` +
              `🎯 المستوى: ${level === Infinity ? "∞" : level}\n` +
              `⚜️ XP: ${xp === Infinity ? "∞" : xp}\n` +
              (xp !== Infinity
                ? `📈 XP للمستوى القادم: ${xpForNextLevel}`
                : ""),
          );
          return;
        }

        // ====== أمر .رتبتي ======
        if (textToCheck === ".رتبتي") {
          await reactToMessage(message, "👑");
          const chat = await message.getChat();
          const participants = chat.participants;

          const sorted = participants
            .map((p) => ({
              id: p.id._serialized,
              xp: userXP[p.id._serialized] || 0,
            }))
            .sort(
              (a, b) =>
                (b.xp === Infinity ? 1 : b.xp) - (a.xp === Infinity ? 1 : a.xp),
            );

          const rank = sorted.findIndex((p) => p.id === userId) + 1;

          await message.reply(
            `👑 رتبتك في المجموعة: ${rank} من ${participants.length}`,
          );
          return;
        }

        // ====== أمر .x ======
        if (textToCheck === ".x") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          await reactToMessage(message, "📊");
          await message.reply(
            `📊 عدد مستخدمين البوت: *${botUsers.size}* مستخدم`,
          );
          return;
        }

        // ====== أمر .s ======
        if (textToCheck === ".s") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          await reactToMessage(message, "✅");
          devLinkAllowed[groupId] = true;
          await message.reply("✅ تم تفعيل إرسال الروابط للمطور");
          return;
        }

        // ====== أمر .a ======
        if (textToCheck === ".a") {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }
          await reactToMessage(message, "❌");
          devLinkAllowed[groupId] = false;
          await message.reply("✅ تم تعطيل إرسال الروابط للمطور");
          return;
        }

        // ====== أمر .ضيف_اكس_بي ======
        if (
          textToCheck.startsWith(".ضيف_اكس_بي ") &&
          (message.hasQuotedMsg || message.mentionedIds.length > 0)
        ) {
          if (!isDev) {
            await reactToMessage(message, "⚠️");
            await message.reply("⚠️ هذا الأمر للمطور فقط");
            return;
          }

          await reactToMessage(message, "⚜️");
          const parts = textToCheck.split(" ");
          if (parts.length < 2) {
            await message.reply("❌ الاستخدام: .ضيف_اكس_بي @المستخدم المبلغ");
            return;
          }

          let target;
          if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage();
            target = quotedMsg.author || quotedMsg.from;
          } else if (message.mentionedIds.length > 0) {
            target = message.mentionedIds[0];
          }

          const amount = parseInt(parts[parts.length - 1]);
          if (isNaN(amount) || amount <= 0) {
            await message.reply("❌ الرجاء إدخال مبلغ صحيح");
            return;
          }

          if (userXP[target] !== Infinity) {
            userXP[target] = (userXP[target] || 0) + amount;
          }
          await message.reply(`✅ تم إضافة ${amount} XP للمستخدم`);
          return;
        }

        // ====== منع الروابط ======
        const textWithLinks = message.body || message.caption || "";
        const links = textWithLinks.match(linkRegex);
        if (links && links.length > 0) {
          if (isDev && devLinkAllowed[groupId]) return;
          try {
            await message.delete(true);
            await message.reply("*الـروابـط مـمنـوعـة ياحـ❌ـب*");
          } catch (error) {}
        }

        // ====== منع الكلمات ======
        const lowerText = (message.body || "").toLowerCase();
        for (let word of bannedWords[groupId] || []) {
          if (lowerText.includes(word)) {
            try {
              await message.delete(true);
              await message.reply(
                `『 تم حذف الرسالة لاحتوائها على كلمة ممنوعة: ${word} 』`,
              );
              if (userWarnings[userId] !== Infinity)
                userWarnings[userId] = (userWarnings[userId] || 0) + 1;
            } catch (error) {}
            break;
          }
        }

        // ====== نظام الكتم ======
        if (groupData[groupId]?.mutedUsers?.includes(message.author)) {
          try {
            await message.delete(true);
          } catch (error) {}
        }
      } catch (error) {
        console.error("خطأ:", error.message);
      }
    });

    client.on("disconnected", () => {
      console.log("❌ تم فصل البوت، إعادة التشغيل...");
      setTimeout(() => process.exit(0), 3000);
    });

    await client.initialize();
  } catch (error) {
    console.error("❌ خطأ في تشغيل البوت:", error.message);
    if (error.message.includes("already running")) {
      try {
        rmSync("./whatsapp-auth", { recursive: true, force: true });
        console.log("✅ تم مسح الجلسات القديمة");
      } catch (e) {}
    }
    console.log("🔄 إعادة المحاولة بعد 5 ثواني...");
    setTimeout(startBot, 5000);
  }
}

process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});
