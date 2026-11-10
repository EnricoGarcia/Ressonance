// Baixa as capas para a pasta img/ usando a API da Wikipédia (precisa de internet).
// Uso: node baixar-capas.js   (Node 18+)
const fs = require('fs');
const path = require('path');
const albuns = require('./albuns-novos');

const PASTA = path.join(__dirname, 'img');
const HEADERS = { 'User-Agent': 'RessonanceProjeto/1.0 (projeto academico)' };

async function baixar() {
    fs.mkdirSync(PASTA, { recursive: true });
    const relatorio = [];

    for (const album of albuns) {
        const pagina = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(album.wiki.replace(/ /g, '_'));
        const destino = path.join(__dirname, album.capa);
        try {
            if (fs.existsSync(destino)) { console.log(`= já existe: ${album.capa}`); continue; }

            const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(album.wiki), { headers: HEADERS });
            if (!r.ok) throw new Error('artigo não encontrado (HTTP ' + r.status + ')');
            const dados = await r.json();
            const urlImagem = (dados.originalimage || dados.thumbnail || {}).source;
            if (!urlImagem) throw new Error('artigo sem imagem');

            const img = await fetch(urlImagem, { headers: HEADERS });
            if (!img.ok) throw new Error('falha ao baixar imagem (HTTP ' + img.status + ')');
            fs.writeFileSync(destino, Buffer.from(await img.arrayBuffer()));

            console.log(`+ ${album.capa}`);
            relatorio.push(`${album.titulo}\n  página: ${pagina}\n  imagem: ${urlImagem}\n`);
        } catch (e) {
            console.log(`! ${album.titulo}: ${e.message}`);
            relatorio.push(`${album.titulo}\n  FALHOU (${e.message}) - baixe manualmente: ${pagina}\n`);
        }
        await new Promise(res => setTimeout(res, 300)); // evita sobrecarregar a API
    }
    fs.writeFileSync('capas-links.txt', relatorio.join('\n'));
    console.log('\nLinks de página e de imagem salvos em capas-links.txt');
}

baixar();
