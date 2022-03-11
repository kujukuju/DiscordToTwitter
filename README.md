Create `discordkey.txt` in the root folder of the project.
Put your discord secret key in there.

Create `twitterkey.txt` in the root folder of the project.
Put your twitter api key, api secret, access token, and access secret in here.
For example:
```text
api key
api secret
access token
access secret
```

You must apply for elevated twitter API access in order to upload media.
https://developer.twitter.com/en/portal/products/elevated

Edit `users.txt` to add the users you want to be able to post twitter content.

Create `channels.txt` in the root folder of the project.
Put the name or names of the text channel to tweet from.
For example:
```text
updates
messages
```

Create `twitterhashtags.txt` in the root folder of the project.
Put the required hashtags in the first line.
Put the optional (randomly selected) hashtags in the second line.
For example:
```text
#indiedev #gamedev
#pixelart
```

Create `tiktokhashtags.txt` in the root folder of the project.
Put the required hashtags in the first line.
Put the optional (randomly selected) hashtags in the second line.
For example:
```text
#indiedev #gamedev
#pixelart
```

You can also add hashtags to posts by putting them at the end of your message.

---

Go create a discord bot and copy the client ID.

Navigate to https://discord.com/api/oauth2/authorize?client_id=[CLIENT_ID ]&permissions=67648&scope=bot and add your bot to your server. Be sure to swap out your `[CLIENT_ID]`.
