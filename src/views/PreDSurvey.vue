<template>
  <b-jumbotron header-level="5">
    <template v-slot:lead>
      Page 3: Pre-Discussion Questionnaires
      For each policy statement, you will be presented with two questions. Please respond to the statement below before proceeding to the next.
    </template>
    <div class="content-area">
      <div v-for="(statement, index) in selectedStatements" :key="index" class="policy-statement">
        <!-- Display the policy statement -->
        <p><strong>Statement {{ index + 1 }}:</strong> {{ statement }}</p>

        <!-- Question 1: Extent of agreement -->
        <p>To what extent do you agree with this statement?</p>
        <b-form-radio-group
          v-model="responses[index].agreement"
          :name="'agreement_' + index"
          :options="agreementScale"
          stacked
          @change="onFormInteraction"
        />

        <!-- Question 2: Personal importance -->
        <p>How personally important is this issue to you?</p>
        <b-form-radio-group
          v-model="responses[index].importance"
          :name="'importance_' + index"
          :options="importanceScale"
          stacked
          @change="onFormInteraction"
        />

        <!-- Submit and move to the next statement -->
        <div v-if="index < selectedStatements.length - 1" class="button-area">
          <b-button variant="primary" @click="moveToNext(index)">Submit and move to the next statement</b-button>
        </div>

        <!-- Final submit button -->
        <div v-else class="button-area">
          <b-button variant="success" @click="finalSubmit">Submit and complete</b-button>
        </div>
      </div>
    </div>
  </b-jumbotron>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    const initialResponses = this.$store.state.masterStatements.map(() => ({
      agreement: null,
      importance: null
    }))
    return {
      // selected statements = master statements NOW
      selectedStatements: this.$store.state.masterStatements,

      // Response data for each statement
      responses: initialResponses,

      // Agreement scale options
      agreementScale: [
        {text: 'Strongly disagree', value: -3},
        {text: 'Disagree', value: -2},
        {text: 'Somewhat disagree', value: -1},
        {text: 'Somewhat agree', value: 1},
        {text: 'Agree', value: 2},
        {text: 'Strongly agree', value: 3}
      ],

      // Importance scale options
      importanceScale: [
        {text: 'Not at all important to me', value: 1},
        {text: 'Slightly important to me', value: 2},
        {text: 'Somewhat important to me', value: 3},
        {text: 'Moderately important to me', value: 4},
        {text: 'Important to me', value: 5},
        {text: 'Very important to me', value: 6},
        {text: 'Extremely important to me', value: 7}
      ]
    }
  },
  methods: {
    // Initialize the selected statements and responses
    mounted () {
      // Initialize responses array with empty objects for each statement
      this.responses = this.selectedStatements.map(() => ({
        agreement: null,
        importance: null
      }))
      this.$store.commit('startInactivityCheck')
      window.addEventListener('show-inactivity-warning', this.showInactivityWarning)
      window.addEventListener('remove-inactive-user', this.handleInactiveUser)
    },

    // Move to the next statement (optional functionality)
    moveToNext (index) {
      if (!this.responses[index].agreement || !this.responses[index].importance) {
        alert('Please complete both questions before proceeding.')
        return
      }
      // Scroll to the next statement or focus
      const nextElement = document.querySelector(`[name='agreement_${index + 1}']`)
      if (nextElement) {
        nextElement.scrollIntoView({behavior: 'smooth'})
      }
    },

    // Final submit logic
    finalSubmit () {
      const incomplete = this.responses.some(
        (response) => !response.agreement || !response.importance
      )
      if (incomplete) {
        alert('Please complete all questions before submitting.')
        return
      }

      const body = new FormData()
      body.append('subject_id', this.$store.state.subject_id)
      body.append('responses', JSON.stringify(this.responses))
      // Store the responses in frontend for later comparison with post-discussion survey
      this.$store.commit('setPreDiscussionResponses', this.responses)
      // Submit the data to the server
      axios
        .post(this.$root.server_url + 'Update_pre_discussion_survey', body)
        .then((response) => {
          if (response.data.success) {
            this.$router.push('/DiscussionInstructions')
          } else {
            alert(response.data.message)
          }
        })
        .catch(() => {
          alert('An error occurred while submitting. Please try again.')
        })
    },

    // Track activity on form interactions
    onFormInteraction () {
      this.$store.dispatch('recordActivity')
    },
    showInactivityWarning () {
      this.$bvToast.toast('Warning: You appear to be inactive. Please continue with the survey within 15 seconds or you may be removed.', {
        title: 'Inactivity Warning',
        variant: 'warning',
        solid: true,
        autoHideDelay: 10000
      })
    },
    handleInactiveUser () {
      // Redirect to timeout page
      this.$router.push('/timeout')
    }
  },
  beforeDestroy () {
    window.removeEventListener('show-inactivity-warning', this.showInactivityWarning)
    window.removeEventListener('remove-inactive-user', this.handleInactiveUser)
    this.$store.commit('stopInactivityCheck')
  }
}
</script>

<style></style>
