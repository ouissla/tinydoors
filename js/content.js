/* Preset surprises — one full 24-day pack per theme.
   {to} and {from} are filled in with the names from the editor.
   Types: message, photo, riddle, joke, activity, voucher, finale. */
(function () {
  const A = (window.Advent = window.Advent || {});

  A.PHOTO_DAYS = [3, 9, 15, 21];

  A.THEMES = {
    snow: {
      name: 'Snowy',
      title: "{to}'s Christmas Village",
      eyebrow: '{from} made this for you',
      splashTitle: 'A Christmas village,<br>just for you',
      emblem: '🎄',
      finaleIcon: '🎄',
      scratchHint: 'Wipe away the frost',
      scratch: 'frost', base: 'snow', sound: 'snow',
    },
    summer: {
      name: 'Summer',
      title: "{to}'s Summer Christmas",
      eyebrow: '{from} made this for you',
      splashTitle: '24 sunny surprises,<br>just for you',
      emblem: '☀️',
      finaleIcon: '🎅',
      scratchHint: 'Brush away the sand',
      scratch: 'sand', base: 'summer', sound: 'summer',
    },
    gingerbread: {
      name: 'Gingerbread Lane',
      title: "{to}'s Gingerbread Lane",
      eyebrow: '{from} baked this for you',
      splashTitle: 'A sweet little street,<br>just for you',
      emblem: '🍪',
      finaleIcon: '🍪',
      scratchHint: 'Wipe away the icing sugar',
      scratch: 'icing', base: 'snow', sound: 'gingerbread', premium: true,
    },
    toys: {
      name: 'Toy Town',
      title: "{to}'s Toy Town",
      eyebrow: '{from} built this for you',
      splashTitle: 'A whole toy town,<br>just for you',
      emblem: '🧸',
      finaleIcon: '🧸',
      scratchHint: 'Wipe away the snow',
      scratch: 'frost', base: 'snow', sound: 'toys', premium: true,
    },
    space: {
      name: 'Space Christmas',
      title: "{to}'s Space Christmas",
      eyebrow: '{from} launched this for you',
      splashTitle: 'Christmas among<br>the stars',
      emblem: '🚀',
      finaleIcon: '🚀',
      scratchHint: 'Brush away the stardust',
      scratch: 'stardust', base: 'snow', sound: 'space', premium: true,
    },
    workshop: {
      name: "Santa's Workshop",
      title: "{to}'s North Pole",
      eyebrow: '{from} asked the elves to make this',
      splashTitle: "A peek inside<br>Santa's workshop",
      emblem: '🛠️',
      finaleIcon: '🎅',
      scratchHint: 'Wipe away the frost',
      scratch: 'frost', base: 'snow', sound: 'workshop', premium: true,
    },
    jungle: {
      name: 'Treetop Jungle',
      title: "{to}'s Jungle Christmas",
      eyebrow: '{from} made this for you',
      splashTitle: 'A treetop village,<br>just for you',
      emblem: '🦜',
      finaleIcon: '🦜',
      scratchHint: 'Brush away the leaves',
      scratch: 'sand', base: 'summer', sound: 'jungle', premium: true,
    },
    japan: {
      name: 'Kawaii Sakura Town',
      title: "{to}'s Kawaii Sakura Town",
      eyebrow: '{from} made this for you ♡',
      splashTitle: 'A super cute village,<br>just for you',
      emblem: '🌸',
      finaleIcon: '🌸',
      scratchHint: 'Wipe away the frost',
      scratch: 'frost', base: 'snow', sound: 'japan', premium: true,
    },
    cyber: {
      name: 'Neon City',
      title: "{to}'s Neon Christmas",
      eyebrow: '{from} jacked this in for you',
      splashTitle: 'Christmas in<br>the neon city',
      emblem: '🌃',
      finaleIcon: '🎆',
      scratchHint: 'Wipe away the rain',
      scratch: 'stardust', base: 'snow', sound: 'cyber', premium: true,
    },
  };
  A.THEME_ORDER = ['snow', 'summer', 'gingerbread', 'toys', 'space', 'workshop', 'jungle', 'japan', 'cyber'];
  A.baseOf = (t) => (A.THEMES[t] && A.THEMES[t].base) || 'snow';

  A.CONTENT = {
    snow: [
      { type: 'message', text: "Dear {to},\n\nWelcome to your very own Christmas village! Every day, one little door opens — and one more light comes on.\n\nNo peeking ahead… the elves are watching. 👀" },
      { type: 'activity', emoji: '☕', title: 'Fancy hot chocolate night', body: 'Make the most over-the-top hot chocolate you can. Marshmallows, cream, sprinkles, a candy cane stirrer. Then rate each other’s out of 10.', chips: ['⏱ 15 min', '🍫 Kitchen'] },
      { type: 'photo', caption: 'Remember this? Best snow day ever.' },
      { type: 'joke', q: 'What do you call an old snowman?', a: 'Water. 💧' },
      { type: 'riddle', q: 'I have lots of needles, but I can’t sew a single thing. What am I?', a: 'A Christmas tree! 🎄' },
      { type: 'activity', emoji: '✂️', title: 'Paper snowflake factory', body: 'Fold a square of paper into a triangle, then in half again. Snip shapes along the edges, unfold — every one is different. Stick them on the windows.', chips: ['⏱ 20 min', '✂️ Paper & scissors'] },
      { type: 'voucher', title: 'One breakfast in bed', body: 'Valid any morning you like. Pancakes guaranteed, syrup negotiable.' },
      { type: 'game', game: 'wordsearch', title: 'Christmas word search', words: ['SANTA', 'SLEIGH', 'ELF', 'STAR', 'GIFT', 'SNOW', 'TINSEL'] },
      { type: 'photo', caption: 'Our first Christmas together 💛' },
      { type: 'activity', emoji: '🏡', title: 'The great lights hunt', body: 'Head out after dark and find the 10 best-decorated houses nearby. Everyone gets one vote for the winner.', chips: ['⏱ 30 min', '🧥 Outside'] },
      { type: 'riddle', q: 'What can go up a chimney down, but can’t come down a chimney up?', a: 'An umbrella! ☂️' },
      { type: 'message', text: 'Halfway there, {to}!\n\nTwelve doors open, twelve to go. Look how bright your little village is getting. ✨' },
      { type: 'activity', emoji: '🎭', title: 'Christmas charades', body: 'Act out a Christmas film, song or character — no talking! Whoever guesses goes next.', chips: ['⏱ 20 min', '👨‍👩‍👧 Together'] },
      { type: 'game', game: 'memory', title: 'Christmas memory match' },
      { type: 'photo', caption: 'Look who got the biggest present 🐶' },
      { type: 'activity', emoji: '🍪', title: 'Gingerbread biscuits', body: 'Bake a batch and decorate them badly on purpose. Ugliest biscuit wins.', steps: ['Cream 100g butter + 75g brown sugar', 'Add 3 tbsp golden syrup, 225g flour, 2 tsp ginger', 'Roll, cut, bake 10 min at 180°C', 'Ice with chaos'], chips: ['⏱ 45 min', '🍪 Kitchen'] },
      { type: 'voucher', title: 'One movie night — you pick', body: 'Includes popcorn, blankets and zero complaints about your choice.' },
      { type: 'game', game: 'sudoku', size: 4, title: 'Festive sudoku' },
      { type: 'activity', emoji: '🧝', title: 'Secret kindness elf', body: 'Do one kind thing for someone today without them finding out it was you.', chips: ['⏱ Anytime', '🤫 Top secret'] },
      { type: 'game', game: 'slide', title: 'Picture puzzle' },
      { type: 'photo', caption: 'Same pose next year?' },
      { type: 'activity', emoji: '🎶', title: 'Living-room carol-off', body: 'Put on your favourite carol. Loudest, most dramatic singer wins. Hairbrush microphones encouraged.', chips: ['⏱ 5 min', '🎤 Loud'] },
      { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nPut out something for Santa and a carrot for the reindeer. I hear Rudolph is partial to the crunchy ones. 🥕' },
      { type: 'finale', text: 'Every light in your village is on — just like you light up every Christmas.\n\nThank you for opening a door with me every day. I hope tomorrow is full of laughing, eating too much, and being exactly where you want to be.' },
    ],
    summer: [
      { type: 'message', text: "G'day {to}!\n\nWelcome to your Summer Christmas. Every day a new beach box opens — and one more fairy light switches on.\n\nNo peeking ahead. The seagulls are watching. 🐦" },
      { type: 'activity', emoji: '🏏', title: 'The Christmas Cup', body: 'Backyard cricket, family rules. Tip-and-run, one hand one bounce, and the dog is a fielder.', chips: ['⏱ 30 min', '☀️ Outside'] },
      { type: 'photo', caption: 'Remember this beach day? 🌊' },
      { type: 'joke', q: 'What does Santa wear at the beach?', a: 'Sandy Claws. 🦀' },
      { type: 'riddle', q: 'What gets wetter the more it dries?', a: 'A towel! 🏖️' },
      { type: 'activity', emoji: '🏰', title: 'Sandcastle Christmas tree', body: 'Build the tallest sand Christmas tree you can — at the beach or in the sandpit. Decorate it with shells and a star on top.', chips: ['⏱ 30 min', '🐚 Beach or sandpit'] },
      { type: 'voucher', title: 'One ice-cream run — my shout', body: 'Any flavour, any size, two scoops minimum. Sprinkles included.' },
      { type: 'game', game: 'wordsearch', title: 'Summer word search', words: ['BEACH', 'PAVLOVA', 'SURF', 'PRAWN', 'SUNNY', 'ESKY', 'THONGS'] },
      { type: 'photo', caption: 'Pav champion, 2025 🏆' },
      { type: 'activity', emoji: '🍓', title: 'Pavlova night', body: 'Make a mini pav and pile it high with summer fruit.', steps: ['Whisk 4 egg whites to soft peaks', 'Add 1 cup caster sugar, a spoon at a time', 'Fold in 1 tsp vinegar + 1 tsp cornflour', 'Bake 1 hr at 120°C, cool in the oven', 'Cream, berries, passionfruit'], chips: ['⏱ 1.5 hrs', '🍓 Kitchen'] },
      { type: 'riddle', q: 'What can you catch, but never throw?', a: 'A wave! 🏄 (…or a cold.)' },
      { type: 'message', text: 'Halfway there, {to}!\n\nTwelve beach boxes open, twelve to go. The fairy lights are really starting to glow. ✨' },
      { type: 'activity', emoji: '🎈', title: 'Water balloon toss', body: 'Pair up and step back after every catch. Last team with a balloon wins. Everyone else gets cooled down.', chips: ['⏱ 20 min', '💦 Get wet'] },
      { type: 'game', game: 'memory', title: 'Beach memory match' },
      { type: 'photo', caption: 'Look who’s ready for summer 🐶' },
      { type: 'activity', emoji: '🥭', title: 'Mango smoothie bar', body: 'Blend mango, banana, ice and a splash of milk. Everyone invents a topping. Name your creation.', chips: ['⏱ 15 min', '🥭 Kitchen'] },
      { type: 'voucher', title: 'One beach day — I’ll pack the esky', body: 'Sandwiches, cold drinks, sunscreen and the good umbrella. You just bring yourself.' },
      { type: 'game', game: 'sudoku', size: 4, title: 'Sunny sudoku' },
      { type: 'activity', emoji: '🧊', title: 'Kindness elf: cold drinks', body: 'Leave a note and a cold drink out for the posties and delivery drivers working hard this week.', chips: ['⏱ 5 min', '💛 Kind'] },
      { type: 'game', game: 'slide', title: 'Picture puzzle' },
      { type: 'photo', caption: 'Christmas lunch, take two?' },
      { type: 'activity', emoji: '🕯️', title: 'Backyard carols', body: 'Fairy lights, a picnic rug and a speaker. Sing the Aussie Jingle Bells — “dashing through the bush”.', chips: ['⏱ 30 min', '🎶 Together'] },
      { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nSanta swaps the sleigh for six white boomers. Leave out a cold drink and some carrots — it’s a hot ride. 🦘' },
      { type: 'finale', text: 'Every fairy light is on — just like you light up every summer.\n\nThank you for opening a door with me every day. I hope tomorrow is sunshine, prawns, too much pav and the people you love most.' },
    ],
  };


  // More ready-made surprises for the editor's library (not in the default 24).
  A.EXTRA = {
    snow: [
      { type: 'joke', q: 'Why did the Christmas tree go to the hairdresser?', a: 'It needed a trim. ✂️' },
      { type: 'joke', q: 'What’s Santa’s favourite kind of music?', a: 'Wrap music. 🎁' },
      { type: 'riddle', q: 'I’m tall when I’m young and short when I’m old. What am I?', a: 'A candle! 🕯️' },
      { type: 'joke', q: 'What do elves learn at school?', a: 'The elf-abet. 🔤' },
      { type: 'game', game: 'sudoku', size: 6, title: 'Sudoku challenge' },
      { type: 'game', game: 'scramble', title: 'Unscramble the Christmas words', words: [['REINDEER', 'They pull the sleigh'], ['TINSEL', 'Sparkly tree decoration'], ['CANDLE', 'It glows on the windowsill']] },
      { type: 'game', game: 'wordsearch', title: 'Santa’s workshop word search', words: ['TOYS', 'WRAP', 'BOW', 'LIST', 'ELVES', 'COCOA'] },
    ],
    summer: [
      { type: 'joke', q: 'What’s a crab’s favourite Christmas carol?', a: 'Jingle Shells. 🐚' },
      { type: 'joke', q: 'What do you call Santa when he takes a break?', a: 'Santa Pause. ⏸️' },
      { type: 'riddle', q: 'I have a mouth but never eat, and a bed but never sleep. What am I?', a: 'A river! 🏞️' },
      { type: 'joke', q: 'How does Santa keep cool in December?', a: 'He hangs out with his fans. 🌀' },
      { type: 'game', game: 'sudoku', size: 6, title: 'Sudoku challenge' },
      { type: 'game', game: 'scramble', title: 'Unscramble the summer words', words: [['SUNSCREEN', 'Slip, slop, slap'], ['THONGS', 'On your feet at the beach'], ['MANGO', 'Juicy summer fruit']] },
      { type: 'game', game: 'wordsearch', title: 'Backyard Christmas word search', words: ['CRICKET', 'SPRINKLER', 'BBQ', 'CAROLS', 'POOL', 'SALAD'] },
    ],
  };

  // ---- Premium world packs: the snowy pack with themed days swapped in ----
  const pack = (over) => A.CONTENT.snow.map((it, i) => JSON.parse(JSON.stringify(over[i + 1] || it)));
  A.CONTENT.gingerbread = pack({
    1: { type: 'message', text: "Dear {to},\n\nWelcome to Gingerbread Lane! Every house here is freshly baked, and a new door opens every day.\n\nNo nibbling the walls. 🍪" },
    2: { type: 'activity', emoji: '🏠', title: 'Build a mini gingerbread house', body: 'Use graham crackers or biscuits, icing as glue and every lolly you can find. Bonus points for a chimney.', chips: ['⏱ 45 min', '🍬 Kitchen'] },
    4: { type: 'joke', q: 'Why did the gingerbread man go to the doctor?', a: 'He was feeling crummy. 🍪' },
    5: { type: 'riddle', q: 'I’m sweet and striped and I hang on the tree. What am I?', a: 'A candy cane! 🍭' },
    6: { type: 'activity', emoji: '🧁', title: 'Cookie decorating contest', body: 'Plain biscuits, three colours of icing, sprinkles everywhere. Everyone judges everyone else’s.', chips: ['⏱ 30 min', '🎨 Messy'] },
    7: { type: 'voucher', title: 'One trip to the bakery', body: 'You pick the treat. I won’t look at the price.' },
    8: { type: 'game', game: 'wordsearch', title: 'Sweet treats word search', words: ['COOKIE', 'ICING', 'CANDY', 'SPRINKLE', 'GUMDROP', 'GINGER'] },
    12: { type: 'message', text: 'Halfway there, {to}!\n\nTwelve doors open on Gingerbread Lane. The whole street smells of cinnamon. 🍬' },
    13: { type: 'activity', emoji: '🍫', title: 'Blindfold taste test', body: 'Line up five sweet things. Blindfold on. Guess each one. Loser does the dishes.', chips: ['⏱ 15 min', '😋 Yum'] },
    23: { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nLeave out a gingerbread biscuit for Santa — he says ours are the best on his whole route. 🎅' },
    24: { type: 'finale', text: 'Every window on Gingerbread Lane is glowing for you.\n\nThank you for opening a door with me every day. I hope tomorrow is full of treats, laughter and far too many biscuits.' },
  });
  A.CONTENT.toys = pack({
    1: { type: 'message', text: "Dear {to},\n\nWelcome to Toy Town! The soldiers are marching, the train is running and a new door opens every day.\n\nRemember to wind up the penguins. 🐧" },
    2: { type: 'activity', emoji: '🧱', title: 'Tallest tower challenge', body: 'Blocks, books, boxes — whatever you’ve got. Build the tallest tower before the timer runs out.', chips: ['⏱ 10 min', '🏗️ Wobbly'] },
    4: { type: 'joke', q: 'Why did the teddy bear say no to pudding?', a: 'It was already stuffed! 🧸' },
    5: { type: 'riddle', q: 'I have a face and two hands, but no arms or legs. What am I?', a: 'A clock! ⏰' },
    6: { type: 'activity', emoji: '🚂', title: 'Living-room train', body: 'Line up chairs as carriages. The driver chooses the destination; passengers need tickets (drawn by hand).', chips: ['⏱ 20 min', '🎟️ All aboard'] },
    7: { type: 'voucher', title: 'One afternoon of board games', body: 'You choose the games. I promise not to flip the board.' },
    8: { type: 'game', game: 'wordsearch', title: 'Toy box word search', words: ['TEDDY', 'TRAIN', 'BLOCKS', 'DOLL', 'KITE', 'PUZZLE', 'ROBOT'] },
    12: { type: 'message', text: 'Halfway there, {to}!\n\nTwelve doors open in Toy Town. The soldiers have started practising the Christmas parade. 🥁' },
    19: { type: 'activity', emoji: '🎁', title: 'Give a toy', body: 'Pick a toy you’ve outgrown that’s still in good shape and give it to someone who’ll love it.', chips: ['⏱ Anytime', '💛 Kind'] },
    23: { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nThe elves have finished every last toy. All Santa needs now is a mince pie and a good tailwind. 🎅' },
    24: { type: 'finale', text: 'Every light in Toy Town is shining for you.\n\nThank you for opening a door with me every day. I hope tomorrow is full of play, surprises and somebody else doing the batteries.' },
  });
  A.CONTENT.space = pack({
    1: { type: 'message', text: "Mission control to {to}…\n\nWelcome to Space Christmas! A new hatch opens every day on our little moon base.\n\nRemember: in space, nobody can hear you unwrap. 🚀" },
    2: { type: 'activity', emoji: '🔭', title: 'Stargazing night', body: 'Go outside after dark, give your eyes ten minutes, and find the brightest thing in the sky. (It might be a planet!)', chips: ['⏱ 20 min', '🌌 Outside'] },
    4: { type: 'joke', q: 'What did the alien say to the Christmas tree?', a: 'Take me to your tinsel! 👽' },
    5: { type: 'riddle', q: 'I have a tail but no body, and I streak across the sky. What am I?', a: 'A comet! ☄️' },
    6: { type: 'activity', emoji: '🚀', title: 'Cardboard rocket', body: 'A box, some foil, a lot of tape. Build a rocket big enough to sit in, then plan your first mission.', chips: ['⏱ 45 min', '📦 Boxes'] },
    7: { type: 'voucher', title: 'One star party', body: 'Blankets, hot chocolate and the night sky. I’ll bring the snacks; you bring the questions.' },
    8: { type: 'game', game: 'wordsearch', title: 'Space word search', words: ['ROCKET', 'PLANET', 'STAR', 'MOON', 'COMET', 'ALIEN', 'ORBIT'] },
    10: { type: 'activity', emoji: '🌙', title: 'Moon-walk race', body: 'Everyone races in slow-motion moon steps. Anyone who goes at normal speed starts again.', chips: ['⏱ 10 min', '🤣 Silly'] },
    11: { type: 'riddle', q: 'What’s the biggest light in the night sky that doesn’t make its own light?', a: 'The moon — it reflects the sun! 🌙' },
    12: { type: 'message', text: 'Halfway there, {to}!\n\nTwelve hatches open. Mission control reports the Christmas tree is now visible from Earth. ✨' },
    23: { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nSanta’s rocket-sleigh is fuelled and on the launch pad. T-minus one sleep. 🎅' },
    24: { type: 'finale', text: 'Every star on our little moon is shining for you.\n\nThank you for opening a hatch with me every day. Wherever you are tomorrow, I’ll be looking at the same sky.' },
  });

  A.CONTENT.workshop = pack({
    1: { type: 'message', text: "Dear {to},\n\nWelcome to the North Pole! The elves have been hammering since November, and a new cottage door opens every day.\n\nPlease don't distract the toymakers. 🛠️" },
    2: { type: 'activity', emoji: '🪚', title: 'Elf workshop hour', body: 'Make one small present out of whatever is in the house: card, string, tape, buttons. Wrap it. Swap.', chips: ['⏱ 45 min', '✂️ Crafty'] },
    4: { type: 'joke', q: 'What do elves learn at school?', a: 'The elf-abet! 🔤' },
    5: { type: 'riddle', q: 'I’m checked twice but I’m not a coat. What am I?', a: 'Santa’s list! 📜' },
    7: { type: 'voucher', title: 'One day off chores', body: 'The elves will cover for you. (It’s me. I’m the elves.)' },
    12: { type: 'message', text: 'Halfway there, {to}!\n\nTwelve doors open at the North Pole. The toy sacks are half full and the reindeer are doing laps. 🦌' },
    23: { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nThe workshop lights are going off one by one. Every toy is wrapped and the sleigh is loaded. 🎅' },
    24: { type: 'finale', text: 'Every elf at the North Pole is cheering for you.\n\nThank you for opening a door with me every day. I hope tomorrow is full of surprises, a few of them handmade.' },
  });
  A.CONTENT.jungle = pack({
    1: { type: 'message', text: "Dear {to},\n\nWelcome to the Treetop Jungle! The parrots are wearing Santa hats and a new treehouse door opens every day.\n\nMind the rope bridges. 🦜" },
    2: { type: 'activity', emoji: '🌿', title: 'Living-room jungle', body: 'Turn one room into a jungle: blankets for vines, every plant you own, animal noises compulsory.', chips: ['⏱ 30 min', '🐒 Loud'] },
    4: { type: 'joke', q: 'What do monkeys sing at Christmas?', a: 'Jungle Bells! 🔔' },
    5: { type: 'riddle', q: 'I have a big colourful beak and live high in the trees. What am I?', a: 'A toucan! 🐦' },
    8: { type: 'game', game: 'wordsearch', title: 'Jungle word search', words: ['PARROT', 'MONKEY', 'VINE', 'TIGER', 'FROG', 'MANGO', 'SLOTH'] },
    12: { type: 'message', text: 'Halfway there, {to}!\n\nTwelve treehouses lit. The fireflies have started practising for Christmas Eve. ✨' },
    23: { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nSanta is swapping his reindeer for parrots tonight. Leave a mango out, just in case. 🥭' },
    24: { type: 'finale', text: 'Every lantern in the treetops is glowing for you.\n\nThank you for opening a door with me every day. I hope tomorrow is wild, warm and wonderful.' },
  });
  A.CONTENT.japan = pack({
    1: { type: 'message', text: "Dear {to},\n\nWelcome to Kawaii Sakura Town! Blossom on the breeze, smiling houses on every street, and a new door slides open every day.\n\nShoes off at the door, please. 🌸" },
    2: { type: 'activity', emoji: '🦢', title: 'Paper crane challenge', body: 'Look up how to fold an origami crane. First one to make one that stands up wins. Hang them on the tree.', chips: ['⏱ 30 min', '📄 Paper'] },
    4: { type: 'joke', q: 'Why did the sushi blush?', a: 'Because it saw the salad dressing! 🍣' },
    5: { type: 'riddle', q: 'I’m made of paper, I glow at night and I hang in the street. What am I?', a: 'A lantern! 🏮' },
    6: { type: 'activity', emoji: '🍜', title: 'Noodle night', body: 'Make a big bowl of noodles together, everyone picks one topping. Chopsticks only.', chips: ['⏱ 40 min', '🥢 Kitchen'] },
    8: { type: 'game', game: 'wordsearch', title: 'Sakura Town word search', words: ['SAKURA', 'MOCHI', 'NEKO', 'SUSHI', 'KAWAII', 'DARUMA', 'KOI'] },
    12: { type: 'message', text: 'Halfway there, {to}!\n\nTwelve doors open and every house is smiling. The mochi are doing a happy dance. 🍡' },
    23: { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nThe temple bell rings at midnight. Make a wish when you hear it. 🔔' },
    24: { type: 'finale', text: 'Every house in Sakura Town is smiling for you.\n\nThank you for opening a door with me every day. I hope tomorrow is calm, cosy and full of light.' },
  });

  A.CONTENT.cyber = pack({
    1: { type: 'message', text: "Incoming transmission for {to}…\n\nWelcome to Neon City! Every night a new door unlocks somewhere in the rain.\n\nAccess granted. Merry Christmas. 🌃" },
    2: { type: 'activity', emoji: '🕹️', title: 'Retro game night', body: 'Dig out the oldest game you own (or find one online). High score wins the remote for the evening.', chips: ['⏱ 45 min', '🎮 Competitive'] },
    4: { type: 'joke', q: 'Why was the robot so tired on Christmas morning?', a: 'It had a hard drive! 💾' },
    5: { type: 'riddle', q: 'I glow in the dark, I buzz a little, and I spell words in the rain. What am I?', a: 'A neon sign! 🌈' },
    7: { type: 'voucher', title: 'One night of glow sticks', body: 'Lights off, glow sticks on, music up. Dance party in the living room.' },
    8: { type: 'game', game: 'wordsearch', title: 'Neon City word search', words: ['NEON', 'ROBOT', 'PIXEL', 'LASER', 'DRONE', 'RAIN', 'CODE'] },
    12: { type: 'message', text: 'Halfway there, {to}!\n\nTwelve doors unlocked. The hologram tree is at fifty percent power. ⚡' },
    23: { type: 'message', text: 'Tomorrow is the big night, {to}.\n\nSanta’s sleigh has been upgraded: neon runners, rain-proof reindeer, turbo mode. 🎅' },
    24: { type: 'finale', text: 'Every sign in Neon City is glowing for you.\n\nThank you for opening a door with me every day. Wherever the night takes you, you’re my favourite light in the city.' },
  });

  A.KIND_LABEL = {
    message: 'A note for you',
    photo: 'A memory',
    riddle: 'A riddle',
    joke: 'Cracker joke',
    activity: 'Let’s do this',
    voucher: 'A gift voucher',
    finale: 'Christmas Eve',
    game: 'A mini game',
  };

  A.iconFor = function (item, theme) {
    switch (item.type) {
      case 'photo': return '📸';
      case 'message': return '💌';
      case 'riddle': return '❓';
      case 'joke': return '😂';
      case 'voucher': return '🎟️';
      case 'game': return (A.GAME_INFO && A.GAME_INFO[item.game] ? A.GAME_INFO[item.game].icon : '🎮');
      case 'activity': return item.emoji;
      case 'finale': return A.THEMES[theme].finaleIcon;
    }
    return '🎁';
  };
})();
