require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

let lastId = null;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const API_URL = process.env.API_URL;

async function fetchData() {
    try {
        console.log('Iniciando a busca de dados...');
        const response = await axios.get(API_URL);

        console.log('Resposta completa da API:', response.data);

        const data = response.data && response.data.data ? response.data.data : null;

        if (data) {
            console.log('Dados recebidos:', data);

            if (data.id !== lastId) {
                lastId = data.id;
                console.log('Novo sinal encontrado. Enviando notificação...');

                const message = `
📢 *Novo Sinal Disponível* 🚀

📌 *Par:* ${data.par}
📅 *Horário:* ${new Date(data.tempo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
⏳ *Expiração:* ${data.expiracao}
📉 *Entrada:* ${data.acao}

📊 *Resultado:* ${data.resultado ? data.resultado : 'Aguardando...'}

⚠️ *Aguardar confirmação!*
                `;

                await sendTelegramMessage(message);
                return data;
            } else {
                console.log('Nenhuma atualização encontrada.');
            }
        } else {
            console.log('Nenhum dado válido encontrado.');
        }
    } catch (error) {
        console.error('Erro ao buscar dados:', error.message);
    }
    return null;
}

async function sendTelegramMessage(message) {
    try {
        console.log('Enviando mensagem para o Telegram...');
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
        });

        console.log('Resposta do Telegram:', response.data);

        if (response.data.ok) {
            console.log('Mensagem enviada com sucesso!');
        } else {
            console.error('Falha ao enviar mensagem:', response.data.description);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem para o Telegram:', error.message);
    }
}

async function testTelegramConnection() {
    try {
        console.log('Enviando mensagem de teste para verificar a conexão...');
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: "Teste de mensagem",
            parse_mode: 'Markdown',
        });

        console.log('Resposta do Telegram:', response.data);
    } catch (error) {
        console.error('Erro ao enviar mensagem de teste para o Telegram:', error.message);
    }
}

app.get('/api/check', async (req, res) => {
    console.log('Requisição recebida para /api/check');
    const result = await fetchData();
    if (result) {
        console.log('Dados enviados:', result);
        res.json({ success: true, data: result });
    } else {
        console.log('Nenhuma atualização disponível.');
        res.json({ success: false, message: 'Nenhuma atualização' });
    }
});

setInterval(() => {
    console.log('Executando fetchData a cada 60 segundos...');
    fetchData();
}, 60000);

testTelegramConnection();

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
