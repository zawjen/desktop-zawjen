require('dotenv').config(); // Load .env file

const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
const PYTHON_SCRIPT_PATH = process.env.PYTHON_SCRIPT_PATH;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
});

// Function to spawn Python process
function runPythonProcess(event, jsonData, pythonCommand) {
    const pythonProcess = spawn(pythonCommand, [PYTHON_SCRIPT_PATH]);

    console.log(pythonCommand, jsonData);
    pythonProcess.stdin.write(jsonData + "\n");
    //pythonProcess.stdin.write(JSON.stringify(jsonData) + "\n");
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        const response = data.toString().trim();
        try {
            const jsonResponse = JSON.parse(response);
            event.reply('receive-json', jsonResponse);
        } catch (error) {
            event.reply('receive-json', { error: "Invalid JSON response from Python" });
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error (${pythonCommand}):`, data.toString());

        if (pythonCommand === 'py') {
            //console.log('Retrying with python.exe...');
            //runPythonProcess(event, jsonData, 'python'); // Retry with python.exe
        } else {
            event.reply('receive-json', { error: "Python script error" });
        }
    });

    pythonProcess.on('error', (err) => {
        console.error(`Failed to start ${pythonCommand}:`, err);

        if (pythonCommand === 'py') {
            console.log('Retrying with python.exe...');
            runPythonProcess(event, jsonData, 'python'); // Retry with python.exe
        } else {
            event.reply('receive-json', { error: "Failed to start Python process" });
        }
    });
}

// IPC handler for JSON requests
ipcMain.on('send-json', (event, jsonData) => {
    runPythonProcess(event, jsonData, 'py'); // Try with py.exe first
});
