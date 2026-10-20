require('dotenv').config();
const mysql = require('mysql2/promise');

const albuns = [
    { titulo: "Ten", artista: "Pearl Jam", ano: 1991, genero: "Grunge", capa: "img/Ten.jpg" },
    { titulo: "Hybrid Theory", artista: "Linkin Park", ano: 2000, genero: "Nu Metal", capa: "img/HybridTheory.jpg"},
    { titulo: "Good Kid, M.A.A.D City", artista: "Kendrick Lamar", ano: 2012, genero: "Hip-Hop", capa: "img/GKMC.jpeg" },
    { titulo: "The Dark Side of the Moon", artista: "Pink Floyd", ano: 1973, genero: "Progressive Rock", capa: "img/DarkSide.png" },
    { titulo: "Kind of Blue", artista: "Miles Davis", ano: 1959, genero: "Jazz", capa: "img/KindofBlue.png" },
    { titulo: "Random Access Memories", artista: "Daft Punk", ano: 2013, genero: "Electronic", capa: "img/RandomAccess.jpg" },
    { titulo: "Thriller", artista: "Michael Jackson", ano: 1982, genero: "Pop", capa: "img/Thriller.jpg" },
    { titulo: "Exodus", artista: "Bob Marley & The Wailers", ano: 1977, genero: "Reggae", capa: "img/Exodus.jpg" },
    { titulo: "Master of Puppets", artista: "Metallica", ano: 1986, genero: "Thrash Metal", capa: "img/MasterOfPuppets.jpg" },
    { titulo: "AM", artista: "Arctic Monkeys", ano: 2013, genero: "Indie Rock", capa: "img/AM.jpeg" },
    { titulo: "DeBÍ TiRAR MáS FOToS", artista: "Bad Bunny", ano: 2025, genero: "Reggaeton", capa: "img/DTMF.png" },
    { titulo: "Abbey Road", artista: "The Beatles", ano: 1969, genero: "Classic Rock", capa: "img/AbbeyRoad.jpeg" },
    { titulo: "Rumours", artista: "Fleetwood Mac", ano: 1977, genero: "Soft Rock", capa: "img/Rumours.jpeg" },
    { titulo: "What's Going On", artista: "Marvin Gaye", ano: 1971, genero: "Soul", capa: "img/WhatsGoingOn.jpg" },
    { titulo: "21", artista: "Adele", ano: 2011, genero: "Pop Soul", capa: "img/21.jpg" },
    { titulo: "OK Computer", artista: "Radiohead", ano: 1997, genero: "Alternative Rock", capa: "img/OKComputer.jpg" },
    { titulo: "The Rise and Fall of Ziggy Stardust", artista: "David Bowie", ano: 1972, genero: "Glam Rock", capa: "img/Ziggy.jpg" },
    { titulo: "Clube da Esquina", artista: "Milton Nascimento & Lô Borges", ano: 1972, genero: "MPB", capa: "img/ClubeDaEsquina.jpeg" },
    { titulo: "Paranoid", artista: "Black Sabbath", ano: 1970, genero: "Doom Metal", capa: "img/Paranoid.jpg" },
    { titulo: "Back to Black", artista: "Amy Winehouse", ano: 2006, genero: "R&B", capa: "img/BackToBlack.jpg" },
    { titulo: "Ramones", artista: "Ramones", ano: 1976, genero: "Punk Rock", capa: "img/Ramones.jpg" },
    { titulo: "A Night at the Opera", artista: "Queen", ano: 1975, genero: "Operatic Rock", capa: "img/Opera.jpg" },
    { titulo: "Highway 61 Revisited", artista: "Bob Dylan", ano: 1965, genero: "Folk", capa: "img/Highway61.jpg" },
    { titulo: "Enter the Wu-Tang (36 Chambers)", artista: "Wu-Tang Clan", ano: 1993, genero: "Hardcore Hip-Hop", capa: "img/WuTang.jpeg" },
    { titulo: "Demon Days", artista: "Gorillaz", ano: 2005, genero: "Trip Hop", capa: "img/DemonDays.jpg" },
    { titulo: "Transa", artista: "Caetano Veloso", ano: 1972, genero: "Tropicália", capa: "img/Transa.jpeg" },
    { titulo: "The Miseducation of Lauryn Hill", artista: "Lauryn Hill", ano: 1998, genero: "Neo Soul", capa: "img/Lauryn.jpg" },
    { titulo: "Is This It", artista: "The Strokes", ano: 2001, genero: "Garage Rock Revival", capa: "img/IsThisIt.jpg" },
    { titulo: "Sobrevivendo no Inferno", artista: "Racionais MC's", ano: 1997, genero: "Rap Nacional", capa: "img/SNI.jpeg" },
    { titulo: "A Tábua de Esmeralda", artista: "Jorge Ben Jor", ano: 1974, genero: "Samba Rock", capa: "img/JorgeBen.jpEg" }
];

async function limparEPovoar() {
    const conexao = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ressonance_data'
    });

    try {
        console.log('⏳ A iniciar limpeza profunda...');
    
        await conexao.query('SET FOREIGN_KEY_CHECKS = 0');
        
        await conexao.query('TRUNCATE TABLE resenhas');
        await conexao.query('TRUNCATE TABLE albuns');
        
        await conexao.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('Base de dados limpa. IDs repostos para 1.');
        console.log('A iniciar povoamento...');

        let inseridos = 0;
        for (const album of albuns) {
            const query = 'INSERT INTO albuns (titulo, artista, ano, genero, capa) VALUES (?, ?, ?, ?, ?)';
            const valores = [album.titulo, album.artista, album.ano, album.genero, album.capa];
            await conexao.execute(query, valores);
            inseridos++;
        }

        console.log(`Sucesso! ${inseridos} álbuns inseridos perfeitamente.`);

    } catch (erro) {
        console.error('Erro:', erro.message);
    } finally {
        await conexao.end();
    }
}

limparEPovoar();