const Discord = require('discord.js');
const Twitter = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');
const https = require('https');

// TODO
// delete tweets
// if you reply to a message it replies to the tweet and creates a thread or however that works
// maybe twitter long video if video is detected to be over 120 seconds but I dont think I care

const discordkey = String(fs.readFileSync(path.join(__dirname, 'discordkey.txt')));
const twitterkey = String(fs.readFileSync(path.join(__dirname, 'twitterkey.txt'))).replaceAll('\r', '').split('\n');
const twitterApiKey = twitterkey[0];
const twitterApiSecret = twitterkey[1];
const twitterAccessToken = twitterkey[2];
const twitterAccessSecret = twitterkey[3];

console.log(twitterkey);

const users = String(fs.readFileSync(path.join(__dirname, 'users.txt'))).replaceAll('\r', '').split('\n');
const channels = String(fs.readFileSync(path.join(__dirname, 'channels.txt'))).replaceAll('\r', '').split('\n');
const twitterHashtags = String(fs.readFileSync(path.join(__dirname, 'twitterhashtags.txt'))).replaceAll('\r', '').split('\n');
const tiktokHashtags = String(fs.readFileSync(path.join(__dirname, 'tiktokhashtags.txt'))).replaceAll('\r', '').split('\n');

const requiredTwitterHashtags = twitterHashtags[0] ?? [];
const optionalTwitterHashtags = twitterHashtags[1] ?? [];
const requiredTiktokHashtags = tiktokHashtags[0] ?? [];
const optionalTiktokHashtags = tiktokHashtags[1] ?? [];

const discordClient = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS]});

discordClient.on('ready', () => {
    console.log('Logged in as ' + discordClient.user.tag + '.');
});

