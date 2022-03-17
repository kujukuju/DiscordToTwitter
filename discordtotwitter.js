const Discord = require('discord.js');
const Twitter = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');
const https = require('https');

// TODO
// delete tweets
// if you reply to a message it replies to the tweet and creates a thread or however that works
// maybe twitter long video if video is detected to be over 120 seconds but I dont think I care

const messageMap = {};

const discordkey = String(fs.readFileSync(path.join(__dirname, 'discordkey.txt')));
const twitterkey = String(fs.readFileSync(path.join(__dirname, 'twitterkey.txt'))).replaceAll('\r', '').split('\n');
const twitterApiKey = twitterkey[0];
const twitterApiSecret = twitterkey[1];
const twitterAccessToken = twitterkey[2];
const twitterAccessSecret = twitterkey[3];

const users = String(fs.readFileSync(path.join(__dirname, 'users.txt'))).replaceAll('\r', '').split('\n');
const channels = String(fs.readFileSync(path.join(__dirname, 'channels.txt'))).replaceAll('\r', '').split('\n');
const twitterHashtags = String(fs.readFileSync(path.join(__dirname, 'twitterhashtags.txt'))).replaceAll('\r', '').split('\n');
const tiktokHashtags = String(fs.readFileSync(path.join(__dirname, 'tiktokhashtags.txt'))).replaceAll('\r', '').split('\n');

const requiredTwitterHashtags = twitterHashtags[0] ? twitterHashtags[0].trim().split(' ') : [];
const optionalTwitterHashtags = twitterHashtags[1] ? twitterHashtags[1].trim().split(' ') : [];
const requiredTiktokHashtags = tiktokHashtags[0] ? tiktokHashtags[0].trim().split(' ') : [];
const optionalTiktokHashtags = tiktokHashtags[1] ? tiktokHashtags[1].trim().split(' ') : [];

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

    const text = message.content.replaceAll(/ <[@#!0-9a-zA-Z]+> /gi, ' ').replaceAll(/<[@#!0-9a-zA-Z]+> /gi, '').replaceAll(/ <[@#!0-9a-zA-Z]+>/gi, '').replaceAll(/<[@#!0-9a-zA-Z]+>/gi, '').trim();

    const hasAttachment = message.attachments.size > 0;
    const videoAttachments = [];
    const imageAttachments = [];

    if (!text && !hasAttachment) {
        channel.send('Empty message. Not posting.');
        return;
    }

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

    postToSocialMedia(channel, text, imageAttachments, videoAttachments);
});

discordClient.login(discordkey);

const twitterKeys = {
    appKey: twitterApiKey,
    appSecret: twitterApiSecret,
    accessToken: twitterAccessToken,
    accessSecret: twitterAccessSecret,
};

const twitterClient = new Twitter.TwitterApi(twitterKeys).readWrite;

const getPostInformationFromMessage = (message) => {

};

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

const postToSocialMedia = (channel, text, imageList, videoList) => {
    console.log('Posting to social media... ', text);

    if (imageList.length > 0) {
        postToTwitterImage(channel, text, imageList);
    } else if (videoList.length > 0) {
        postToTwitterVideo(channel, text, videoList);
        postToTiktokVideo(channel, text, videoList);
    } else {


        // TODO
        postToTiktokVideo(channel, text, videoList);


        postToTwitterText(channel, text);
    }
};

const postToTwitterText = async (channel, text) => {
    try {
        const hashtags = getHashtags(text) || generateTwitterHashtags();
        const finalText = getText(text, hashtags);

        const tweet = await twitterClient.v2.tweet(finalText);

        try {
            const me = await twitterClient.v2.me();
            channel.send('Posted tweet.\n' + 'https://twitter.com/' + me.data.id + '/status/' + tweet.data.id);
        } catch (error) {
            const detail = error?.data?.detail || error;
            channel.send('Failed to post tweet link.\n' + detail);
            console.error('Failed to post tweet link. ', detail);
        }
        // channel.send('Posted tweet.\n' + tweeted.data.text);
    } catch (error) {
        const detail = error?.data?.detail || error;
        channel.send('Failed to post tweet.\n' + detail);
        console.error('Failed to tweet. ', detail);
    }
};

const postToTwitterImage = async (channel, text, imageList) => {
    try {
        const twitterImages = await Promise.all(imageList.map(url => getTwitterMediaFromURL(url)));
        const hashtags = getHashtags(text) || generateTwitterHashtags();
        const finalText = getText(text, hashtags);

        const tweet = await twitterClient.v2.tweet(finalText, {
            media: {
                media_ids: twitterImages,
            },
        });

        try {
            const me = await twitterClient.v2.me();
            channel.send('Posted tweet.\n' + 'https://twitter.com/' + me.data.id + '/status/' + tweet.data.id);
        } catch (error) {
            const detail = error?.data?.detail || error;
            channel.send('Failed to post tweet link.\n' + detail);
            console.error('Failed to post tweet link. ', detail);
        }
    } catch (error) {
        const detail = error?.data?.detail || error;
        channel.send('Failed to post tweet.\n' + detail);
        console.error('Failed to tweet images. ', detail);
    }
};

const postToTwitterVideo = async (channel, text, videoList) => {
    try {
        const twitterVideo = await getTwitterMediaFromURL(videoList[0]);
        const hashtags = getHashtags(text) || generateTwitterHashtags();
        const finalText = getText(text, hashtags);

        const tweet = await twitterClient.v2.tweet(finalText, {
            media: {
                media_ids: [twitterVideo],
            },
        });

        try {
            const me = await twitterClient.v2.me();
            channel.send('Posted tweet.\n' + 'https://twitter.com/' + me.data.id + '/status/' + tweet.data.id);
        } catch (error) {
            const detail = error?.data?.detail || error;
            channel.send('Failed to post tweet link.\n' + detail);
            console.error('Failed to post tweet link. ', detail);
        }
    } catch (error) {
        if (error.code === 400) {
            const detail = error?.data?.detail || error;
            channel.send('Failed to post tweet.\n' + detail + '\nhttps://help.twitter.com/en/using-twitter/twitter-videos');
            console.error('Failed to tweet videos. ', detail);
        } else {
            const detail = error?.data?.detail || error;
            channel.send('Failed to post tweet.\n' + detail);
            console.error('Failed to tweet videos. ', detail);
        }
    }
};

const getTwitterMediaFromURL = async (url) => {
    const buffer = await getBufferFromURL(url);
    if (!buffer) {
        return;
    }

    // console.log('buffer ', buffer.toString('base64'));

    try {
        return await twitterClient.v1.uploadMedia(buffer, {mimeType: getMimeTypeFromURL(url)});
    } catch (error) {
        console.error('Could not upload media. ', error);
        return null;
    }
    
    // return await twitterClient.v1.uploadMedia(buffer, {mimeType: getMediaTypeFromURL(url)});
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

const getText = (text, hashtags) => {
    const results = text.match(/(#[a-zA-Z0-9_]*[ ]*)+$/gi);
    if (results) {
        text = text.replaceAll(results[0], '');
    }

    return text.trim() + '\n' + hashtags.join(' ');
};

const getHashtags = (text) => {
    if (text.endsWith('$')) {
        return [];
    }

    const results = text.match(/(#[a-zA-Z0-9_]*[ ]*)+$/gi);
    const individual = results ? results[0].split(' ') : null;
    if (individual) {
        for (let i = individual.length - 1; i >= 0; i--) {
            if (individual[i] === '#') {
                individual.splice(i, 1);
            }
        }
    }

    return individual;
};

const postToTiktokVideo = async (channel, text, videoList) => {

};