/**
 * Discord Client Secret Validation
 * Ensures all required Discord credentials are present and valid
 */

const emoji = require('./emoji');

const validateDiscordCredentials = () => {
    const required = {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || process.env.TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,
        CLIENT_SECRET: process.env.CLIENT_SECRET || null
    };

    const errors = [];

    if (!required.DISCORD_BOT_TOKEN) {
        errors.push(`${emoji.error} DISCORD_BOT_TOKEN is missing`);
    }

    if (!required.CLIENT_ID) {
        errors.push(`${emoji.error} CLIENT_ID is missing`);
    }

    if (!required.CLIENT_SECRET) {
        console.warn(`${emoji.warning} CLIENT_SECRET not set - optional but recommended for production`);
    }

    return {
        valid: errors.length === 0,
        credentials: required,
        errors
    };
};

const logCredentialStatus = () => {
    const validation = validateDiscordCredentials();

    if (validation.valid) {
        console.log(`\n${emoji.success} ALL DISCORD CREDENTIALS VALIDATED`);
        console.log(`   ${emoji.success} DISCORD_BOT_TOKEN - Configured`);
        console.log(`   ${emoji.success} CLIENT_ID - Configured`);
        if (validation.credentials.CLIENT_SECRET) {
            console.log(`   ${emoji.success} CLIENT_SECRET - Configured`);
        } else {
            console.log(`   ${emoji.warning} CLIENT_SECRET - Not set (optional)`);
        }
        console.log(`${emoji.success} Bot is ready for smooth loading\n`);
    } else {
        console.error(`\n${emoji.error} DISCORD CREDENTIALS VALIDATION FAILED`);
        validation.errors.forEach(error => console.error(`   ${error}`));
        console.error('📌 Set these in your environment variables:\n');
        console.error('   DISCORD_BOT_TOKEN = [your bot token]');
        console.error('   CLIENT_ID = [your client ID]');
        console.error('   CLIENT_SECRET = [your client secret] (optional)');
        console.error('\n📌 Get credentials from: https://discord.com/developers/applications\n');
    }

    return validation;
};

module.exports = {
    validateDiscordCredentials,
    logCredentialStatus
};
