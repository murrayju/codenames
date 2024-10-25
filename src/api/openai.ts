import config from '@murrayju/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: config.get('openai.apiKey'),
});

export interface ClueSuggestionArgs {
  assassinWord: string;
  bystanderWords: string[];
  opponentWords: string[];
  words: string[];
}

export interface ClueSuggestion {
  message: string;
}

export const getClueSuggestion = async ({
  assassinWord,
  bystanderWords,
  opponentWords,
  words,
}: ClueSuggestionArgs): Promise<ClueSuggestion> => {
  const completion = await openai.chat.completions.create({
    messages: [
      { content: config.get('openai.systemPrompt'), role: 'system' },
      {
        content: `
Game Board State:
Your Teams's Words: ${words.join(', ')}
Opponent's Words: ${opponentWords.join(', ')}
Bystander Words: ${bystanderWords.join(', ')}
Assassin Word: ${assassinWord}

${config.get('openai.postStatePrompt')}
        `,
        role: 'user',
      },
    ],
    model: config.get('openai.model'),
    temperature: config.get('openai.temperature'),
  });
  const message = completion.choices[0]?.message?.content || '';
  console.info('LLM response:', message);
  return {
    message,
  };
};
