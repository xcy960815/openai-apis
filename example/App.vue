<template>
  <div class="gpt">
    <div id="answer-demo"></div>
    <button @click="cancelConversation">取消对话</button>
  </div>

</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { GptModel, /** TextModle */ ChatgptError } from '../src/index';

const apiKey = 'vio-2caf8a36-54ec-4fa1-869d-bf3cbca32952';

// const textModel = new TextModle({
//   apiKey: apiKey,
//   apiBaseUrl: "https://aigateway.***.net",
//   withContent: true,
//   // systemMessage
//   requestParams: {
//     // model:""，
//   }
// })

const gptModel = new GptModel({
  apiKey: apiKey,
  apiBaseUrl: "https://aigateway.vdian.net",
  withContent: true,
  milliseconds: 10000,
  markdown2Html:true,
  requestParams: {
    model: "gpt-3.5-turbo",
  }
});



const getAnswerByGptModel = async (parentMessageId?: string) => {
  const question = parentMessageId === undefined ? '有没有既可以在node环境和浏览器环境运行的fetch npm包？' : "给我写个巨好笑的笑话"
  const answer = await gptModel.sendMessage(question, {
    // messageId,
    // stream: false,
    parentMessageId,
    onProgress: (partialResponse) => {
      const answerDome = document.getElementById("answer-demo") as HTMLDivElement
      answerDome.innerHTML = partialResponse.content
    }
  })
    .catch((error: ChatgptError) => {
      console.log(error.message);
    });
};

/**
 * 
 */
// const getAnswerByTextModel = async (parentMessageId?: string) => {
//   const question = parentMessageId === undefined ? 'git 如何重置之前的提交记录和远程仓库地址？' : "给我写个笑话"
//   const answer = await textModel.sendMessage(question, {
//     // systemMessage,
//     parentMessageId,
//     stream: false,
//     onProgress: (partialResponse) => {
//       const answerDome = document.getElementById("answer-demo") as HTMLDivElement
//       answerDome.innerHTML = partialResponse.content
//       console.log("answerDome", answerDome.innerHTML);

//     },
//   })
//     .catch((error: ChatgptError) => {
//       console.log(error);
//     });
//   if (parentMessageId) return
//   getAnswerByTextModel(answer?.parentMessageId)


// };

const cancelConversation = () => {
  // textModel.cancelConversation()
  gptModel.cancelConversation()
}

onMounted(() => {
  // getAnswerByTextModel()
  getAnswerByGptModel()

})
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
