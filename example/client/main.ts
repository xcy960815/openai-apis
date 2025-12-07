import { ChatClient } from '../../src/index';
import { ListModelsResponse } from '../../src/types';

// --- State ---
const config = {
    apiKey: import.meta.env.OPENAI_API_KEY || '',
    apiBaseUrl: import.meta.env.OPENAI_API_BASE_URL || 'https://api.deepseek.com',
    model: import.meta.env.OPENAI_MODEL || 'deepseek-chat',
    systemMessage: 'You are a helpful assistant.',
    temperature: 0.8,
    maxResponseTokens: 1000
};

let chatClient: ChatClient;
let parentMessageId: string | undefined = undefined;
let loading = false;
let currentAssistantMessageDiv: HTMLElement | null = null;

// --- DOM Elements ---
const settingsToggle = document.getElementById('settings-toggle') as HTMLButtonElement;
const settingsPanel = document.getElementById('settings-panel') as HTMLDivElement;
const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;
const refreshModelsBtn = document.getElementById('refresh-models') as HTMLButtonElement;
// Removed modelList as it is no longer used

const apiKeyInput = document.getElementById('config-apiKey') as HTMLInputElement;
const apiBaseUrlInput = document.getElementById('config-apiBaseUrl') as HTMLInputElement;
const modelInput = document.getElementById('config-model') as HTMLSelectElement;
const systemMessageInput = document.getElementById('config-systemMessage') as HTMLTextAreaElement;
const temperatureInput = document.getElementById('config-temperature') as HTMLInputElement;
const maxTokensInput = document.getElementById('config-maxTokens') as HTMLInputElement;
const tempDisplay = document.getElementById('temp-display') as HTMLSpanElement;

const messagesContainer = document.getElementById('messages-container') as HTMLDivElement;
const inputMessage = document.getElementById('input-message') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

// --- Initialization ---
function initConfigUI() {
    apiKeyInput.value = config.apiKey;
    apiBaseUrlInput.value = config.apiBaseUrl;
    
    // Ensure current model is an option
    let found = false;
    for (let i = 0; i < modelInput.options.length; i++) {
        if (modelInput.options[i].value === config.model) {
            found = true;
            break;
        }
    }
    if (!found) {
        const option = document.createElement('option');
        option.value = config.model;
        option.textContent = config.model;
        modelInput.appendChild(option);
    }
    modelInput.value = config.model;

    systemMessageInput.value = config.systemMessage;
    temperatureInput.value = config.temperature.toString();
    maxTokensInput.value = config.maxResponseTokens.toString();
    tempDisplay.textContent = config.temperature.toString();
}

function initClient() {
    chatClient = new ChatClient({
        apiKey: config.apiKey,
        apiBaseUrl: config.apiBaseUrl,
        withContent: true,
        milliseconds: 60000,
        systemMessage: config.systemMessage,
        maxResponseTokens: config.maxResponseTokens,
        requestParams: {
            model: config.model,
            temperature: config.temperature,
        },
    });
}

// --- UI Helpers ---
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createMessageElement(role: 'user' | 'assistant', content: string): HTMLElement {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'role-label';
    roleLabel.textContent = role === 'user' ? 'You' : 'DeepSeek';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = content;
    
    msgDiv.appendChild(roleLabel);
    msgDiv.appendChild(contentDiv);
    
    return msgDiv;
}

function appendMessage(role: 'user' | 'assistant', content: string): HTMLElement {
    const msgEl = createMessageElement(role, content);
    messagesContainer.appendChild(msgEl);
    scrollToBottom();
    return msgEl.querySelector('.content') as HTMLElement;
}

function updateLoadingState(isLoading: boolean) {
    loading = isLoading;
    sendBtn.disabled = isLoading;
    cancelBtn.disabled = !isLoading;
}

