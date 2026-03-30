import { ChatClient } from '../../src/index';

// --- State ---
const config = {
    apiKey: import.meta.env.OPENAI_API_KEY || '',
    apiBaseUrl: import.meta.env.OPENAI_API_BASE_URL || 'https://api.openai.com',
    model: import.meta.env.OPENAI_MODEL || 'gpt-5-mini',
    systemMessage: 'You are a helpful assistant.',
    temperature: 0.8,
    maxResponseTokens: 1000,
    markdown2Html: false,
};
console.log("config",config);

const OPENAI_DEV_PROXY_PREFIX = '/api/openai';
const MINIMAX_PORTAL_HOSTNAME = 'platform.minimaxi.com';
const MINIMAX_API_HOSTNAMES = new Set(['api.minimaxi.com', 'api.minimax.io']);
const MINIMAX_MODEL_SUGGESTIONS = [
    'MiniMax-M2.7',
    'MiniMax-M2.7-highspeed',
    'MiniMax-M2.5',
    'MiniMax-M2.5-highspeed',
    'MiniMax-M2.1',
    'MiniMax-M2.1-highspeed',
    'MiniMax-M2',
];

let chatClient: ChatClient;
let parentMessageId: string | undefined = undefined;
let loading = false;
let currentAssistantMessageDiv: HTMLElement | null = null;

function normalizeApiBaseUrl(apiBaseUrl: string): string {
    const trimmedApiBaseUrl = apiBaseUrl.trim();
    if (!trimmedApiBaseUrl) {
        return '';
    }

    try {
        const parsedApiBaseUrl = new URL(trimmedApiBaseUrl);

        if (parsedApiBaseUrl.hostname === MINIMAX_PORTAL_HOSTNAME) {
            parsedApiBaseUrl.hostname = 'api.minimaxi.com';
        }

        return parsedApiBaseUrl.toString().replace(/\/+$/, '').replace(/\/v1$/, '');
    } catch {
        return trimmedApiBaseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
    }
}

function sanitizeApiBaseUrlForDisplay(apiBaseUrl: string): string {
    const trimmedApiBaseUrl = apiBaseUrl.trim();
    if (!trimmedApiBaseUrl) {
        return '';
    }

    try {
        const parsedApiBaseUrl = new URL(trimmedApiBaseUrl);

        if (parsedApiBaseUrl.hostname === MINIMAX_PORTAL_HOSTNAME) {
            parsedApiBaseUrl.hostname = 'api.minimaxi.com';
        }

        return parsedApiBaseUrl.toString().replace(/\/+$/, '');
    } catch {
        return trimmedApiBaseUrl.replace(/\/+$/, '');
    }
}

function getApiHostname(apiBaseUrl: string): string | null {
    const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
    if (!normalizedApiBaseUrl) {
        return null;
    }

    try {
        return new URL(normalizedApiBaseUrl).hostname;
    } catch {
        return null;
    }
}

function isMiniMaxApiBaseUrl(apiBaseUrl: string): boolean {
    const hostname = getApiHostname(apiBaseUrl);
    return hostname ? MINIMAX_API_HOSTNAMES.has(hostname) : false;
}

// Providers like MiniMaxi often block direct browser CORS, so the local Vite server
// proxies cross-origin OpenAI-compatible traffic during development.
function resolveApiBaseUrl(apiBaseUrl: string): string {
    const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
    if (!normalizedApiBaseUrl || !import.meta.env.DEV) {
        return normalizedApiBaseUrl;
    }

    try {
        const parsedApiBaseUrl = new URL(normalizedApiBaseUrl);
        if (parsedApiBaseUrl.origin === window.location.origin) {
            return normalizedApiBaseUrl;
        }

        return `${window.location.origin}${OPENAI_DEV_PROXY_PREFIX}/${encodeURIComponent(normalizedApiBaseUrl)}`;
    } catch {
        return normalizedApiBaseUrl;
    }
}

// --- DOM Elements ---
const settingsToggle = document.getElementById('settings-toggle') as HTMLButtonElement;
const settingsPanel = document.getElementById('settings-panel') as HTMLDivElement;
const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;
const refreshModelsBtn = document.getElementById('refresh-models') as HTMLButtonElement;

