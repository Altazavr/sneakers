const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const axios = require('axios').default;
const fs = require('fs').promises;
const roomDataFile = './room_data.json';

const bot = new Telegraf("6496350591:AAFHobmyE8EDVlEHK88IVpqpgPvuGWu2Wuw");
const { saveRoomData, deleteRoomData, joinRoom, leaveRoom, alreadyAdmin, alreadyMember, } = require("./roomUtils");

let commands = ['api', 'join_room', 'leave_room', 'create_room', 'delete_room', 'check_status'];
bot.help((ctx) => {
    ctx.reply(
        "Привет, я бот Алиша. Вот список доступных команд:\n/start - начать взаимодействие\n/help - показать это сообщение с подсказками\n/create_room <название> - создать новую комнату\n/join_room <название> - войти в существующую комнату\n/leave_room - покинуть текущую комнату\n/delete_room - удалить текущую комнату\n/api - просмотр погоды различных городов Казахстана"
    );
});

bot.command("api", (ctx) => {
    const apiKey = 'b6f5b36b3311476238f812d435872894';
    const city = 'Astana';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    axios.get(apiUrl)
        .then(response => {
            const data = response.data;
            console.log(data);
            ctx.reply(`Температура в городе ${city}: ${data.main.temp-273.15}°C`);
        })
        .catch(error => {
            console.error('Ошибка при получении данных:', error.response.data.message);
            ctx.reply('Ошибка при получении данных о погоде.');
        });
});
bot.command('join_room', async (ctx) => {
    const roomName = ctx.message.text.split(" ").slice(1).join(" ");
    await joinRoom(roomName, ctx);
});
bot.command('leave_room', async(ctx) => {
    await leaveRoom(ctx);
});
bot.command('create_room', async (ctx) => {
    const roomName = ctx.message.text.split(" ").slice(1).join(" ");
    await saveRoomData(roomName, [], ctx);
});
bot.command('delete_room', async (ctx) => {
    const roomName = ctx.message.text.split(" ").slice(1).join(" ");
    await deleteRoomData(roomName, ctx);
});
bot.on(message('text'), async (ctx) => {
    const userId = ctx.message.from.id;
    let hasCommand = false;
    for (let command of commands) {
        if (command === ctx.message.text.split(" ")[0]) {
            hasCommand = true;
            break;
        }
    }
    if (!hasCommand) {
        let roomData = [];
        try {
            const data = await fs.readFile('./room_data.json', 'utf-8');
            if (data) {
                roomData = JSON.parse(data);
            }
        } catch (error) {
            console.error('Ошибка чтения данных о комнатах:', error);
            return;
        }

        for (let room of roomData) {
            const isAdmin = room.creator.id === userId;
            const isMember = room.members.find(member => member.id === userId);

            if (isAdmin || isMember) {
                for (let member of room.members) {
                    try {
                        if (member.id !== userId) {
                            await ctx.telegram.sendMessage(member.id, `@${ctx.message.from.username}\n${ctx.message.text}`);
                        }
                        if (member.id === userId) {
                            member.messageCounter = member.messageCounter + 1;
                            member.lastMessage = new Date();
                        }
                    } catch (error) {
                        console.error('Ошибка отправки сообщения:', error);
                    }
                }
            }
        }
        // Теперь, когда все сообщения отправлены, обновим данные о комнатах в файле
        try {
            await fs.writeFile(roomDataFile, JSON.stringify(roomData, null, 2));
        } catch (error) {
            console.error('Ошибка записи данных о комнатах:', error);
        }
    }
});




bot.launch();
//тригерит именно на это await fs.writeFile(roomDataFile, JSON.stringify(roomData, null, 2));