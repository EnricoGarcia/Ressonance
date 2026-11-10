document.addEventListener("DOMContentLoaded", () => {
    const formAuth = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");
    
    // Links de alternância
    const btnIrParaCadastro = document.getElementById("ir-para-cadastro");
    const btnIrParaLogin = document.getElementById("ir-para-login");
    const tituloForm = document.getElementById("titulo-form");

    // Lógica para alternar entre as abas de Login e Registro sem reload
    if (btnIrParaCadastro && btnIrParaLogin) {
        btnIrParaCadastro.addEventListener("click", () => {
            formAuth.style.display = "none";
            formCadastro.style.display = "flex";
            tituloForm.textContent = "Criar Conta";
        });

        btnIrParaLogin.addEventListener("click", () => {
            formCadastro.style.display = "none";
            formAuth.style.display = "flex";
            tituloForm.textContent = "Entrar";
        });
    }

    // Lógica de CADASTRO
    if (formCadastro) {
        formCadastro.addEventListener("submit", async (evento) => {
            evento.preventDefault(); // Impede o reload da página
            
            const nome = document.getElementById("nome-cadastro").value;
            const email = document.getElementById("email-cadastro").value;
            const senha = document.getElementById("senha-cadastro").value;
            
            try {
                const resposta = await fetch('http://localhost:3000/api/auth/registar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha, perfil: "usuario" })
                });
                
                const dados = await resposta.json();
                
                if (resposta.ok) {
                    alert("Cadastro efetuado com sucesso! Agora faça o login.");
                    btnIrParaLogin.click(); 
                    formCadastro.reset();
                } else {
                    alert(`Erro no cadastro: ${dados.erro || 'Falha ao registrar.'}`);
                }
            } catch (erro) {
                console.error("Erro na requisição:", erro);
                alert("Erro ao tentar conectar ao servidor.");
            }
        });
    }

    // Lógica de LOGIN
    if (formAuth) {
        formAuth.addEventListener("submit", async (evento) => {
            evento.preventDefault(); // Impede o reload da página
            
            const email = document.getElementById("email-login").value;
            const senha = document.getElementById("senha-login").value;
            
            try {
                const resposta = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                
                const dados = await resposta.json();
                
                if (resposta.ok) {
                    // Salva os dados localmente
                    localStorage.setItem('token', dados.token);
                    const perfilDoUsuario = {
                        id: dados.utilizador.id,
                        nome: dados.utilizador.nome,
                        perfil: dados.utilizador.perfil
                    };
                    localStorage.setItem('usuarioPerfil', JSON.stringify(perfilDoUsuario));
                    
                    alert("Login efetuado com sucesso!");
                    
                    if (dados.utilizador.perfil === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'meu-perfil.html';
                    }
                } else {
                    alert(`Erro: ${dados.erro || 'Email ou senha inválidos'}`);
                }
            } catch (erro) {
                console.error("Erro na requisição de login:", erro);
                alert("Erro ao tentar conectar ao servidor.");
            }
        });
    }
});