const apiKeyInput = document.getElementById('config-apiKey') as HTMLInputElement;
const apiBaseUrlInput = document.getElementById('config-apiBaseUrl') as HTMLInputElement;
const modelInput = document.getElementById('config-model') as HTMLInputElement;
const modelOptions = document.getElementById('config-model-options') as HTMLDataListElement;
const systemMessageInput = document.getElementById('config-systemMessage') as HTMLTextAreaElement;
const temperatureInput = document.getElementById('config-temperature') as HTMLInputElement;
const maxTokensInput = document.getElementById('config-maxTokens') as HTMLInputElement;
const tempDisplay = document.getElementById('temp-display') as HTMLSpanElement;

const messagesContainer = document.getElementById('messages-container') as HTMLDivElement;
const inputMessage = document.getElementById('input-message') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

function appendModelOption(modelName: string) {
    const normalizedModelName = modelName.trim();
    if (!normalizedModelName) {
        return;
    }

    const hasExistingOption = Array.from(modelOptions.options).some(
        (option) => option.value === normalizedModelName,
    );
    if (hasExistingOption) {
        return;
    }

    const option = document.createElement('option');
    option.value = normalizedModelName;
    modelOptions.appendChild(option);
}

function replaceModelOptions(modelNames: string[], currentModelName = '') {
    const normalizedModelNames = Array.from(
        new Set(
            modelNames
                .map((modelName) => modelName.trim())
                .filter((modelName) => modelName.length > 0),
        ),
    );

    modelOptions.innerHTML = '';
    normalizedModelNames.forEach((modelName) => {
        appendModelOption(modelName);
    });

    appendModelOption(currentModelName);
}

function syncProviderModelOptions() {
    const currentModelName = modelInput.value.trim() || config.model;

    if (isMiniMaxApiBaseUrl(apiBaseUrlInput.value)) {
        replaceModelOptions(MINIMAX_MODEL_SUGGESTIONS, currentModelName);
        return;
    }

    replaceModelOptions([currentModelName], currentModelName);
}

function getModelFetchFailureMessage(apiBaseUrl: string, error: unknown): string {
    if (isMiniMaxApiBaseUrl(apiBaseUrl)) {
        return 'MiniMax 请使用 https://api.minimaxi.com/v1，并手动输入模型名；这个提供商通常不能直接通过 /v1/models 拉取模型列表。';
    }

    if (typeof error === 'object' && error !== null && 'status' in error) {
        const { status } = error as { status?: unknown };
        if (status === 404) {
            return '当前提供商没有暴露 /v1/models，请手动输入模型名。';
        }
    }

    return 'Failed to fetch models. Check API Key and Base URL.';
}

// --- Initialization ---
function initConfigUI() {
    apiKeyInput.value = config.apiKey;
    apiBaseUrlInput.value = sanitizeApiBaseUrlForDisplay(config.apiBaseUrl);

    syncProviderModelOptions();
    modelInput.value = config.model;

    systemMessageInput.value = config.systemMessage;
    temperatureInput.value = config.temperature.toString();
    maxTokensInput.value = config.maxResponseTokens.toString();
    tempDisplay.textContent = config.temperature.toString();
}

