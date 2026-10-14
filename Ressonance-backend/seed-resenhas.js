require('dotenv').config();
const mysql = require('mysql2/promise');

// 1. Catálogo de 30 Álbuns
const albuns = [
    {
        id: 1, titulo: "Ten", artista: "Pearl Jam", ano: 1991, genero: "Grunge", capa: "img/Ten.jpg",
        musicas: ["Once", "Even Flow", "Alive", "Why Go", "Black", "Jeremy", "Oceans", "Porch", "Garden", "Deep", "Release"]
    },
    {
        id: 2, titulo: "Hybrid Theory", artista: "Linkin Park", ano: 2000, genero: "Nu Metal", capa: "img/HybridTheory.jpg",
        musicas: ["Papercut", "One Step Closer", "With You", "Points of Authority", "Crawling", "Runaway", "By Myself", "In the End", "A Place for My Head", "Forgotten", "Cure for the Itch", "Pushing Me Away"]
    },
    {
        id: 3, titulo: "Good Kid, M.A.A.D City", artista: "Kendrick Lamar", ano: 2012, genero: "Hip-Hop", capa: "img/GKMC.jpeg",
        musicas: ["Sherane a.k.a Master Splinter's Daughter", "Bitch, Don't Kill My Vibe", "Backseat Freestyle", "The Art of Peer Pressure", "Money Trees", "Poetic Justice", "good kid", "m.A.A.d city", "Swimming Pools (Drank)", "Sing About Me, I'm Dying of Thirst", "Real", "Compton"]
    },
    {
        id: 4, titulo: "The Dark Side of the Moon", artista: "Pink Floyd", ano: 1973, genero: "Progressive Rock", capa: "img/DarkSide.png",
        musicas: ["Speak to Me", "Breathe", "On the Run", "Time", "The Great Gig in the Sky", "Money", "Us and Them", "Any Colour You Like", "Brain Damage", "Eclipse"]
    },
    {
        id: 5, titulo: "Kind of Blue", artista: "Miles Davis", ano: 1959, genero: "Jazz", capa: "img/KindOfBlue.png",
        musicas: ["So What", "Freddie Freeloader", "Blue in Green", "All Blues", "Flamenco Sketches"]
    },
    {
        id: 6, titulo: "Random Access Memories", artista: "Daft Punk", ano: 2013, genero: "Electronic", capa: "img/RandomAccess.jpg",
        musicas: ["Give Life Back to Music", "The Game of Love", "Giorgio by Moroder", "Within", "Instant Crush", "Lose Yourself to Dance", "Touch", "Get Lucky", "Beyond", "Motherboard", "Fragments of Time", "Doin' It Right", "Contact"]
    },
    {
        id: 7, titulo: "Thriller", artista: "Michael Jackson", ano: 1982, genero: "Pop", capa: "img/Thriller.jpg",
        musicas: ["Wanna Be Startin' Somethin'", "Baby Be Mine", "The Girl Is Mine", "Thriller", "Beat It", "Billie Jean", "Human Nature", "P.Y.T.", "The Lady in My Life"]
    },
    {
        id: 8, titulo: "Exodus", artista: "Bob Marley & The Wailers", ano: 1977, genero: "Reggae", capa: "img/Exodus.jpg",
        musicas: ["Natural Mystic", "So Much Things to Say", "Guiltiness", "The Heathen", "Exodus", "Jamming", "Waiting in Vain", "Turn Your Lights Down Low", "Three Little Birds", "One Love"]
    },
    {
        id: 9, titulo: "Master of Puppets", artista: "Metallica", ano: 1986, genero: "Thrash Metal", capa: "img/MasterofPuppets.jpg",
        musicas: ["Battery", "Master of Puppets", "The Thing That Should Not Be", "Welcome Home (Sanitarium)", "Disposable Heroes", "Leper Messiah", "Orion", "Damage, Inc."]
    },
    {
        id: 10, titulo: "AM", artista: "Arctic Monkeys", ano: 2013, genero: "Indie Rock", capa: "img/AM.jpeg",
        musicas: ["Do I Wanna Know?", "R U Mine?", "One for the Road", "Arabella", "I Want It All", "No.1 Party Anthem", "Mad Sounds", "Fireside", "Why'd You Only Call Me When You're High?", "Snap Out of It", "Knee Socks", "I Wanna Be Yours"]
    },
    {
        id: 11, titulo: "DeBÍ TiRAR MáS FOToS", artista: "Bad Bunny", ano: 2025, genero: "Reggaeton", capa: "img/DTMF.png",
        musicas: ["NUEVAYoL", "VOY A LLeVARTE PA PR", "BAILE INoLVIDABLE", "PERFuMITO NUEVO", "WELTiTA", "VeLDÁ", "EL CLúB", "KETU TeCRÉ", "BOKeTE", "KLOuFRENS", "TURiSTA", "CAFé CON RON", "PIToRRO DE COCO", "LO QUE LE PASÓ A HAWAii", "EoO", "DtMF", "LA MuDANZA"]
    },
    {
        id: 12, titulo: "Abbey Road", artista: "The Beatles", ano: 1969, genero: "Classic Rock", capa: "img/AbbeyRoad.jpeg",
        musicas: ["Come Together", "Something", "Maxwell's Silver Hammer", "Oh! Darling", "Octopus's Garden", "I Want You", "Here Comes the Sun", "Because", "You Never Give Me Your Money", "Sun King", "Mean Mr. Mustard", "Polythene Pam", "She Came In Through the Bathroom Window", "Golden Slumbers", "Carry That Weight", "The End", "Her Majesty"]
    },
    {
        id: 13, titulo: "Rumours", artista: "Fleetwood Mac", ano: 1977, genero: "Soft Rock", capa: "img/Rumours.jpeg",
        musicas: ["Second Hand News", "Dreams", "Never Going Back Again", "Don't Stop", "Go Your Own Way", "Songbird", "The Chain", "You Make Loving Fun", "I Don't Want to Know", "Oh Daddy", "Gold Dust Woman"]
    },
    {
        id: 14, titulo: "What's Going On", artista: "Marvin Gaye", ano: 1971, genero: "Soul", capa: "img/WhatsGoingOn.jpg",
        musicas: ["What's Going On", "What's Happening Brother", "Flyin' High (In the Friendly Sky)", "Save the Children", "God Is Love", "Mercy Mercy Me", "Right On", "Wholy Holy", "Inner City Blues"]
    },
    {
        id: 15, titulo: "21", artista: "Adele", ano: 2011, genero: "Pop Soul", capa: "img/21.jpg",
        musicas: ["Rolling in the Deep", "Rumour Has It", "Turning Tables", "Don't You Remember", "Set Fire to the Rain", "He Won't Go", "Take It All", "I'll Be Waiting", "One and Only", "Lovesong", "Someone Like You"]
    },
    {
        id: 16, titulo: "OK Computer", artista: "Radiohead", ano: 1997, genero: "Alternative Rock", capa: "img/OkComputer.jpg",
        musicas: ["Airbag", "Paranoid Android", "Subterranean Homesick Alien", "Exit Music (For a Film)", "Let Down", "Karma Police", "Fitter Happier", "Electioneering", "Climbing Up the Walls", "No Surprises", "Lucky", "The Tourist"]
    },
    {
        id: 17, titulo: "The Rise and Fall of Ziggy Stardust", artista: "David Bowie", ano: 1972, genero: "Glam Rock", capa: "img/Ziggy.jpg",
        musicas: ["Five Years", "Soul Love", "Moonage Daydream", "Starman", "It Ain't Easy", "Lady Stardust", "Star", "Hang On to Yourself", "Ziggy Stardust", "Suffragette City", "Rock 'n' Roll Suicide"]
    },
    {
        id: 18, titulo: "Clube da Esquina", artista: "Milton Nascimento & Lô Borges", ano: 1972, genero: "MPB", capa: "img/ClubeDaEsquina.jpeg",
        musicas: ["Tudo Que Você Podia Ser", "Cais", "O Trem Azul", "Saídas e Bandeiras", "Nuvem Cigana", "Cravo e Canela", "Dos Cruces", "Um Girassol Da Cor De Seu Cabelo", "San Vicente", "Estrelas", "Clube da Esquina", "Paisagem da Janela", "Me Deixa Em Paz", "Os Povos", "Lilia", "Trem de Doido", "Nada Será Como Antes"]
    },
    {
        id: 19, titulo: "Paranoid", artista: "Black Sabbath", ano: 1970, genero: "Doom Metal", capa: "img/Paranoid.jpg",
        musicas: ["War Pigs", "Paranoid", "Planet Caravan", "Iron Man", "Electric Funeral", "Hand of Doom", "Rat Salad", "Fairies Wear Boots"]
    },
    {
        id: 20, titulo: "Back to Black", artista: "Amy Winehouse", ano: 2006, genero: "R&B", capa: "img/BackToBlack.jpg",
        musicas: ["Rehab", "You Know I'm No Good", "Me & Mr Jones", "Just Friends", "Back to Black", "Love Is a Losing Game", "Tears Dry on Their Own", "Wake Up Alone", "Some Unholy War", "He Can Only Hold Her", "Addicted"]
    },
    {
        id: 21, titulo: "Ramones", artista: "Ramones", ano: 1976, genero: "Punk Rock", capa: "img/Ramones.jpg",
        musicas: ["Blitzkrieg Bop", "Beat on the Brat", "Judy Is a Punk", "I Wanna Be Your Boyfriend", "Chain Saw", "Now I Wanna Sniff Some Glue", "I Don't Wanna Go Down to the Basement", "Loudmouth", "Havana Affair", "Listen to My Heart", "53rd & 3rd", "Let's Dance", "I Don't Wanna Walk Around With You", "Today Your Love, Tomorrow the World"]
    },
    {
        id: 22, titulo: "A Night at the Opera", artista: "Queen", ano: 1975, genero: "Operatic Rock", capa: "img/Opera.jpg",
        musicas: ["Death on Two Legs", "Lazing on a Sunday Afternoon", "I'm in Love with My Car", "You're My Best Friend", "'39", "Sweet Lady", "Seaside Rendezvous", "The Prophet's Song", "Love of My Life", "Good Company", "Bohemian Rhapsody", "God Save the Queen"]
    },
    {
        id: 23, titulo: "Highway 61 Revisited", artista: "Bob Dylan", ano: 1965, genero: "Folk", capa: "img/Highway61.jpg",
        musicas: ["Like a Rolling Stone", "Tombstone Blues", "It Takes a Lot to Laugh, It Takes a Train to Cry", "From a Buick 6", "Ballad of a Thin Man", "Queen Jane Approximately", "Highway 61 Revisited", "Just Like Tom Thumb's Blues", "Desolation Row"]
    },
    {
        id: 24, titulo: "Enter the Wu-Tang (36 Chambers)", artista: "Wu-Tang Clan", ano: 1993, genero: "Hardcore Hip-Hop", capa: "img/WuTang.jpeg",
        musicas: ["Bring da Ruckus", "Shame on a Nigga", "Clan in da Front", "Wu-Tang: 7 Deadly Sins", "Can It Be All So Simple", "Da Mystery of Chessboxin'", "Wu-Tang Clan Ain't Nuthing ta F' Wit", "C.R.E.A.M.", "Method Man", "Protect Ya Neck", "Tearz"]
    },
    {
        id: 25, titulo: "Demon Days", artista: "Gorillaz", ano: 2005, genero: "Trip Hop", capa: "img/DemonDays.jpg",
        musicas: ["Intro", "Last Living Souls", "Kids with Guns", "O Green World", "Dirty Harry", "Feel Good Inc.", "El Mañana", "Every Planet We Reach Is Dead", "November Has Come", "All Alone", "White Light", "DARE", "Fire Coming Out of the Monkey's Head", "Don't Get Lost in Heaven", "Demon Days"]
    },
    {
        id: 26, titulo: "Transa", artista: "Caetano Veloso", ano: 1972, genero: "Tropicália", capa: "img/Transa.jpeg",
        musicas: ["You Don't Know Me", "Nine Out of Ten", "Triste Bahia", "It's a Long Way", "Mora na Filosofia", "Neolithic Man", "Nostalgia"]
    },
    {
        id: 27, titulo: "The Miseducation of Lauryn Hill", artista: "Lauryn Hill", ano: 1998, genero: "Neo Soul", capa: "img/Lauryn.jpg",
        musicas: ["Intro", "Lost Ones", "Ex-Factor", "To Zion", "Doo Wop (That Thing)", "Superstar", "Final Hour", "When It Hurts So Bad", "I Used to Love Him", "Forgive Them Father", "Every Ghetto, Every City", "Nothing Even Matters", "Everything Is Everything", "The Miseducation of Lauryn Hill"]
    },
    {
        id: 28, titulo: "Is This It", artista: "The Strokes", ano: 2001, genero: "Garage Rock Revival", capa: "img/IsThisIt.jpg",
        musicas: ["Is This It", "The Modern Age", "Soma", "Barely Legal", "Someday", "Alone, Together", "Last Nite", "Hard to Explain", "New York City Cops", "Trying Your Luck", "Take It or Leave It"]
    },
    {
        id: 29, titulo: "Sobrevivendo no Inferno", artista: "Racionais MC's", ano: 1997, genero: "Rap Nacional", capa: "img/SNI.jpeg",
        musicas: ["Jorge da Capadócia", "Gênesis", "Capítulo 4, Versículo 3", "Tô Ouvindo Alguém Me Chamar", "Rapaz Comum", "Diário de um Detento", "Periferia É Periferia", "Qual Mentira Vou Acreditar", "Mágico de Oz", "Fórmula Mágica da Paz", "Salve"]
    },
    {
        id: 30, titulo: "A Tábua de Esmeralda", artista: "Jorge Ben Jor", ano: 1974, genero: "Samba Rock", capa: "img/JorgeBen.jpeg",
        musicas: ["Os Alquimistas Estão Chegando", "O Homem da Gravata Florida", "Errare Humanum Est", "Menina Mulher da Pele Preta", "Brother", "Minha Teimosia, Uma Arma Pra Te Conquistar", "Magnólia", "Minhas Margaridas", "Zumbi", "Hermes Trismegisto e Sua Celeste Tábua de Esmeralda", "Cinco Minutos", "O Namorado da Viúva"]
    }
    // ...

];

