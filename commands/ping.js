module.exports={
    name:'ping',
    description: "ping",
    execute(message, interaction, args){
        message.channel.send(`🏓Latency is ${(Date.now() - message.createdTimestamp)*-1 }ms`);
        }
      };
console.log("Loaded command: " + module.exports.name)