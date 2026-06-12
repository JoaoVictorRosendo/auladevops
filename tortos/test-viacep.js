const https = require('https');

// Faz requisição HTTP nativa sem dependências externas
function fetchViaCEP(cep) {
    return new Promise((resolve, reject) => {
        https.get(`https://viacep.com.br/ws/${cep}/json/`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Erro ao fazer parse da resposta'));
                }
            });
        }).on('error', reject);
    });
}

async function runTests() {
    console.log('--- Iniciando Testes da API ViaCEP ---');

    // Teste 1: CEP válido
    try {
        console.log('\nTeste 1: CEP válido (01001000)...');
        const data = await fetchViaCEP('01001000');
        if (data.logradouro === 'Praça da Sé' && data.localidade === 'São Paulo') {
            console.log('✅ PASSOU');
        } else {
            console.error('❌ FALHOU: endereço inesperado', data);
        }
    } catch (e) {
        console.error('❌ FALHOU:', e);
    }

    // Teste 2: CEP inexistente
    try {
        console.log('\nTeste 2: CEP inexistente (99999999)...');
        const data = await fetchViaCEP('99999999');
        if (data.erro === 'true' || data.erro === true) {
            console.log('✅ PASSOU');
        } else {
            console.error('❌ FALHOU:', data);
        }
    } catch (e) {
        console.error('❌ FALHOU:', e);
    }

    // Teste 3: formato inválido — a API retorna HTML ou erro de parse
    try {
        console.log('\nTeste 3: formato inválido (ABC)...');
        const data = await fetchViaCEP('ABC').catch(e => e);
        if (data instanceof Error || data.erro) {
            console.log('✅ PASSOU');
        } else {
            console.error('❌ FALHOU:', data);
        }
    } catch (e) {
        console.log('✅ PASSOU');
    }

    console.log('\n--- Testes Finalizados ---');
}

runTests();