// 2. Resenhas do dados.js
const avaliacoesBase = [
    { albumId: 1, nota: 5.0, resenha: "Um álbum que define toda uma geração. A voz de Eddie Vedder está no seu auge." },
    { albumId: 1, nota: 4.5, resenha: "Guitarras melancólicas e letras profundas. 'Black' é a melhor faixa." },
    { albumId: 1, nota: 5.0, resenha: "Perfeito de início ao fim, não há uma única música fraca." },
    { albumId: 1, nota: 4.0, resenha: "Muito bom, embora prefira a produção dos álbuns seguintes." },
    { albumId: 1, nota: 5.0, resenha: "Energia pura. Um marco histórico no rock dos anos 90." },

    { albumId: 2, nota: 4.5, resenha: "Inovador na mistura de rock pesado com hip-hop. Nostalgia pura." },
    { albumId: 2, nota: 5.0, resenha: "Voz rasgada impressionante. Cada faixa é um hino absoluto." },
    { albumId: 2, nota: 4.0, resenha: "As letras são um pouco adolescentes, mas a energia é inegável." },
    { albumId: 2, nota: 5.0, resenha: "Produção impecável, envelheceu incrivelmente bem." },
    { albumId: 2, nota: 4.5, resenha: "Um clássico moderno que mudou a música mainstream." },

    { albumId: 3, nota: 5.0, resenha: "Uma verdadeira experiência cinematográfica em formato áudio." },
    { albumId: 3, nota: 5.0, resenha: "Liricamente impecável, a forma como conta a história é brilhante." },
    { albumId: 3, nota: 4.5, resenha: "Batidas excelentes e produção de altíssimo nível." },
    { albumId: 3, nota: 4.8, resenha: "Mudou a trajetória do hip-hop nesta década." },
    { albumId: 3, nota: 5.0, resenha: "Clássico instantâneo. Essencial para qualquer fã de música." }
];

