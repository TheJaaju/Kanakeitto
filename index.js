const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const config = require('./config.json');
const { Player } = require('discord-player');
const time = require('./modules/time.js');
const prettyMilliseconds = require("pretty-ms");

const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Default Activity
config.activityType = "PLAYING";
config.activity = "nothing";

const player = new Player(client);

player.on('error', (queue, error) => {
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Error emitted from the queue: ${error.message}`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: Error emitted from the queue: ${error.message}`)
  });
});

player.on('connectionError', (queue, error) => {
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Error emitted from the connection: ${error.message}`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: Error emitted from the connection: ${error.message}`)
  });
});

player.on('trackStart', (queue, track) => {
  queue.metadata.send(`🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
  client.user.setActivity(`${track.title}`, { type: 'PLAYING' });
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: trackStart - [${track.title}]`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: trackStart - [${track.title}]`)
  });
});

player.on('trackEnd', (queue, track) => {
  client.user.setActivity(`nothing`, { type: 'PLAYING' });
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: trackEnd - [${track.title}]`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: trackEnd - [${track.title}]`)
  });
})

player.on('trackAdd', (queue, track) => {
  queue.metadata.send(`🎶 | Track **${track.title}** queued!`);
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}] trackAdd - [${track.title}]`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: trackAdd - [${track.title}]`)
  });
});

player.on('botDisconnect', queue => {
  queue.metadata.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
  client.user.setActivity(`nothing`, { type: 'PLAYING' });
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}] - botDisconnect (manual)`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: - botDisconnect (manual)`)
  });
});

player.on('channelEmpty', queue => {
  queue.metadata.send('❌ | Nobody is in the voice channel, leaving...');
  client.user.setActivity(`nothing`, { type: 'PLAYING' });
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: - channelEmpty`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: - channelEmpty`)
  });
});

player.on('queueEnd', queue => {
  queue.metadata.send('✅ | Queue finished!');
  client.user.setActivity(`nothing`, { type: 'PLAYING' });
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Queue ended`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: [${queue.guild.name}]: Logged: Player queue has ended`)
  });
});

client.once('ready', async () => {
  console.log('Ready!');
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: Client ready! (client.once)`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: Logged: Client once Ready`)
  });
});

client.on('ready', function() {
  client.user.setActivity(config.activity, { type: config.activityType });
  console.log('setActivity: Ready!');
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: Client Ready (Client.on)`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: Logged: Client on Ready`)
  });
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: Bot Reconnected`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: Logged a bot reconnect`)
  });
});

client.once('disconnect', () => {
  console.log('Disconnect!');
  const timestamp =  time.datetime(new Date())
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: Bot Disconnected`+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: Logged a bot disconnect`)
  });
});


client.on('messageCreate', async message => {
  // Refresh timestamp module (./modules/time.js)
  const timestamp =  time.datetime(new Date())

  // Message logging
  let logdata = `[${timestamp}]: [${message.guild}] - [${message.channel.name}]: (${message.author.username},${message.author}):`+message.content
  
  let guildlogfolder = `./logs/${message.guild}`;
  let channelLogfolder = `./logs/${message.guild}/${message.channel.name}`;
  let channelEmbedLogfolder = `./logs/${message.guild}/${message.channel.name}/files/`;

  // Create directories
  if (!fs.existsSync(guildlogfolder)){
    fs.mkdirSync(guildlogfolder);
  }
  if (!fs.existsSync(channelLogfolder)){
    fs.mkdirSync(channelLogfolder);
  }
  if (!fs.existsSync(channelEmbedLogfolder)){
    fs.mkdirSync(channelEmbedLogfolder);
  }
  // Write log
  fs.appendFile(`./logs/${message.guild}/${message.channel.name}/messages.txt`, logdata+'\n' ,function(err){
    if(err) throw err;
    console.log(`[${timestamp}]: Logged a message from:(${message.author.username},${message.author}) in: [${message.guild}]: ${message.content}`)
  });

  if (message.author.bot || !message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content === config.prefix+'deploy' && message.author.id === client.application?.owner?.id) {
    await message.guild.commands
      .set(client.commands)
      .then(() => {
        message.reply('Deployed!');
      })
      .catch(err => {
        message.reply('Could not deploy commands! Make sure the bot has the application.commands permission!');
        console.error(err);
      });
  }

  if (message.content == config.prefix+"inv-link") {
    message.channel.send("Invite: https://discordapp.com/oauth2/authorize?&client_id="+config.applicationID+"&scope=bot&permissions=8")
    return;
  }
  if (message.content === config.prefix+"ac-link") {
    message.channel.send("Application Commands: https://discord.com/api/oauth2/authorize?client_id="+config.applicationID+"&scope=applications.commands")
    return;
  }
  if (message.content === config.prefix+"uptime") {
    message.channel.send(`Uptime: ${prettyMilliseconds(client.uptime)}`)
    return;
  }

});

client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());
  try {
    if (interaction.commandName == 'ban' || interaction.commandName == 'userinfo') {
      command.execute(interaction, client);
    } else {
      command.execute(interaction, player);
    }
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: 'There was an error trying to execute that command!',
    });
  }
});

client.login(config.token);
const timestamp =  time.datetime(new Date())
fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: Client logged in with id [${config.applicationID}]`+'\n' ,function(err){
  if(err) throw err;
  console.log(`[${timestamp}]: Client logged in with id [${config.applicationID}]`)
});
