<template>
  <b-jumbotron header-level="5">
    <template v-slot:header>
      Instruction
    </template>

    <div class="content-area">
      <h5>What to Expect</h5>
      <p>
        By using our chat platform, you will participate in a turn-based discussion about a policy that you previously answered in the questionnaire.
        Your randomly paired discussion partner may or may not share the same attitude as you regarding this policy.
        For anonymity, your name in the discussion will be randomly generated as an animal name.
      </p>
      <p>
        <b>AI Chatbot:</b> During the discussion, you may encounter AI chatbot(s) with different roles, such as participating or moderating the discussion.
        The AI chatbot's roles will be indicated by their names.
      </p>

      <h5>Discussion Rules</h5>
      <ul>
        <li><b>Explain Your Position:</b> Begin by briefly explaining your stance on the policy.</li>
        <li><b>Message Length:</b> Each message must contain at least 10 meaningful words. Filler words (like "um", "well", "like", "you know") don't count toward this minimum.</li>
        <li><b>Take Turns to Speak:</b> If you see "<i>[Participant Name, e.g., pink tiger] is typing</i>" on the interface, the corresponding participant is likely trying to enter something on their interface. Wait a bit until the indicator disappears before responding.</li>
        <li><b>Duration:</b> After taking four discussion turns, you may continue or proceed to the exit survey.</li>
        <li><b>Exit Options:</b> You may leave anytime without penalty.</li>
        <li><b>No Copy-Pasting:</b> Copy-pasting is disabled on the chat interface to ensure that everyone expresses their original opinions.</li>
      </ul>
    </div>

    <div class="button-area">
      <b-button variant="primary" name="next" @click="goToWaitingRoom">Next</b-button>
    </div>
  </b-jumbotron>
</template>

<script>
export default {
  methods: {
    goToWaitingRoom () {
      this.$router.push('/waitingRoom')
    }
  }
}
</script>

<style scoped>
.content-area {
  margin-bottom: 20px;
}
</style>