// Gerador complementar para garantir resenhas em todos os 30 álbuns
const textosBons = [
    "Simplesmente uma obra-prima. As letras e a produção são de outro nível.",
    "Um clássico moderno. Escuto repetidas vezes e não me canso.",
    "Bate uma nostalgia forte. Envelheceu super bem.",
    "Não tem uma faixa ruim neste disco, é incrível do começo ao fim.",
    "Vocais fantásticos e instrumentais impecáveis. Nota máxima.",
    "Essencial para qualquer fã desse gênero musical."
];

const textosMedios = [
    "Tem ótimas faixas, mas o ritmo cai um pouco na segunda metade.",
    "Um bom álbum, sólido, mas o artista tem trabalhos melhores.",
    "Produção boa, mas falta algo inovador em algumas músicas."
];

const todasAvaliacoes = [...avaliacoesBase];

albuns.forEach(album => {
    const qtdParaGerar = (album.id <= 3) ? 5 : 10;
    for (let i = 0; i < qtdParaGerar; i++) {
        const pseudoRandom = ((album.id * 17) + (i * 23)) % 100;
        let nota, texto;
        if (pseudoRandom < 30) {
            nota = 3.5 + ((i % 2) * 0.5);
            texto = textosMedios[pseudoRandom % textosMedios.length];
        } else {
            nota = 4.0 + ((i % 3) * 0.5);
            texto = textosBons[pseudoRandom % textosBons.length];
        }
        todasAvaliacoes.push({
            albumId: album.id,
            nota: nota,
            resenha: texto
        });
    }
});

