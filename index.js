const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const config = require('./config.json');
const { Player } = require('discord-player');
const time = require('./modules/time.js');

const timestamp =  time.datetime(new Date())

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
  console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Error emitted from the queue: ${error.message}`+'\n' ,function(err){
    if(err) throw err;
  });
});

player.on('connectionError', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Error emitted from the connection: ${error.message}`+'\n' ,function(err){
    if(err) throw err;
  });
});

player.on('trackStart', (queue, track) => {
  queue.metadata.send(`🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
  console.log(`[${queue.guild.name}]: trackStart - [${track.title}]`);
  client.user.setActivity(`${track.title}`, { type: 'PLAYING' });
  
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: trackStart - [${track.title}] (Channel: ${queue.connection.channel.name})`+'\n' ,function(err){
    if(err) throw err;
  });
});

player.on('trackEnd', (queue, track) => {
  console.log(`[${queue.guild.name}]: trackEnd - [${track.title}]`);
  client.user.setActivity(`nothing`, { type: 'PLAYING' });

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: trackEnd - [${track.title}] (Channel: ${queue.connection.channel.name})`+'\n' ,function(err){
    if(err) throw err;
  });
})

player.on('trackAdd', (queue, track) => {
  queue.metadata.send(`🎶 | Track **${track.title}** queued!`);
  console.log(`[${queue.guild.name}] trackAdd - [${track.title}]`);
  
  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: trackAdd - [${track.title}] (Channel: ${queue.connection.channel.name})`+'\n' ,function(err){
    if(err) throw err;
  });
});

player.on('botDisconnect', queue => {
  queue.metadata.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
  console.log(`[${queue.guild.name}] botDisconnect (manual)`);
  client.user.setActivity(`nothing`, { type: 'PLAYING' });

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Manual Disconnect (Disconnected from the channel: ${queue.connection.channel.name})`+'\n' ,function(err){
    if(err) throw err;
  });
});

player.on('channelEmpty', queue => {
  queue.metadata.send('❌ | Nobody is in the voice channel, leaving...');
  console.log(`[${queue.guild.name}] channelEmpty`);
  client.user.setActivity(`nothing`, { type: 'PLAYING' });

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Channel empty (Disconnected from the channel: ${queue.connection.channel.name})`+'\n' ,function(err){
    if(err) throw err;
  });
});

player.on('queueEnd', queue => {
  queue.metadata.send('✅ | Queue finished!');
  console.log(`[${queue.guild.name}] queueEnd`);
  client.user.setActivity(`nothing`, { type: 'PLAYING' });

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: [${queue.guild.name}]: Queue Finished (Channel: ${queue.connection.channel.name})`+'\n' ,function(err){
    if(err) throw err;
  });
});

client.once('ready', async () => {
  console.log('Ready!');

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: The bot is ready!`+'\n' ,function(err){
    if(err) throw err;
  });
});

client.on('ready', function() {
  client.user.setActivity(config.activity, { type: config.activityType });
  console.log('setActivity: Ready!');

  fs.appendFile(`./logs/botlog.txt`, `[${timestamp}]: The bot's activity is ready!`+'\n' ,function(err){
    if(err) throw err;
  });
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});


client.on('messageCreate', async message => {

  let logdata = `[${timestamp}]: [${message.guild}] - [${message.channel.name}]: (${message.author.username},${message.author}):`+message.content
  
  fs.appendFile(`./logs/${message.guild}.txt`, logdata+'\n' ,function(err){
    if(err) throw err;
    console.log(`Logged a message from:(${message.author.username},${message.author}) in: [${message.guild}]`)
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
console.log("Logged in with id: "+"["+config.applicationID+"]");