document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const formCadastro = document.getElementById('form-cadastro');
    const tituloForm = document.getElementById('titulo-form');
    const irParaCadastro = document.getElementById('ir-para-cadastro');
    const irParaLogin = document.getElementById('ir-para-login');
    const divMensagem = document.getElementById('mensagem-auth');

    irParaCadastro.addEventListener('click', () => {
        formLogin.style.display = 'none';
        formCadastro.style.display = 'flex';
        tituloForm.textContent = 'Criar Conta';
        divMensagem.innerHTML = '';
    });

    irParaLogin.addEventListener('click', () => {
        formCadastro.style.display = 'none';
        formLogin.style.display = 'flex';
        tituloForm.textContent = 'Entrar';
        divMensagem.innerHTML = '';
    });

    // Lógica de Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-login').value;
        const senha = document.getElementById('senha-login').value;

        try {
            const resposta = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                localStorage.setItem('token', dados.token); // Salva o JWT
                divMensagem.innerHTML = `<p style="color: green;">Login realizado! Redirecionando...</p>`;
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                divMensagem.innerHTML = `<p style="color: red;">${dados.erro}</p>`;
            }
        } catch (erro) {
            divMensagem.innerHTML = `<p style="color: red;">Erro ao conectar ao servidor.</p>`;
        }
    });

    // Lógica de Cadastro
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-cadastro').value;
        const email = document.getElementById('email-cadastro').value;
        const senha = document.getElementById('senha-cadastro').value;
        const perfil = document.getElementById('perfil-cadastro').value;

        try {
            const resposta = await fetch('http://localhost:3000/api/auth/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha, perfil })
            });

            if (resposta.ok) {
                divMensagem.innerHTML = `<p style="color: green;">Conta criada! Faça login.</p>`;
                formCadastro.reset();
                irParaLogin.click();
            } else {
                const dados = await resposta.json();
                divMensagem.innerHTML = `<p style="color: red;">${dados.erro}</p>`;
            }
        } catch (erro) {
            console.error(erro);
            divMensagem.innerHTML = `<p style="color: red;">Servidor offline ou erro de conexão. Verifique o terminal do Node.js.</p>`;
        }
    });
});