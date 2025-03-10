<template>
  <b-jumbotron header-level="5">
    <template v-slot:lead>
      Final Reflection
      After selecting your position for all the statements, please take a moment to reflect on your response.
    </template>

    <div class="content-area">
      <!-- Reflection Section -->
      <div class="section">
        <p v-if="allResponsesSame" class="reflection-prompt">
          We notice that your agreement levels of all statements remained the same following the discussion.
          In the text box below, describe what specific aspects of the discussion influenced you to maintain your position.
          Please provide as much detail as you feel is necessary.
        </p>
        <p v-else-if="allResponsesChanged" class="reflection-prompt">
          We notice that your agreement levels of all statements changed following the discussion.
          In the text box below, describe what specific aspects of the discussion caused the change in your perspectives.
          Please provide as much detail as you feel is necessary.
        </p>
        <p v-else class="reflection-prompt">
          {{ generateChangeSummary() }}
          In the text box below, describe what specific aspects of the discussion caused the change in your perspectives on certain statements,
          and explain why your perspectives on other statements remained unchanged. Please provide as much detail as you feel is necessary.
        </p>

        <b-form-textarea
          v-model="reflection"
          rows="6"
          max-rows="8"
          placeholder="Enter your reflection here..."
          @input="onFormInteraction"
        />
      </div>

      <!-- Attention Check 1 -->
      <div class="section">
        <p><strong>Attention Check:</strong> What is 35 + 47?</p>
        <b-form-radio-group v-model="attentionCheck1" :options="attentionCheck1Options" stacked @change="onFormInteraction" />
      </div>

      <!-- Critical Thinking -->
      <div class="section">
        <h4>Critical Thinking Level</h4>
        <p>To what extent do you agree with the following statements regarding your experience?</p>
        <div v-for="(statement, index) in criticalThinkingStatements" :key="index" class="mb-3">
          <p>{{ statement }}</p>
          <b-form-radio-group
            v-model="criticalThinkingResponses[index]"
            :options="agreementScale"
            stacked
            required
            @change="onFormInteraction"
          />
        </div>
      </div>

      <!-- Attention Check 2 -->
      <div class="section">
        <p><strong>Attention Check:</strong> Please select 'Strongly Agree' for this statement.</p>
        <p>Statement: I have read the instructions carefully.</p>
        <b-form-radio-group v-model="attentionCheck2" :options="agreementScale" stacked @change="onFormInteraction" />
      </div>

      <!-- AI Tool Usage -->
      <div class="section">
        <p>We'd like to know if you have used a generative AI tool (e.g., ChatGPT, Gemini, Claude) to assist in writing your response for this study.
           Please let us know. You will be compensated regardless.</p>
        <b-form-radio-group v-model="usedAITool" :options="aiToolOptions" stacked @change="onFormInteraction" />
      </div>

      <!-- AI Interaction Quality (Conditional) -->
      <div v-if="hasAIParticipant || hasAIModerator" class="section">
        <div v-if="hasAIParticipant">
          <h4>Conversation Quality With the AI Participant</h4>
          <div v-for="(statement, index) in aiParticipantStatements" :key="index" class="mb-3">
            <p>{{ statement }}</p>
            <b-form-radio-group
              v-model="aiParticipantResponses[index]"
              :options="agreementScale"
              stacked
              required
              @change="onFormInteraction"
            />
          </div>
        </div>

        <div v-if="hasAIModerator">
          <h4>Conversation Quality With the AI Moderator</h4>
          <div v-for="(statement, index) in aiModeratorStatements" :key="index" class="mb-3">
            <p>{{ statement }}</p>
            <b-form-radio-group
              v-model="aiModeratorResponses[index]"
              :options="agreementScale"
              stacked
              required
              @change="onFormInteraction"
            />
          </div>
        </div>
      </div>

      <!-- Cost of Communication -->
      <div class="section">
        <h4>Cost of Communication Technologies</h4>
        <p>{{ generateCostPrompt() }}</p>
        <div v-for="(statement, index) in costStatements" :key="index" class="mb-3">
          <p>{{ statement }}</p>
          <b-form-radio-group
            v-model="costResponses[index]"
            :options="agreementScale"
            stacked
            required
            @change="onFormInteraction"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <div class="button-area mt-4">
        <b-button
          variant="primary"
          size="lg"
          @click="submitSurvey"
          :disabled="!isFormValid"
        >
          Submit Survey
        </b-button>
      </div>
    </div>
  </b-jumbotron>