// ATENÇÃO: Adicione a importação do pacote bcrypt e jsonwebtoken no topo do arquivo se quiser usar a lógica de login depois!
// const bcrypt = require('bcrypt'); // (Opcional, apenas se sua tabela pedir senha criptografada futuramente)

async function popularTabelas() {
    const conexao = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ressonance_db'
    });

    try {
        console.log('⏳ A iniciar povoamento do MySQL...');

        // 1. Limpa as tabelas na ordem correta para não ferir as chaves estrangeiras
        await conexao.query('SET FOREIGN_KEY_CHECKS = 0');
        await conexao.query('TRUNCATE TABLE resenhas');
        await conexao.query('TRUNCATE TABLE albuns');
        await conexao.query('TRUNCATE TABLE utilizadores');
        await conexao.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Tabelas limpas e AUTO_INCREMENT repostos para 1.');

        // 2. Insere 5 Utilizadores Base
        // Aqui assumimos que a sua tabela utilizadores tem apenas 'id', 'nome' e 'email' 
        // (pois você removeu a 'senha' anteriormente devido ao erro do MySQL)
        const utilizadores = [
            { id: 1, nome: 'João Pedro', email: 'joao@ressonance.com' },
            { id: 2, nome: 'Maria Silva', email: 'maria@ressonance.com' },
            { id: 3, nome: 'Carlos Sousa', email: 'carlos@ressonance.com' },
            { id: 4, nome: 'Ana Santos', email: 'ana@ressonance.com' },
            { id: 5, nome: 'Tiago Lima', email: 'tiago@ressonance.com' }
        ];

        for (const user of utilizadores) {
            const queryUser = 'INSERT INTO utilizadores (id, nome, email) VALUES (?, ?, ?)';
            await conexao.execute(queryUser, [user.id, user.nome, user.email]);
        }
        console.log(`✅ ${utilizadores.length} Utilizadores inseridos com sucesso.`);

        // 3. Insere os Álbuns
        for (const album of albuns) {
            const queryAlbum = 'INSERT INTO albuns (id, titulo, artista, ano, genero, capa) VALUES (?, ?, ?, ?, ?, ?)';
            const capaValor = album.capa ? album.capa : null;
            await conexao.execute(queryAlbum, [album.id, album.titulo, album.artista, album.ano, album.genero, capaValor]);
        }
        console.log(`✅ ${albuns.length} Álbuns inseridos com sucesso.`);

        // 4. Insere as Resenhas e distribui pelos 5 utilizadores
        let resenhasInseridas = 0;
        
        for (const av of todasAvaliacoes) {
            // A mágica acontece aqui: Atribuímos o utilizador de 1 a 5 baseados no índice da resenha.
            // Para as resenhas base, o ID será 1, 2, 3, 4, 5. Para as geradas aleatoriamente, distribui igualmente.
            
            // Usamos o módulo (%) para ciclar entre os IDs 1 a 5
            const utilizadorAtribuido = (resenhasInseridas % 5) + 1;

            const queryResenha = 'INSERT INTO resenhas (album_id, utilizador_id, nota, texto) VALUES (?, ?, ?, ?)';
            
            // Lembre-se: no seu array, o texto chama-se 'resenha', e não 'texto'
            await conexao.execute(queryResenha, [av.albumId, utilizadorAtribuido, av.nota, av.resenha]);
            resenhasInseridas++;
        }
        
        console.log(`🎉 Sucesso! ${resenhasInseridas} Resenhas distribuídas entre os 5 utilizadores e inseridas.`);

    } catch (erro) {
        console.error('❌ Erro durante o povoamento:', erro.message);
    } finally {
        await conexao.end();
    }
}

popularTabelas();