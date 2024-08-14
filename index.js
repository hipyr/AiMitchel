require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const { Client, IntentsBitField, ActivityType } = require('discord.js');
const openai = new OpenAI({apiKey: process.env.OPENAI});
let isRunning = false;
let isMitchelOn = true;

const threadMap = {};

const getOpenAiThreadId = (discordThreadId) => {

    return threadMap[discordThreadId];
}




const addThreadToMap = (discordThreadId, openAiThreadId) => {
    threadMap[discordThreadId] = openAiThreadId;
}
const terminalStates = ["cancelled", "failed", "completed", "expired"];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const statusCheckLoop = async (openAiThreadId, runId) => {
    const run = await openai.beta.threads.runs.retrieve(
        openAiThreadId,
        runId
    );

    if (terminalStates.indexOf(run.status) < 0){
        await sleep(1000);
        return statusCheckLoop(openAiThreadId, runId);
    }
    console.log(run);

    return run.status;
} 

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log("Ai Mitchel is on and working");

    client.user.setActivity({
        name: 'Start my responses by saying Hey Mitchel',
        type: ActivityType.Listening
    });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'turn-on') {
        isMitchelOn = !isMitchelOn;
        console.log(isMitchelOn);
        if (isMitchelOn) {
            await interaction.reply('You have turned on Ai Mitchel. To start talking to him, start your next chat message with "Hey Mitchel".');
        } else {
            await interaction.reply('Mitchel AI is now turned off and he will no longer respond to anything anymore.');
        }
    }
});
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content || message.content === '') return;
    if (message.content.toLowerCase().includes('hey mitchel') || message.mentions.has(client.user) && isRunning == false && isMitchelOn)  {
       isRunning = true;
        const discordThreadId = message.channel.id;
        let openAiThreadId = threadMap[discordThreadId];
        if(!openAiThreadId){
            const thread = await openai.beta.threads.create();
            openAiThreadId = thread.id;
            addThreadToMap(discordThreadId, openAiThreadId);
        }
        
        
        await openai.beta.threads.messages.create(
            openAiThreadId,
            {
                role: "user",
                content: message.content
            }
        );
        const run = await openai.beta.threads.runs.create(
            openAiThreadId,
            {assistant_id: 'asst_RVub4n2Wr143zIoyqJzxWRWt'}
        )
        await statusCheckLoop(openAiThreadId, run.id || run.runId);


        const messages = await openai.beta.threads.messages.list(openAiThreadId);
        const aiResponse = messages.data[0].content[0].text.value;
        // the file writing system to save the response to a file
        // fs.writeFile('response.json', JSON.stringify(aiResponse), (err) => err && console.error(err));
        // const spawn = require("child_process").spawn;
        // const pythonProcess = spawn('python', ["./texttospeech.py"]);
        // pythonProcess.stdout.on('data', (data) => {
        //     console.log(`Python script output: ${data}`);
        // });

        // pythonProcess.stderr.on('data', (data) => {
        //     console.error(`Python script error: ${data}`);
        // });
        isRunning = false;
        message.reply(aiResponse);
    }

});


client.login(process.env.TOKEN);
