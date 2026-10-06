const PUTER_ENDPOINT = 'https://api.puter.com/drivers/call';
const DEFAULT_TOKEN = process.env.PUTER_AI_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InYyIn0.eyJ0IjoidCIsInYiOiIyIiwidG9rZW5fdWlkIjoiMTdmYWY2M2ItYTdkZC00MTNiLTk2Y2UtNDViMWU3NDY4MjVjIiwidXUiOiJFTTVYRk9xN1M3ZVZWYWx2aFIxN05BPT0iLCJzdSI6IkxRSXgxRVpZUkJHcnUwTEVyYjlmTmc9PSIsImFpIjoiRU01WEZPcTdTN2VWVmFsdmhSMTdOQT09IiwiZnVsbF9hY2Nlc3MiOnRydWUsImlhdCI6MTc4ODA2MzAxOX0.KHJ-hl6PDLKzara41VQI5KVl6Z5am3Pfz7DeXuaOh-k';

/**
 * Call Puter AI for conversational and analytical completions
 * @param {Array<{role: string, content: string}>} messages 
 * @returns {Promise<string>}
 */
async function callPuterChat(messages) {
  try {
    const response = await fetch(PUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEFAULT_TOKEN}`
      },
      body: JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'claude-3-5-sonnet',
        test_mode: false,
        method: 'complete',
        args: {
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          model: 'claude-3-5-sonnet'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Puter HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.result?.message?.content) {
      return data.result.message.content;
    }
    if (data.result?.text) {
      return data.result.text;
    }
    if (typeof data.result === 'string') {
      return data.result;
    }
    return '';
  } catch (err) {
    console.error('callPuterChat error, using fallback:', err.message);
    return '';
  }
}

module.exports = {
  callPuterChat
};