discordClient.on('messageCreate', message => {
    const guildID = message.guildId;
    const channelID = message.channelId;

    if (!isValidDiscordUser(message.author.username, message.author.discriminator)) {
        return;
    }

    const guild = discordClient.guilds.resolve(guildID);
    if (!guild) {
        return;
    }

    const channel = guild.channels.resolve(channelID);
    if (!channel) {
        return;
    }

    if (!isValidDiscordChannel(channel.name)) {
        return;
    }

    const text = message.content.replaceAll(/<[@#!0-9a-zA-Z]+>/gi, '').trim();

    const hasAttachment = message.attachments.size > 0;
    const videoAttachments = [];
    const imageAttachments = [];

    message.attachments.forEach(attachment => {
        const url = attachment.attachment;

        if (isVideoURL(url)) {
            videoAttachments.push(url);
        }

        if (isImageURL(url)) {
            imageAttachments.push(url);
        }
    });

    if (videoAttachments.length > 1) {
        channel.send('You cannot post to social media with more than 1 video. Not posting.');
        return;
    }

    if (imageAttachments.length > 4) {
        channel.send('You cannot post to social media with more than 4 images. Not posting.');
        return;
    }

    if (videoAttachments.length > 0 && imageAttachments.length > 0) {
        channel.send('You cannot post to social media with both images and videos. Not posting.');
        return;
    }

    if (hasAttachment && videoAttachments.length === 0 && imageAttachments.length === 0) {
        channel.send('Invalid attachment type. Must be correct format of video or images. Not posting.');
        return;
    }

    postToSocialMedia(text, imageAttachments, videoAttachments);
});

discordClient.login(discordkey);

const twitterKeys = {
    appKey: twitterApiKey,
    appSecret: twitterApiSecret,
    accessToken: twitterAccessToken,
    accessSecret: twitterAccessSecret,
};
// const twitterKeys = {
//     clientId: twitterApiKey,
//     clientSecret: twitterApiSecret,
// };
const twitterClient = new Twitter.TwitterApi(twitterKeys).readWrite;
Twitter.TwitterApiV2Settings.debug = true;

const generateTwitterHashtags = () => {
    const selectedTags = [];
    for (let i = 0; i < requiredTwitterHashtags.length; i++) {
        selectedTags.push(requiredTwitterHashtags[i]);
    }

    const optionalTagList = [];
    for (let i = 0; i < optionalTwitterHashtags.length; i++) {
        optionalTagList.push(optionalTwitterHashtags[i]);
    }

    const selectedOptionalCount = Math.floor(Math.random() * optionalTwitterHashtags.length);
    for (let i = 0; i < selectedOptionalCount; i++) {
        const index = Math.floor(Math.random() * optionalTagList.length);
        selectedTags.push(optionalTagList[index]);

        optionalTagList.splice(index, 1);
    }

    return selectedTags;
};

const generateTiktokHashtags = () => {
    const selectedTags = [];
    for (let i = 0; i < requiredTiktokHashtags.length; i++) {
        selectedTags.push(requiredTiktokHashtags[i]);
    }

    const optionalTagList = [];
    for (let i = 0; i < optionalTiktokHashtags.length; i++) {
        optionalTagList.push(optionalTiktokHashtags[i]);
    }

    const selectedOptionalCount = Math.floor(Math.random() * optionalTiktokHashtags.length);
    for (let i = 0; i < selectedOptionalCount; i++) {
        const index = Math.floor(Math.random() * optionalTagList.length);
        selectedTags.push(optionalTagList[index]);

        optionalTagList.splice(index, 1);
    }

    return selectedTags;
};

const isVideoURL = (url) => {
    url = url.toLowerCase();

    let valid = false;
    valid = valid || url.endsWith('mp4');
    // im not sure if this will work because the only mimeType video enum I saw in this library was for mp4
    // valid = valid || url.endsWith('mov');
    // valid = valid || url.endsWith('webm');

    return valid;
};

const isImageURL = (url) => {
    url = url.toLowerCase();

    let valid = false;
    valid = valid || url.endsWith('png');
    valid = valid || url.endsWith('jpg');
    valid = valid || url.endsWith('jpeg');
    valid = valid || url.endsWith('gif');

    return valid;
};

const isValidDiscordChannel = (channel) => {
    for (let i = 0; i < channels.length; i++) {
        if (channels[i] === channel) {
            return true;
        }
    }

    return false;
};

const isValidDiscordUser = (username, discriminator) => {
    for (let i = 0; i < users.length; i++) {
        if (users[i].toLowerCase() === username.toLowerCase() + '#' + discriminator) {
            return true;
        }
    }

    return false;
};

const postToSocialMedia = (text, imageList, videoList) => {
    console.log('Posting to social media... ', text);

    if (imageList.length > 0) {
        postToTwitterImage(text, imageList);
    }
    
    if (videoList.length > 0) {

    }
};

const postToTwitterText = (text) => {

};

const postToTwitterImage = async (text, imageList) => {
    const twitterImages = [await twitterClient.v1.uploadMedia('./unknown.png')];
    // const twitterImages = await Promise.all(imageList.map(url => getTwitterMediaFromURL(url)));
    const hashtags = generateTwitterHashtags();

    console.log('Posting twitter image link.');
    console.log(text);
    console.log(hashtags);
    console.log(twitterImages);
    // twitterClient.v2.tweet(text, {});
};

const postToTwitterVideo = (text, videoList) => {

};

const getTwitterMediaFromURL = async (url) => {
    const buffer = await getBufferFromURL(url);
    if (!buffer) {
        return;
    }

    console.log('buffer ', buffer);
    
    return await twitterClient.v1.uploadMedia(buffer, {mimeType: getMimeTypeFromURL(url)});
};

const getBufferFromURL = async (url) => {
    return await new Promise((resolve, reject) => {
        https.get(url, response => {
            const data = [];
            response.on('data', chunk => {
                data.push(chunk);
            });
            response.on('end', () => {
                resolve(Buffer.concat(data));
            });
        }).on('error', error => {
            console.error('Could not retrieve media data. ', url, error);
            reject();
        });
    });
};

const getMimeTypeFromURL = (url) => {
    url = url.toLowerCase();

    // Jpeg
    // Mp4
    // Gif
    // Png
    // Srt
    // Webp

    if (url.endsWith('mp4')) {
        return Twitter.EUploadMimeType.Mp4;
    } else if (url.endsWith('png')) {
        return Twitter.EUploadMimeType.Png;
    } else if (url.endsWith('jpg')) {
        return Twitter.EUploadMimeType.Jpeg;
    } else if (url.endsWith('jpeg')) {
        return Twitter.EUploadMimeType.Jpeg;
    } else if (url.endsWith('gif')) {
        return Twitter.EUploadMimeType.Gif;
    }

    return null;
};