</template>

<script>
import axios from 'axios'

export default {
  data () {
    return {
      preDiscussionResponses: this.$store.state.preDiscussionResponses,
      postDiscussionResponses: this.$store.state.postDiscussionResponses,
      reflection: '',
      attentionCheck1: null,
      attentionCheck2: null,
      criticalThinkingResponses: Array(6).fill(null),
      usedAITool: null,
      aiParticipantResponses: Array(3).fill(null),
      aiModeratorResponses: Array(3).fill(null),
      costResponses: Array(4).fill(null),
      selectedStatements: this.$store.state.masterStatements,
      role: '',

      // Options and statements
      attentionCheck1Options: [
        { text: '72', value: 72 },
        { text: '82', value: 82 },
        { text: '92', value: 92 },
        { text: '102', value: 102 }
      ],
      agreementScale: [
        { text: 'Strongly disagree', value: 1 },
        { text: 'Disagree', value: 2 },
        { text: 'Somewhat disagree', value: 3 },
        { text: 'Neutral', value: 4 },
        { text: 'Somewhat agree', value: 5 },
        { text: 'Agree', value: 6 },
        { text: 'Strongly agree', value: 7 }
      ],
      aiToolOptions: [
        { text: 'Yes, I have used a generative AI tool', value: 1 },
        { text: 'No, I have not used a generative AI tool', value: 2 }
      ],
      criticalThinkingStatements: [
        'The discussion earlier made me examine the values rooted in the information presented.',
        'The discussion earlier made me examine the interrelationships among concepts or opinions posed.',
        'I examined the logical reasoning of an objection made by others to the opinion I posed.',
        'After the discussion, I analyze my thinking before jumping to conclusions.',
        'The discussion helped me anticipate reasonable criticisms one might raise against my viewpoints.',
        'After the discussion, I examine my values, thoughts/beliefs based on reasons and evidence.'
      ],
      aiParticipantStatements: [
        'The AI participant understood what I was thinking and feeling.',
        'I feel connected to the AI participant.',
        'I trust the AI participant.'
      ],
      aiModeratorStatements: [
        'The AI moderator understood what I was thinking and feeling.',
        'I feel connected to the AI moderator.',
        'I trust the AI moderator.'
      ],
      costStatements: [
        'I feel MORE guilty if I don\'t respond to a message from others when interacting on the new platform.',
        'I feel SADDER when others don\'t pay enough attention to me when interacting on the new platform.',
        'I am MORE concerned about my privacy when using the new platform.',
        'I worry MORE about lacking companionship when using the new platform.'
      ]
    }
  },
  created () {
    this.role = Math.random() < 0.5 ? 'moderator' : 'participant'
  },
  computed: {
    hasAIParticipant () {
      return this.$store.state.participant_condition === 1 || this.$store.state.participant_condition === 2
    },
    hasAIModerator () {
      return this.$store.state.moderator_condition === 1
    },
    allResponsesSame () {
      // Compare pre and post responses
      return this.compareResponses() === 'same'
    },
    allResponsesChanged () {
      return this.compareResponses() === 'changed'
    },
    isFormValid () {
      const basicFieldsValid = this.reflection &&
        this.attentionCheck1 &&
        this.attentionCheck2 &&
        this.criticalThinkingResponses.every(r => r !== null) &&
        this.usedAITool &&
        this.costResponses.every(r => r !== null)

      if (!basicFieldsValid) return false

      // Check AI-specific responses if applicable
      if (this.hasAIParticipant && !this.aiParticipantResponses.every(r => r !== null)) {
        return false
      }
      if (this.hasAIModerator && !this.aiModeratorResponses.every(r => r !== null)) {
        return false
      }

      return true
    }
  },
  methods: {
    compareResponses () {
      // Compare pre and post discussion responses
      const postResponses = this.postDiscussionResponses || []
      const preResponses = this.preDiscussionResponses || []
      if (!postResponses.length || !preResponses.length || postResponses.length !== preResponses.length) {
        return 'invalid'
      }
      console.log('Post-discussion responses:', postResponses)
      console.log('Pre-discussion responses:', preResponses)
      let allSame = true
      let allChanged = true
      preResponses.forEach((pre, index) => {
        if (pre.agreement === postResponses[index].agreement) {
          allChanged = false
        } else {
          allSame = false
        }
      })
      if (allSame) return 'same'
      if (allChanged) return 'changed'
      return 'mixed'
    },
    generateChangeSummary () {
      // Generate summary of which statements changed/stayed same
      const changes = []
      this.preDiscussionResponses.forEach((pre, index) => {
        const post = this.postDiscussionResponses[index]
        if (pre.agreement !== post.agreement) {
          changes.push(this.selectedStatements[index])
        }
      })
      // If more than 3 changes, randomly select 3 and add "and extra" note
      if (changes.length > 3) {
        // Shuffle array and take first 3
        const shuffled = changes.sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, 3)
        return `We notice that your agreement level on the statement(s) '${selected.join(', ')}' and extra changed following the discussion, while your agreement levels on the other statements remained unchanged.`
      }
      return `We notice that your agreement level on the statement(s) '${changes.join(', ')}' changed following the discussion, while your agreement levels on the other statements remained unchanged.`
    },
    generateCostPrompt () {
      if (!this.hasAIParticipant && !this.hasAIModerator) {
        const description = this.role === 'moderator'
          ? 'The AI moderator can moderate and coordinate the group discussion.'
          : 'The AI participant can actively participate in the discussion and express its stance or opinions.'
        return `Imagine using a new platform designed to provide a discussion experience where there exists an AI ${this.role}. ${description}`
      } else {
        const roles = []
        if (this.hasAIModerator) roles.push('moderator')
        if (this.hasAIParticipant) roles.push('participant')
        return `Imagine using a new platform designed to facilitate discussions with the involvement of an AI ${roles.join(' and an AI ')}, similar to the previous discussion you just experienced.`
      }
    },
    async submitSurvey () {
      if (!this.isFormValid) {
        this.$bvToast.toast('Please complete all required fields.', {
          title: 'Form Incomplete',
          variant: 'warning'
        })
        return
      }

      try {
        const formData = new FormData()
        formData.append('subject_id', this.$store.state.subject_id)
        formData.append('reflection', this.reflection)
        formData.append('attention_check_1', this.attentionCheck1)
        formData.append('attention_check_2', this.attentionCheck2)
        formData.append('critical_thinking_responses', JSON.stringify(this.criticalThinkingResponses))
        formData.append('used_ai_tool', this.usedAITool)
        formData.append('ai_participant_responses', JSON.stringify(this.aiParticipantResponses))
        formData.append('ai_moderator_responses', JSON.stringify(this.aiModeratorResponses))
        formData.append('cost_responses', JSON.stringify(this.costResponses))
        const response = await axios.post(
          this.$root.server_url + 'post_df_survey',
          formData
        )
        console.log('Response:', response.data.success)
        console.log('Attention check 1:', this.attentionCheck1)
        console.log('Attention check 2:', this.attentionCheck2)
        let FailAttention = false
        if (this.attentionCheck1 !== 82 || this.attentionCheck2 !== 7) {
          FailAttention = true
        }
        if (FailAttention) {
          this.$router.push('/FailAttention')
          return
        }
        if (!FailAttention && response.data.success) {
          this.$router.push('/DeBriefing')
        }
      } catch (error) {
        console.error('Error submitting survey:', error)
        this.$bvToast.toast('An error occurred. Please try again.', {
          title: 'Error',
          variant: 'danger'
        })
      }
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
  mounted () {
    // this.$store.commit('startInactivityCheck')
    // window.addEventListener('show-inactivity-warning', this.showInactivityWarning)
    // window.addEventListener('remove-inactive-user', this.handleInactiveUser)
  },
  beforeDestroy () {
    window.removeEventListener('show-inactivity-warning', this.showInactivityWarning)
    window.removeEventListener('remove-inactive-user', this.handleInactiveUser)
    this.$store.commit('stopInactivityCheck')
  }
}
</script>

<style scoped>
.section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.reflection-prompt {
  font-style: italic;
  color: #495057;
  margin-bottom: 1rem;
}
</style>
