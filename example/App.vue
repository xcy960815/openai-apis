<template>
  <div class="gpt">
    <div id="answer-demo"></div>
    <button @click="cancelConversation">取消对话</button>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { GptModel, TextModle, ChatgptError } from '../src/index';

const apiKey = '';
const textModel = new TextModle({
  apiKey: apiKey,
  apiBaseUrl: 'abc',
  withContent: true,
  // systemMessage
  markdown2Html: true,
  requestParams: {
    // model:""，
  },
});

const gptModel = new GptModel({
  apiKey: apiKey,
  apiBaseUrl: 'abc',
  withContent: true,
  milliseconds: 10000,
  markdown2Html: true,
  requestParams: {
    model: 'gpt-3.5-turbo',
  },
});

gptModel.getModels();

const getAnswerByGptModel = async (parentMessageId?: string) => {
  const question = '有没有既可以在node环境和浏览器环境运行的fetch npm包？';
  const answer = await gptModel.getAnswer(question, {
    parentMessageId,
    onProgress: (partialResponse) => {
      const answerDome = document.getElementById('answer-demo') as HTMLDivElement;
      answerDome.innerHTML = partialResponse.content;
    },
  });
};

const getAnswerByTextModel = async (parentMessageId?: string) => {
  const question = '有没有既可以在node环境和浏览器环境运行的fetch npm包？';
  const answer = await textModel
    .getAnswer(question, {
      parentMessageId,
      onProgress: (partialResponse) => {
        const answerDome = document.getElementById('answer-demo') as HTMLDivElement;
        answerDome.innerHTML = partialResponse.content;
      },
    })
    .catch((error: ChatgptError) => {
      console.log(error);
    });
  console.log('answer', answer);
};

const cancelConversation = () => {
  // textModel.cancelConversation()
  gptModel.cancelConversation();
};

onMounted(() => {
  // getAnswerByTextModel()
  // getAnswerByGptModel()
});
</script>
<style lang="less" scoped>
.gpt {
  display: flex;
  align-items: center;
  flex-direction: column;

  .openai-demo {
    height: 100%;
    width: 100%;
    color: red;
  }
}
</style>
