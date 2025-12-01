const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/helpers');
const { mail } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send mail to another user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to send mail to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('Subject of the mail')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message content')
                .setRequired(true)
                .setMaxLength(1000)),
    
    async execute(interaction) {
        try {
            if (!interaction.user || !interaction.guild) {
                return interaction.reply({ content: 'Invalid interaction context.', flags: 64 });
            }

            const target = interaction.options.getMember('user');
            const subject = interaction.options.getString('subject');
            const messageContent = interaction.options.getString('message');
            
            if (!target) {
                return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], flags: 64 });
            }
            
            if (target.id === interaction.user.id) {
                return interaction.reply({ embeds: [errorEmbed('You cannot send mail to yourself.')], flags: 64 });
            }
            
            if (target.user.bot) {
                return interaction.reply({ embeds: [errorEmbed('You cannot send mail to bots.')], flags: 64 });
            }
            
            mail.send(interaction.guild.id, interaction.user.id, target.id, subject, messageContent);
            
            await interaction.reply({ 
                embeds: [successEmbed(`Mail sent to **${target.user.username}**!`)],
                flags: 64
            });
            
            try {
                await target.send(`You have new mail in **${interaction.guild.name}**! Use \`/inbox\` to check.`);
            } catch (e) {}
        } catch (error) {
            console.error('Send command error:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Error sending mail.', flags: 64 }).catch(() => {});
            }
        }
    }
};