// --- Actions ---
async function fetchModels() {
    try {
        // Temporarily init client with current UI values to ensure key is correct
        const tempClient = new ChatClient({
            apiKey: apiKeyInput.value,
            apiBaseUrl: apiBaseUrlInput.value,
            withContent: true,
            milliseconds: 60000,
            requestParams: { model: 'deepseek-chat' } // dummy
        });

        const res = await tempClient.getModels();
        if (res) {
            const data = await res.json();
            if (data && Array.isArray(data.data)) {
                const currentVal = modelInput.value;
                modelInput.innerHTML = '';
                data.data.forEach((m) => {
                    const option = document.createElement('option');
                    option.value = m.id;
                    option.textContent = m.id;
                    modelInput.appendChild(option);
                });
                
                // Try to restore selection
                if (currentVal) {
                    // Check if currentVal exists in new options
                    let exists = false;
                    for(let i=0; i<modelInput.options.length; i++) {
                        if(modelInput.options[i].value === currentVal) {
                            modelInput.value = currentVal;
                            exists = true;
                            break;
                        }
                    }
                    // If not exists, maybe keep it? Or select first? 
                    // If we want to keep custom models not returned by API, we should have added it back.
                    // But usually getModels returns all available.
                    if (!exists && currentVal) {
                         const option = document.createElement('option');
                         option.value = currentVal;
                         option.textContent = currentVal;
                         modelInput.appendChild(option);
                         modelInput.value = currentVal;
                    }
                }
                
                alert('Models refreshed!');
            }
        }
    } catch (error) {
        console.error('Failed to fetch models:', error);
        alert('Failed to fetch models. Check API Key and Base URL.');
    }
}

async function sendMessage() {
    const text = inputMessage.value.trim();
    if (!text || loading) return;

    inputMessage.value = '';
    updateLoadingState(true);

    // User Message
    appendMessage('user', text);

    // Assistant Placeholder
    currentAssistantMessageDiv = appendMessage('assistant', '<span class="typing">Thinking...</span>');

    try {
        const res = await chatClient.sendMessage(text, {
            parentMessageId,
            onProgress: (partialResponse) => {
                if (currentAssistantMessageDiv && partialResponse.content) {
                    currentAssistantMessageDiv.innerHTML = partialResponse.content;
                    scrollToBottom();
                }
            },
        });
        parentMessageId = res.messageId;
        if (currentAssistantMessageDiv) {
            currentAssistantMessageDiv.innerHTML = res.content || '';
        }
    } catch (error: any) {
        console.error(error);
        if (currentAssistantMessageDiv) {
            if (error.message && (error.message.includes('aborted') || error.name === 'AbortError')) {
                const currentContent = currentAssistantMessageDiv.innerHTML;
                if (currentContent && !currentContent.includes('Thinking...')) {
                    currentAssistantMessageDiv.innerHTML += '<br/><span class="cancelled">(Request cancelled)</span>';
                } else {
                    currentAssistantMessageDiv.innerHTML = '<span class="cancelled">Request cancelled.</span>';
                }
            } else {
                currentAssistantMessageDiv.innerHTML = `<span class="error">Error: ${error.message}</span>`;
            }
        }
    } finally {
        updateLoadingState(false);
        currentAssistantMessageDiv = null;
        scrollToBottom();
    }
}

function cancelConversation() {
    chatClient.cancelConversation('Request cancelled by user');
    updateLoadingState(false);
}

// --- Event Listeners ---
settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
});

temperatureInput.addEventListener('input', () => {
    tempDisplay.textContent = temperatureInput.value;
});

saveSettingsBtn.addEventListener('click', () => {
    config.apiKey = apiKeyInput.value;
    config.apiBaseUrl = apiBaseUrlInput.value;
    config.model = modelInput.value;
    config.systemMessage = systemMessageInput.value;
    config.temperature = parseFloat(temperatureInput.value);
    config.maxResponseTokens = parseInt(maxTokensInput.value);
    
    initClient();
    settingsPanel.classList.remove('active');
    alert('Settings applied!');
});

refreshModelsBtn.addEventListener('click', fetchModels);

sendBtn.addEventListener('click', sendMessage);

cancelBtn.addEventListener('click', cancelConversation);

inputMessage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// --- Start ---
initConfigUI();
initClient();
// Auto fetch models on load
fetchModels();
