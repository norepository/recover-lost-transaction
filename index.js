import fetch from "node-fetch";
import {
    Webhook,
    MessageBuilder
} from 'discord-webhook-node';

const hook_fail = new Webhook('INSERT-WEBHOOK-HERE');
const hook_success = new Webhook('INSERT-WEBHOOK-HERE');
const hook_end = new Webhook('INSERT-WEBHOOK-HERE');
const api = 'INSERT-MORALIS-API-HERE'; //get moralis api --> https://moralis.io/

const start_block = SET-START-BLOCK;
const end_block = SET-END-BLOCK;
const amount = 'SET-AMOUNT'; //Here you have to set numbers that script will check in transactions values
let current_block = 0;
let first_time = false;
let analyzed_blocks = 0;
let tx_each_100blocks = 0;

async function getBlock() {
    if (first_time == false) {
        current_block = start_block;
        first_time = true;
    }
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'X-API-KEY': api
        }
    };
    const url = `https://deep-index.moralis.io/api/v2/block/${current_block}?chain=eth`;
    const response = await fetch(url, options);
    const data = await response.json();
    const tx_number = parseInt(data.transaction_count);
    tx_each_100blocks += tx_number;
    let mmm = 0;
    const url_time = 'http://worldtimeapi.org/api/timezone/Europe/Rome';
    const response_time = await fetch(url_time);
    const time_data = await response_time.json();
    let timestamp = time_data.datetime;
    timestamp = timestamp.slice(11,-11);
    for (let index = 0; index < tx_number; index++) {
        let value = data.transactions[index].value;
        let check = value.search(amount);
        if ( check != -1) {
            //console.log(data.transactions[index].hash);
            sendWebhookSUCCESS(data.transactions[index].hash, data.transactions[index].value, timestamp);
            mmm += 1;
        }
    }
    if (mmm == 0 && analyzed_blocks == 100) {
        sendWebhookFAIL(timestamp);
        analyzed_blocks = 0;
        tx_each_100blocks = 0;
    }
    console.log(`[${timestamp}] Just checked block ${current_block} (${end_block-current_block} blocks to block ${end_block})`);
    if (current_block == end_block) {
        sendWebhookEND();
    }
    current_block += 1;
    analyzed_blocks += 1;

}

async function sendWebhookSUCCESS(hash, value, timestamp) {
    const embed = new MessageBuilder()
        .setTitle('Found something!')
        //.setAuthor('Author here', 'https://cdn.discordapp.com/embed/avatars/0.png')
        .setURL(`https://etherscan.io/tx/${hash}`)
        .addField('ㅤ', `Found a transaction with ${value} wei as value`)
        .addField('ㅤ', `Tx hash: [${hash}](https://etherscan.io/tx/${hash})`)
        .setColor('#00b0f4')
        //.setImage()
        //.setThumbnail()
        //.setDescription('Oh look a description :)')
        .setTimestamp();

    hook_success.send(embed)
        .then(() => console.log(`[${timestamp}]Found something, check discord!`))
        .catch(err => console.log(err.message));
}

async function sendWebhookFAIL(timestamp) {
    let previous = current_block - 100;
    const embed = new MessageBuilder()
        .setTitle(`Nothing found in blocks between ${previous} and ${current_block}`)
        //.setAuthor('Author here', 'https://cdn.discordapp.com/embed/avatars/0.png')
        .setURL(`https://etherscan.io/block/${current_block}`)
        .addField('ㅤ', `Went thru ${tx_each_100blocks} txs but found nothing :-(`)
        .setColor('#00b0f4')
        //.setImage()
        //.setThumbnail()
        //.setDescription('Oh look a description :)')
        .setTimestamp();

    hook_fail.send(embed)
        .then(() => console.log(`[${timestamp}]Just analyzed block ${current_block}, sent backup webhook`))
        .catch(err => console.log(err.message));
}

async function sendWebhookEND() {
    const embed = new MessageBuilder()
        .setTitle(`Analyzed all blocks to ${current_block}`)
        //.setAuthor('Author here', 'https://cdn.discordapp.com/embed/avatars/0.png')
        .setURL(`https://etherscan.io/block/${current_block}`)
        .addField('ㅤ', `End block was set as ${end_block} and now we are at ${current_block}`)
        .setColor('#00b0f4')
        //.setImage()
        //.setThumbnail()
        //.setDescription('Oh look a description :)')
        .setTimestamp();

    hook_end.send(embed)
        .then(() => console.log(`Ended blocks`))
        .catch(err => console.log(err.message));
}

//getBlock();
setInterval(getBlock, 1600);
