document.addEventListener('DOMContentLoaded', async () => {
    const formAlbum = document.getElementById('form-album');
    const divMensagem = document.getElementById('mensagem-retorno');
    const token = localStorage.getItem('token');

    function mostrarMensagem(texto, cor = 'red') {
        divMensagem.replaceChildren();
        const p = document.createElement('p');
        p.style.color = cor;
        p.textContent = texto; // jamais interpretar HTML fornecido por usuários/servidor
        divMensagem.appendChild(p);
    }

    if (!token) {
        alert('Acesso negado. Faça login como administrador.');
        window.location.href = 'login.html';
        return;
    }

    // Verificação de interface: a autorização real está no backend em cada rota.
    try {
        const response = await fetch('http://localhost:3000/api/usuarios/me', { headers: { Authorization: `Bearer ${token}` } });
        const perfil = response.ok ? await response.json() : null;
        if (!perfil || perfil.perfil !== 'admin') {
            alert('Esta página é exclusiva para administradores.');
            window.location.href = 'index.html';
            return;
        }
    } catch (_) {
        mostrarMensagem('Não foi possível confirmar a permissão. Verifique o servidor.');
        return;
    }

    formAlbum.addEventListener('submit', async evento => {
        evento.preventDefault();
        const idEdicao = document.getElementById('id-album-editar').value.trim();
        const titulo = document.getElementById('titulo').value.trim();
        const artista = document.getElementById('artista').value.trim();
        const ano = Number(document.getElementById('ano').value);
        const genero = document.getElementById('genero').value.trim();
        const capa = document.getElementById('capa').value.trim();
        const faixas = document.getElementById('faixas').value.split('\n').map(s => s.trim()).filter(Boolean);

        if (faixas.some(f => f.length > 150)) {
            mostrarMensagem('Cada título de faixa deve conter no máximo 150 caracteres.');
            return;
        }
        if (idEdicao && (!Number.isSafeInteger(Number(idEdicao)) || Number(idEdicao) <= 0)) {
            mostrarMensagem('ID de álbum inválido.');
            return;
        }
        if (idEdicao && faixas.length) {
            mostrarMensagem('A atualização modifica apenas os dados do álbum. Deixe as faixas vazias para editar.');
            return;
        }

        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        try {
            const emEdicao = Boolean(idEdicao);
            const url = emEdicao ? `http://localhost:3000/api/albuns/${encodeURIComponent(idEdicao)}` : 'http://localhost:3000/api/albuns';
            const response = await fetch(url, {
                method: emEdicao ? 'PUT' : 'POST', headers,
                body: JSON.stringify({ titulo, artista, ano, genero, capa })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                mostrarMensagem(`Erro ao salvar: ${data.erro || 'Falha na requisição.'}`);
                return;
            }
            if (emEdicao) {
                mostrarMensagem(`Álbum ID ${idEdicao} atualizado com sucesso.`, 'green');
                formAlbum.reset();
                return;
            }
            const errors = [];
            for (let i = 0; i < faixas.length; i++) {
                const r = await fetch(`http://localhost:3000/api/albuns/${data.id}/faixas`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ numero_faixa: i + 1, titulo: faixas[i] })
                });
                if (!r.ok) errors.push(`${i + 1}. ${faixas[i]}`);
            }
            if (errors.length) {
                mostrarMensagem(`Álbum ID ${data.id} criado, mas houve falha nas faixas: ${errors.join(', ')}`, 'darkorange');
            } else {
                mostrarMensagem(`Álbum "${titulo}" criado com ${faixas.length} faixa(s). ID: ${data.id}`, 'green');
                formAlbum.reset();
            }
        } catch (error) {
            console.error('Falha na chamada da API:', error);
            mostrarMensagem('Não foi possível conectar ao servidor.');
        }
    });
});
