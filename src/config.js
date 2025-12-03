module.exports = {
    // Auto-Deploy Configuration
    autoDeploy: {
        enabled: true,
        refreshIntervalMs: 3600000 // 1 hour
    },
    
    // Leveling Configuration
    leveling: {
        xpPerMessage: { min: 15, max: 25 },
        xpCooldown: 60000,
        coinsPerLevelUp: 100,
        levelUpMultiplier: 1.5
    },
    
    // Economy Configuration
    economy: {
        startingCoins: 100,
        dailyReward: 50
    },
    
    // Auto-Moderation Configuration
    automod: {
        enabled: true,
        spamThreshold: 5,
        spamInterval: 5000,
        maxMentions: 5,
        maxEmojis: 10,
        warnThreshold: 3,
        muteThreshold: 5,
        
        // Detection Features
        spamDetection: { enabled: true },
        badWordDetection: { enabled: true },
        capsDetection: { enabled: true, threshold: 70 },
        repeatDetection: { enabled: true },
        linkDetection: { enabled: true },
        emojiDetection: { enabled: true },
        
        badWords: [
            // ===== COMMON PROFANITY =====
            'damn', 'crap', 'hell', 'piss', 'bastard', 'ass', 'asshole',
            'suck', 'sucks', 'sucked', 'sucking', 'crappy', 'shitty',
            
            // ===== STRONG PROFANITY =====
            'fuck', 'shit', 'bitch', 'dick', 'pussy', 'cock', 'slut', 'whore',
            'fucked', 'fucking', 'bitches', 'bullshit', 'dammit', 'goddamn',
            'fuckhead', 'asshat', 'shithead', 'asswipe', 'cuntface',
            'motherfucker', 'mindfuck', 'clusterfuck', 'fuckwit', 'fuckface',
            'douchebag', 'dickhead', 'shitbag', 'shitstain', 'assclown',
            
            // ===== OFFENSIVE SLURS & DEROGATORY TERMS =====
            'retard', 'retarded', 'retards', 'derp', 'derpy',
            'tard', 'tarded', 'stupid', 'idiot', 'dumb', 'dumbass',
            'imbecile', 'moron', 'cretin', 'simpleton', 'nincompoop',
            
            // ===== RACIAL/ETHNIC SLURS =====
            'nigger', 'nigga', 'chink', 'paki', 'towelhead', 'raghead',
            'spic', 'wetback', 'jap', 'slope', 'nip', 'gook', 'beaner',
            'cracker', 'whitey', 'honky', 'gringo', 'kike', 'yid',
            'fag', 'faggot', 'queer', 'tranny', 'shemale',
            
            // ===== SEXUAL/VULGAR TERMS =====
            'xxx', 'sex', 'porn', 'xxx', 'cum', 'jizz', 'spunk',
            'blowjob', 'handjob', 'rimjob', 'fellatio', 'cunnilingus',
            'gangbang', 'orgy', 'bukake', 'creampie', 'deepthroat',
            
            // ===== VIOLENT/THREATENING TERMS =====
            'kill', 'kill you', 'i will kill', 'rape', 'raped', 'rape you',
            'stab', 'stabbed', 'punch', 'beat', 'harm', 'hurt you',
            'end your life', 'go die', 'kys', 'nuke', 'shoot',
            
            // ===== HATEFUL/DISCRIMINATORY =====
            'hate', 'racist', 'sexist', 'homophobe', 'transphobe',
            'nazi', 'hitler', 'kkk', 'supremacist', 'supremacy',
            'incel', 'simp', 'thot', 'whore', 'slut',
            
            // ===== DRUG/SUBSTANCE REFERENCES =====
            'cocaine', 'heroin', 'meth', 'crack', 'lsd', 'molly',
            'ecstasy', 'adderall', 'xanax', 'weed', 'pot', 'grass',
            'dope', 'doped', 'dealer', 'drug dealer', 'pusher',
            
            // ===== VARIATIONS & COMMON LEETSPEAK =====
            'f4ck', 'f*ck', 'sh1t', 'sh!t', 'b1tch', 'b!tch', 'n1gg3r',
            'r3t4rd', 'st00pid', 'dum4ss', 'a55', 'a55h0le', '@ss', '@$$hole',
            'p00n', 'c0ck', 'p4ssy', 'p3nis', 'v@gin@', 'kunt', 'cunt',
            
            // ===== ADDITIONAL OFFENSIVE TERMS =====
            'pedophile', 'pedo', 'pedo bear', 'child molester',
            'bestiality', 'zoophile', 'necrophile', 'corpse',
            'suicide', 'depressed', 'mental illness', 'psycho',
            'schizo', 'bipolar', 'retarded', 'insane', 'crazy',
            
            // ===== EXTREME CONTENT WARNINGS =====
            'isis', 'terrorist', 'terrorism', 'bomb', 'bombard',
            'execute', 'execution', 'genocide', 'holocaust',
            'slavery', 'enslaved', 'plantation',
            
            // ===== MISC INAPPROPRIATE =====
            '666', '88', '1488', 'hitler salute', 'sieg heil',
            'white power', 'blood and honor', 'acab', 'all cops',
            'cum', 'ejaculate', 'masturbate', 'fornicate', 'intercourse'
        ],
        warnThreshold: 3,
        muteThreshold: 5
    },
    
    // Anti-Nuke Configuration
    antinuke: {
        enabled: true,
        maxBansPerMinute: 3,
        maxKicksPerMinute: 3,
        maxChannelDeletesPerMinute: 2,
        maxRoleDeletesPerMinute: 2,
        action: 'ban'
    },
    
    // Shop Configuration
    shop: {
        items: [
            { id: 'vip_role', name: 'VIP Role', price: 1000, description: 'Get a special VIP role' },
            { id: 'custom_color', name: 'Custom Color', price: 500, description: 'Get a custom colored role' },
            { id: 'nickname_change', name: 'Nickname Change', price: 100, description: 'Change your nickname' },
            { id: 'lottery_ticket', name: 'Lottery Ticket', price: 50, description: 'Enter the daily lottery' }
        ]
    },
    
    // Games Configuration
    games: {
        coinflip: { minBet: 10, maxBet: 1000 },
        dice: { minBet: 10, maxBet: 500 },
        slots: { minBet: 20, maxBet: 200, jackpotMultiplier: 10 }
    },

    // Discord AutoMod Configuration
    discordAutomod: {
        enabled: true,
        rules: [
            {
                name: 'Profanity & Slurs Filter (1/2)',
                triggerType: 'KEYWORD',
                keywordFilter: [
                    // Common Profanity
                    'damn', 'crap', 'hell', 'piss', 'bastard', 'ass', 'asshole', 'suck', 'sucks',
                    'sucked', 'sucking', 'crappy', 'shitty', 'fuck', 'shit', 'bitch', 'dick',
                    'pussy', 'cock', 'slut', 'whore', 'fucked', 'fucking', 'bitches', 'bullshit',
                    'dammit', 'goddamn', 'fuckhead', 'asshat', 'shithead', 'asswipe', 'cuntface',
                    'motherfucker', 'mindfuck', 'clusterfuck', 'fuckwit', 'fuckface',
                    // Offensive Slurs
                    'retard', 'retarded', 'retards', 'derp', 'derpy', 'tard', 'tarded', 'stupid',
                    'idiot', 'dumb', 'dumbass', 'imbecile', 'moron', 'cretin', 'simpleton',
                    'nincompoop', 'nigger', 'nigga', 'chink', 'paki', 'towelhead', 'raghead',
                    'spic', 'wetback', 'jap', 'slope', 'nip', 'gook', 'beaner', 'cracker',
                    'whitey', 'honky', 'gringo', 'kike', 'yid', 'fag', 'faggot', 'queer',
                    'tranny', 'shemale', 'douchebag', 'dickhead', 'shitbag', 'shitstain',
                    'assclown'
                ],
                actions: [
                    { type: 'BLOCK_MESSAGE', metadata: {} }
                ]
            },
            {
                name: 'Violent & Hateful Filter (2/2)',
                triggerType: 'KEYWORD',
                keywordFilter: [
                    // Sexual/Vulgar
                    'xxx', 'sex', 'porn', 'cum', 'jizz', 'spunk', 'blowjob', 'handjob', 'rimjob',
                    'fellatio', 'cunnilingus', 'gangbang', 'orgy', 'bukake', 'creampie', 'deepthroat',
                    // Violent/Threatening
                    'kill', 'kill you', 'i will kill', 'rape', 'raped', 'rape you', 'stab',
                    'stabbed', 'punch', 'beat', 'harm', 'hurt you', 'end your life', 'go die',
                    'kys', 'nuke', 'shoot',
                    // Hateful/Discriminatory
                    'hate', 'racist', 'sexist', 'homophobe', 'transphobe', 'nazi', 'hitler',
                    'kkk', 'supremacist', 'supremacy', 'incel', 'simp', 'thot',
                    // Drugs
                    'cocaine', 'heroin', 'meth', 'crack', 'lsd', 'molly', 'ecstasy', 'adderall',
                    'xanax', 'weed', 'pot', 'grass', 'dope', 'doped', 'dealer', 'drug dealer',
                    'pusher',
                    // Leetspeak
                    'f4ck', 'f*ck', 'sh1t', 'sh!t', 'b1tch', 'b!tch', 'n1gg3r', 'r3t4rd',
                    'st00pid', 'dum4ss', 'a55', 'a55h0le', '@ss', '@$$hole', 'p00n', 'c0ck',
                    'p4ssy', 'p3nis', 'v@gin@', 'kunt', 'cunt',
                    // Extreme/Dangerous
                    'pedophile', 'pedo', 'pedo bear', 'child molester', 'bestiality', 'zoophile',
                    'necrophile', 'corpse', 'suicide', 'depressed', 'mental illness', 'psycho',
                    'schizo', 'bipolar', 'retarded', 'insane', 'crazy', 'isis', 'terrorist',
                    'terrorism', 'bomb', 'bombard', 'execute', 'execution', 'genocide', 'holocaust',
                    'slavery', 'enslaved', 'plantation', '666', '88', '1488', 'hitler salute',
                    'sieg heil', 'white power', 'blood and honor', 'acab', 'all cops',
                    'ejaculate', 'masturbate', 'fornicate', 'intercourse'
                ],
                actions: [
                    { type: 'BLOCK_MESSAGE', metadata: {} }
                ]
            },
            {
                name: 'Spam Detection',
                triggerType: 'SPAM',
                spamRaidProtection: true,
                actions: [
                    { type: 'BLOCK_MESSAGE', metadata: {} }
                ]
            }
        ],
        defaultAction: 'BLOCK_MESSAGE'
    }
};
