const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');

const pendingFeedback = new Map();

module.exports = {
    async handleMessage(message) {
        if (message.content !== '!feedback_create') return;

        const allowedRoleId = '1511776345343000747'; 
        if (!message.member.roles.cache.has(allowedRoleId)) return;

        const embed = new EmbedBuilder()
            .setColor('#1E1F22')
            .setTitle('📝 Share Your Feedback')
            .setDescription('Help us improve the server! Click the button below to open a private form and submit your ideas, feedback, or suggestions directly to the staff team.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_feedback_modal_btn')
                .setLabel('Submit Feedback')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📩')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    },

    async handleButton(interaction) {
        const { customId, member, guild } = interaction;
        const feedbackChannelId = '1511809673098166443'; 

        if (customId === 'open_feedback_modal_btn' || customId === 'log_feedback_action_btn') {
            const modal = new ModalBuilder()
                .setCustomId('feedback_form_modal')
                .setTitle('Feedback Form');

            const textInput = new TextInputBuilder()
                .setCustomId('feedback_main_text')
                .setLabel('Your Message')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Type your suggestions or thoughts here...')
                .setMinLength(1)
                .setMaxLength(1000)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(textInput));
            return interaction.showModal(modal);
        }

        if (customId === 'submit_feedback_public' || customId === 'submit_feedback_anon') {
            const userId = member.id;
            const content = pendingFeedback.get(userId);

            if (!content) {
                return interaction.reply({ content: '❌ Feedback data expired. Please try clicking the button again.', flags: [MessageFlags.Ephemeral] });
            }

            const logChannel = guild.channels.cache.get(feedbackChannelId);
            if (!logChannel) {
                return interaction.reply({ content: '❌ Logging channel configuration error. Contact admin.', flags: [MessageFlags.Ephemeral] });
            }

            const isAnon = customId === 'submit_feedback_anon';

            const logEmbed = new EmbedBuilder()
                .setColor(isAnon ? '#2B2D31' : '#8b8b8b')
                .setTitle(isAnon ? '💬 New Feedback' : '💬 New Feedback')
                .setDescription(content)
                .setTimestamp();

            if (!isAnon) {
                logEmbed.setAuthor({ 
                    name: member.user.username, 
                    iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                });
            } else {
                logEmbed.setAuthor({ 
                    name: 'Anonymous User',
                    iconURL: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'
                });
            }

            const feedbackActionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('log_feedback_action_btn')
                    .setLabel('Send Feedback')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🌟')
            );

            try {
                await logChannel.send({ embeds: [logEmbed], components: [feedbackActionRow] });
                pendingFeedback.delete(userId);
                
                return interaction.update({ 
                    content: '✅ Thank you! Your feedback has been safely shared with the staff team.', 
                    embeds: [], 
                    components: [] 
                });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: '❌ Internal transmission error.', flags: [MessageFlags.Ephemeral] });
            }
        }
    },

    async handleModal(interaction) {
        if (interaction.customId !== 'feedback_form_modal') return;

        const textValue = interaction.fields.getTextInputValue('feedback_main_text');
        pendingFeedback.set(interaction.member.id, textValue);

        const choiceEmbed = new EmbedBuilder()
            .setColor('#1E1F22')
            .setTitle('Privacy Configuration')
            .setDescription('Choose how your identity should be attached to this submission:');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('submit_feedback_public')
                .setLabel(' Public (Show Identity)')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('submit_feedback_anon')
                .setLabel(' Anonymous (Hide Identity)')
                .setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({ embeds: [choiceEmbed], components: [row], flags: [MessageFlags.Ephemeral] });
    }
};