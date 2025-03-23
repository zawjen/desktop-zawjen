const { ipcRenderer } = require('electron');

document.getElementById('send').addEventListener('click', () => {
    const question = document.getElementById('question').value;
    //ipcRenderer.send('send-json', { q: question });
    ipcRenderer.send('send-json', question);
});

ipcRenderer.on('receive-json', (event, data) => {
    document.getElementById('response').innerText = JSON.stringify(data, null, 2);
});
