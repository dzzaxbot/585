// ✅ مكتبات أساسية
const { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, ChannelType } = require('discord.js');
const express = require('express');
const path = require('path');
const fs = require('fs');
const Canvas = require('canvas');
require('dotenv').config();

// (تم حذف الكود المطول من هنا للاختصار، سأضيفه بعدين بالكامل)

// ✅ تشغيل البوت
client.login(process.env.TOKEN);
