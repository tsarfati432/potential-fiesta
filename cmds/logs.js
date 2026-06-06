const { EmbedBuilder } = require('discord.js');

// Replace this with your actual hidden log channel ID
const LOGS_CHANNEL_ID = '1512055443600707666'; 

module.exports = {
    async handleMessageDelete(message) {
        if (message.partial || message.author?.bot) return;

        const logChannel = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#F23F43') // Red for deletion
            .setAuthor({ 
                name: message.author.tag, 
                iconURL: message.author.displayAvatarURL({ dynamic: true }) 
            })
            .setTitle('🗑️ Message Deleted')
            .setDescription(`**User:** ${message.author} (\`${message.author.id}\`)\n**Channel:** ${message.channel}`)
            .addFields({ 
                name: '📌 Content', 
                value: message.content.substring(0, 1024) || '*[No text content (likely an embed or image)]*' 
            })
            .setTimestamp();

        // Catch attachments if there were any
        if (message.attachments.size > 0) {
            const attachmentUrls = message.attachments.map(a => a.url).join('\n');
            embed.addFields({ name: '🖼️ Attachments Included', value: attachmentUrls.substring(0, 1024) });
        }

        await logChannel.send({ embeds: [embed] }).catch(err => console.error('Logging Error:', err));
    },

    async handleMessageUpdate(oldMessage, newMessage) {
        if (oldMessage.partial || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;

        const logChannel = oldMessage.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#FEE75C') // Yellow for edits
            .setAuthor({ 
                name: oldMessage.author.tag, 
                iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }) 
            })
            .setTitle('📝 Message Edited')
            .setDescription(`**User:** ${oldMessage.author} (\`${oldMessage.author.id}\`)\n**Channel:** ${oldMessage.channel}\n[Go to Message](${newMessage.url})`)
            .addFields(
                { name: '❌ Before', value: oldMessage.content.substring(0, 1024) || '*[Empty]*' },
                { name: '✅ After', value: newMessage.content.substring(0, 1024) || '*[Empty]*' }
            )
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(err => console.error('Logging Error:', err));
    }
};