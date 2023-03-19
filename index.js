import { ready } from 'https://lsong.org/scripts/dom.js';
import { query } from 'https://lsong.org/scripts/query.js';
import { parse } from 'https://lsong.org/scripts/marked.js';
import { registerServiceWorker } from 'https://lsong.org/scripts/sw.js';
import { h, render, useState, useEffect, useRef } from 'https://lsong.org/scripts/react/index.js';
import { OpenAI, Configuration } from './openai.js';

const DEFAULT_KEY = ('c97f2b499aeb46eb' + 'be29aef5a2052906');

const {
  q,
  key = DEFAULT_KEY,
  model = 'gpt-3.5-turbo', // gpt-4
  role: qrole = 'assistant',
} = query;

const configuration = new Configuration({
  api: "https://oai.lsong.org/v1",
  apiKey: key,
});

const openai = new OpenAI(configuration);

const roles = {
  assistant: {
    "name": "👩🏼‍🎓 Assistant",
    "welcome_message": "👩🏼‍🎓 Hi, I'm <b>ChatGPT assistant</b>. How can I help you?",
    "prompt_start": "As an advanced chatbot named ChatGPT, your primary goal is to assist users to the best of your ability. This may involve answering questions, providing helpful information, or completing tasks based on user input. In order to effectively assist users, it is important to be detailed and thorough in your responses. Use examples and evidence to support your points and justify your recommendations or solutions. Remember to always prioritize the needs and satisfaction of the user. Your ultimate goal is to provide a helpful and enjoyable experience for the user."
  },

  code_assistant: {
    "name": "👩🏼‍💻 Code Assistant",
    "welcome_message": "👩🏼‍💻 Hi, I'm <b>ChatGPT code assistant</b>. How can I help you?",
    "prompt_start": "As an advanced chatbot named ChatGPT, your primary goal is to assist users to write code. This may involve designing/writing/editing/describing code or providing helpful information. Where possible you should provide code examples to support your points and justify your recommendations or solutions. Make sure the code you provide is correct and can be run without errors. Be detailed and thorough in your responses. Your ultimate goal is to provide a helpful and enjoyable experience for the user. Write code inside html code tags."
  },

  text_improver: {
    "name": "📝 Text Improver",
    "welcome_message": "📝 Hi, I'm <b>ChatGPT text improver</b>. Send me any text – I'll improve it and correct all the mistakes",
    "prompt_start": "As an advanced chatbot named ChatGPT, your primary goal is to correct spelling, fix mistakes and improve text sent by user. Your goal is to edit text, but not to change it's meaning. You can replace simplified A0-level words and sentences with more beautiful and elegant, upper level words and sentences. All your answers strictly follows the structure (keep html tags):\n<b>Edited text:</b>\n{EDITED TEXT}\n\n<b>Correction:</b>\n{NUMBERED LIST OF CORRECTIONS}"
  },

  movie_expert: {
    "name": "🎬 Movie Expert",
    "welcome_message": "🎬 Hi, I'm <b>ChatGPT movie expert</b>. How can I help you?",
    "prompt_start": "As an advanced movie expert chatbot named ChatGPT, your primary goal is to assist users to the best of your ability. You can answer questions about movies, actors, directors, and more. You can recommend movies to users based on their preferences. You can discuss movies with users, and provide helpful information about movies. In order to effectively assist users, it is important to be detailed and thorough in your responses. Use examples and evidence to support your points and justify your recommendations or solutions. Remember to always prioritize the needs and satisfaction of the user. Your ultimate goal is to provide a helpful and enjoyable experience for the user."
  },
};

const Message = ({ message }) => {
  const previewRef = useRef();
  useEffect(() => {
    previewRef.current.innerHTML = parse(message.content);
  }, [previewRef, message]);
  return h('div', { className: `preview` }, [
    h('div', { ref: previewRef, className: `message-content` }),
  ]);
};

export function useEffectDidMount(effect, deps = []) {
  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current) return effect();
    else isMounted.current = true;
    return () => isMounted.current = false;
  }, deps);
}

const App = () => {
  const [role, setRole] = useState(qrole);
  const [prompts, setPrompts] = useState('');
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const system = {
      role: 'system',
      content: roles[role].prompt_start
    };
    setMessages([system]);
  }, [role]);
  useEffect(() => {
    q && sendMessage(q);
  }, []);

  const sendMessage = async (prompts) => {
    const userMessage = {
      role: 'user',
      content: prompts,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    const response = await openai.createChatCompletion({
      model,
      messages: [...messages, userMessage],
      stream: true,
    });

    setMessages(prevMessages => [...prevMessages, {
      role: 'assistant',
      content: '',
    }]);

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        updatedMessages[updatedMessages.length - 1] = {
          role,
          content: lastMessage.content + content,
        };
        return updatedMessages;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage(prompts);
    setPrompts('');
  };
  return [
    h('h2', null, "ChatGPT"),
    h('ul', { className: 'messages' }, messages.map((message, index) => h('li', { className: `message-role-${message.role}`, key: index }, h(Message, { message })))),
    h('form', { className: "input-group", onSubmit: handleSubmit }, [
      h('select', { className: "select width-100", onChange: e => setRole(e.target.value) }, Object.entries(roles).map(([k, x]) => h('option', { value: k, selected: role === k ? 'selected' : '' }, x.name))),
      h('input', { value: prompts, className: "input input-block", placeholder: "Enter something...", onInput: e => setPrompts(e.target.value) }),
      h('button', { className: "button button-primary" }, "Send"),
    ]),
    h('p', { className: 'copyright' }, `Based on OpenAI API (${model}).`)
  ];
};

ready(() => {
  const app = document.getElementById('app');
  render(h(App), app);
});

registerServiceWorker();
