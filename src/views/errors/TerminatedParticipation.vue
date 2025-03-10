<template>
  <b-jumbotron header-level="5">
    <template v-slot:lead>
      Study Terminated
    </template>
    <div class="content-area">
      <div class="alert alert-danger">
        <h4>Your participation has been terminated</h4>
        <p>
          You have chosen to leave the study before completion. As mentioned in the consent form,
          we can only compensate participants who complete the entire study.
        </p>
        <p>
          If you believe this is an error, please contact the study administrators with your
          participant ID: {{ $store.state.subject_id }}
        </p>
      </div>
    </div>
  </b-jumbotron>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TerminatedParticipation',
  created () {
    // Optionally notify server about termination
    if (this.$store.state.subject_id) {
      axios.post(this.$root.server_url + 'terminate_participation', {
        subject_id: this.$store.state.subject_id
      }).catch(error => {
        console.error('Error notifying termination:', error)
      })
    }
  }
}
</script>

<style scoped>
.content-area {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}
.alert {
  text-align: left;
}
</style>