function initClient() {
    chatClient = new ChatClient({
        apiKey: config.apiKey,
        apiBaseUrl: resolveApiBaseUrl(config.apiBaseUrl),
        withContent: true,
        milliseconds: 60000,
        systemMessage: config.systemMessage,
        maxResponseTokens: config.maxResponseTokens,
        markdown2Html: config.markdown2Html,
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

function setMessageContent(target: HTMLElement, content: string, allowHtml = config.markdown2Html) {
    if (allowHtml) {
        target.innerHTML = content;
    } else {
        target.textContent = content;
    }
}

function createMessageElement(role: 'user' | 'assistant', content: string, allowHtml = false): HTMLElement {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'role-label';
    roleLabel.textContent = role === 'user' ? 'You' : 'Assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    setMessageContent(contentDiv, content, allowHtml);
    
    msgDiv.appendChild(roleLabel);
    msgDiv.appendChild(contentDiv);
    
    return msgDiv;
}

function appendMessage(role: 'user' | 'assistant', content: string, allowHtml = false): HTMLElement {
    const msgEl = createMessageElement(role, content, allowHtml);
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
async function fetchModels(showSuccessMessage = true) {
    const currentModelName = modelInput.value.trim() || config.model;
    const apiBaseUrl = apiBaseUrlInput.value;

    if (isMiniMaxApiBaseUrl(apiBaseUrl)) {
        replaceModelOptions(MINIMAX_MODEL_SUGGESTIONS, currentModelName);
        if (showSuccessMessage) {
            alert('MiniMax 需要手动填写模型名，已为你填入常用模型建议。');
        }
        return;
    }

    try {
        // Temporarily init client with current UI values to ensure key is correct
        const tempClient = new ChatClient({
            apiKey: apiKeyInput.value,
            apiBaseUrl: resolveApiBaseUrl(apiBaseUrl),
            withContent: true,
            milliseconds: 60000,
            requestParams: { model: 'gpt-5-mini' } // dummy
        });

        const res = await tempClient.getModels();
        if (res) {
            const data = await res.json();
            if (data && Array.isArray(data.data)) {
                const fetchedModelNames = data.data
                    .map((item) => item?.id)
                    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
                replaceModelOptions(fetchedModelNames, currentModelName);
                modelInput.value = currentModelName;

                if (showSuccessMessage) {
                    alert('Models refreshed!');
                }
                return;
            }
        }
    } catch (error) {
        replaceModelOptions([currentModelName], currentModelName);
        const failureMessage = getModelFetchFailureMessage(apiBaseUrl, error);
        if (failureMessage.includes('/v1/models')) {
            console.warn('Model listing is unavailable for this provider:', error);
        } else {
            console.error('Failed to fetch models:', error);
        }
        if (showSuccessMessage) {
            alert(failureMessage);
        }
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
    currentAssistantMessageDiv = appendMessage('assistant', 'Thinking...');

    try {
        const res = await chatClient.sendMessage(text, {
            parentMessageId,
            onProgress: (partialResponse) => {
                if (currentAssistantMessageDiv && partialResponse.content) {
                    setMessageContent(currentAssistantMessageDiv, partialResponse.content);
                    scrollToBottom();
                }
            },
        });
        parentMessageId = res.messageId;
        if (currentAssistantMessageDiv) {
            setMessageContent(currentAssistantMessageDiv, res.content || '');
        }
    } catch (error: any) {
        console.error(error);
        if (currentAssistantMessageDiv) {
            const isAborted = error.message && (error.message.includes('aborted') || error.name === 'AbortError');
            const currentContent = currentAssistantMessageDiv.textContent || '';

            if (isAborted) {
                if (currentContent && currentContent !== 'Thinking...') {
                    setMessageContent(currentAssistantMessageDiv, `${currentContent}\n(Request cancelled)`);
                } else {
                    setMessageContent(currentAssistantMessageDiv, 'Request cancelled.');
                }
            } else {
                setMessageContent(currentAssistantMessageDiv, `Error: ${error.message}`);
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
    config.apiBaseUrl = sanitizeApiBaseUrlForDisplay(apiBaseUrlInput.value);
    config.model = modelInput.value.trim() || config.model;
    config.systemMessage = systemMessageInput.value;
    config.temperature = parseFloat(temperatureInput.value);
    config.maxResponseTokens = parseInt(maxTokensInput.value);

    apiBaseUrlInput.value = config.apiBaseUrl;
    syncProviderModelOptions();
    initClient();
    settingsPanel.classList.remove('active');
    alert('Settings applied!');
});

refreshModelsBtn.addEventListener('click', () => {
    void fetchModels();
});

apiBaseUrlInput.addEventListener('change', () => {
    const sanitizedApiBaseUrl = sanitizeApiBaseUrlForDisplay(apiBaseUrlInput.value);
    if (sanitizedApiBaseUrl) {
        apiBaseUrlInput.value = sanitizedApiBaseUrl;
    }
    syncProviderModelOptions();
});

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
fetchModels(false);
