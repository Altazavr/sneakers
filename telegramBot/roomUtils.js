const fs = require("fs").promises
const roomDataFile = './room_data.json';
//ошибка с isMember и isAdmin т.к. оно underfind типо не найдено а в проверке по факту ты на true проверяешь и на false;
async function saveRoomData(roomName, members, ctx) {
    try {
        const userId = ctx.message.from.id;
        const username = ctx.message.from.username;
        const timestamp  = new Date(ctx.message.date);

        let roomData = [];
        const data = await fs.readFile(roomDataFile, 'utf-8');

        if (data) {
            roomData = JSON.parse(data);
        }
        const existRoom = roomData.find(room => room.name === roomName);
        if(existRoom) {
            ctx.reply('Комната с данным именем уже существует');
            return;
        }
        roomData.push({ 
            name: roomName, 
            creator: {
                name: username, 
                id: userId,
                time: timestamp
            }, 
            members: members
        });
        ctx.reply('Комната успешно создана');
        await fs.writeFile(roomDataFile, JSON.stringify(roomData, null, 2));
        return; //
    } catch (error) {
        console.error("Ошибка сохранения данных комнаты:", error);
    }
}
async function deleteRoomData(roomName, ctx) {
    try {
        let userId = ctx.message.from.id;

        let roomData = [];
        const data = await fs.readFile(roomDataFile, 'utf-8');

        if (data) {
            roomData = JSON.parse(data);
        }

        const index = await roomData.findIndex(room => room.name === roomName);
        
        const isAdmin = await alreadyAdmin(userId, ctx);
        
        if(index !== -1 && isAdmin === true) {
            roomData.splice(index, 1);
            ctx.reply('Комната успешно удалена');
            await fs.writeFile(roomDataFile, JSON.stringify(roomData, null, 2));
            return;
        } else {
            ctx.reply('Комната с данным названием не найдена или вы не являетесь админом этой комнаты');
            return;
        }
    } catch (error) {
        console.error("Ошибка удаления данных комнаты:", error);
    }
}
async function alreadyAdmin(userId, ctx) {
    try {
        let roomData = [];
        const data = await fs.readFile(roomDataFile, 'utf-8');

        if (data) {
            roomData = JSON.parse(data);
        }

        for (const room of roomData) {
            const isAdmin = room.creator.id === userId;

            if (isAdmin) {
                ctx.reply(`Вы являетесь админом комнаты ${room.name}`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Ошибка при проверке Админа в комнатах:", error);
        ctx.reply('Произошла ошибка при проверке Админа в комнатах.');
        return false;
    }
}
async function alreadyMember(userId, ctx) {
    try {
        let roomData = [];
        const data = await fs.readFile(roomDataFile, 'utf-8');

        if (data) {
            roomData = JSON.parse(data);
        }

        for (const room of roomData) {
            console.log('До ошибки')
            const isMember = room.members.find(member => member.id === userId);
            console.log('после ошибки')
            if (isMember) {
                ctx.reply(`Вы являетесь участником комнаты ${room.name} и не можете вступить в комнату.`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Ошибка при проверке участия в комнатах:", error);
        ctx.reply('Произошла ошибка при проверке участия в комнатах.');
        return false;
    }
}
async function joinRoom(roomName, ctx) {
    try {
        const userId = ctx.message.from.id;
        const username = ctx.message.from.username;
        const timestamp = new Date(ctx.message.date);

        let roomData = [];
        const data = await fs.readFile(roomDataFile, 'utf-8');
        console.log(data);
        if (data) {
            roomData = JSON.parse(data);
        }

        const roomExist = roomData.find(room => room.name === roomName);

        if (!roomExist) {
            ctx.reply('Комната с таким названием не существует, поэтому вы не можете вступить в нее');
            return;
        }

        const isAdmin = await alreadyAdmin(userId, ctx);
        if (isAdmin) {
            return;
        }

        const isMember = await alreadyMember(userId, ctx);
        if (isMember) {
            return;
        }
        roomExist.members.push({
            name: username,
            id: userId,
            timestamp: timestamp,
            messageCounter: 0,
            lastMessage: new Date()
        });
        await fs.writeFile(roomDataFile, JSON.stringify(roomData, null, 2));
        ctx.reply('Вы успешно присоединились к комнате.');
    } catch (error) {
        console.error("Ошибка при присоединении к комнате:", error);
        ctx.reply('Произошла ошибка при присоединении к комнате.');
    }
}
async function leaveRoom(ctx) {
    const userId = ctx.message.from.id;
    const username = ctx.message.from.username;
    
    let roomData = [];
    const data = await fs.readFile(roomDataFile, 'utf-8');

    if (data) {
        roomData = JSON.parse(data);
    }

    for (const room of roomData) {
        const userIndex = room.members.findIndex(member => member.id === userId);

        if (room.creator.id === userId) {
            return ctx.reply('Вы не можете покидать комнату, так как вы ее администратор. Вы можете удалить комнату, если это необходимо.');
        }

        if (userIndex !== -1) {
            room.members.splice(userIndex, 1);
            await fs.writeFile(roomDataFile, JSON.stringify(roomData, null, 2));
            return ctx.reply('Вы успешно покинули комнату.');
        }
    }

    ctx.reply('Вы не состоите в какой-либо комнате.');
}

module.exports = {
    saveRoomData,
    deleteRoomData,
    joinRoom,
    leaveRoom,
    alreadyAdmin,
    alreadyMember
};