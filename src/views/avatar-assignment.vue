<template>
  <b-container class="avatar-container">
    <b-row class="justify-content-center">
      <b-col md="12" class="text-center">
        <h2>Welcome to Your Discussion</h2>
      </b-col>
    </b-row>
    <template v-if="participantCondition === 3">
      <b-row class="main-content">
        <b-col md="8" class="left-column">
          <p>You have been assigned the following discussion identity:</p>

          <!-- Avatar Display -->
          <div class="avatar-display">
            <div v-if="assignedAvatar.animal && assignedAvatar.color">
              <v-animal :size="'80px'"
                        :name="assignedAvatar.animal || 'penguin'"
                        :color="assignedAvatar.color"
                        class="avatar-icon"/>
              <p class="mt-2">
                Your discussion name: <strong>{{ assignedAvatar.color }} {{ assignedAvatar.animal }}</strong>
              </p>
            </div>
            <div v-else>
              <p>Loading avatar information...</p>
              <b-spinner label="Loading..." class="mt-2"></b-spinner>
              <p class="mt-2">
                <small>Debug info: animal={{ assignedAvatar.animal }}, color={{ assignedAvatar.color }}</small>
              </p>
            </div>
          </div>

          <!-- Discussion Topic -->
          <div class="discussion-topic mt-4">
            <h5>Discussion Topic:</h5>
            <p class="statement-text">
              {{ chatStatement }}
            </p>
          </div>

          <!-- Your Agreement Level -->
          <div v-if="yourAgreementLevel !== null" class="agreement-level mt-3">
            <h5>Your Position:</h5>
            <div class="agreement-display">
              <p>Your agreement level: <strong>{{ agreementLevelText }}</strong></p>
              <div class="agreement-scale">
                <div class="scale-labels">
                  <span>Strongly disagree</span>
                  <span>Strongly agree</span>
                </div>
                <div class="scale-bar">
                  <div class="scale-marker" :style="{ left: agreementMarkerPosition + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Countdown Timer -->
          <div v-if="participantCondition === 3 && allConfirmed" class="countdown-section mt-4">
            <p class="countdown-text">
              Redirecting to the discussion room in <strong>{{ countdown }}</strong> seconds...
            </p>
            <b-spinner label="Loading..." class="mt-2"></b-spinner>
          </div>
        </b-col>
        <b-col md="4" class="right-column">
          <div v-if="participantCondition === 3 && isThirdPerson" class="third-person-instructions">
            <h5>Special Instructions for You</h5>
            <div v-if="random_third_person_prompt === 0" class="advocating-prompt mt-3">
              <h6>Advocating Role:</h6>
              <p>Your specific task is to advocate for the discussion topic. Try to:</p>
              <ul class="text-left">
                <li>Support the main arguments of the topic</li>
                <li>Provide additional evidence or examples</li>
                <li>Counter any opposing views constructively</li>
              </ul>
            </div>
            <div v-if="random_third_person_prompt === 1" class="disputing-prompt mt-3">
              <h6>Disputing Role:</h6>
              <p>Your specific task is to challenge the discussion topic. Try to:</p>
              <ul class="text-left">
                <li>Identify weaknesses in the main arguments</li>
                <li>Provide counter-examples or alternative perspectives</li>
                <li>Question assumptions underlying the topic</li>
              </ul>
            </div>
            <b-button
              variant="primary"
              class="mt-3"
              :disabled="!hasReadInstructions"
              @click="confirmInstructions"
            >
              I have read and understand these instructions
            </b-button>
          </div>
          <div v-if="participantCondition === 3 && !isThirdPerson && !allConfirmed" class="waiting-message">
            <p>We are finalizing the discussion environment...</p>
            <b-spinner label="Loading..." class="mt-2"></b-spinner>
          </div>
        </b-col>
      </b-row>
    </template>
    <template v-else>
      <b-row class="justify-content-center">
        <b-col md="8" class="single-column">
          <p>You have been assigned the following discussion identity:</p>

          <!-- Avatar Display -->
          <div class="avatar-display">
            <div v-if="assignedAvatar.animal && assignedAvatar.color">
              <v-animal :size="'80px'"
                        :name="assignedAvatar.animal || 'penguin'"
                        :color="assignedAvatar.color"
                        class="avatar-icon"/>
              <p class="mt-2">
                Your discussion name: <strong>{{ assignedAvatar.color }} {{ assignedAvatar.animal }}</strong>
              </p>
            </div>
            <div v-else>
              <p>Loading avatar information...</p>
              <b-spinner label="Loading..." class="mt-2"></b-spinner>
              <p class="mt-2">
                <small>Debug info: animal={{ assignedAvatar.animal }}, color={{ assignedAvatar.color }}</small>
              </p>
            </div>
          </div>

          <!-- Discussion Topic -->
          <div class="discussion-topic mt-4">
            <h5>Discussion Topic:</h5>
            <p class="statement-text">
              {{ chatStatement }}
            </p>
          </div>

          <!-- Your Agreement Level -->
          <div v-if="yourAgreementLevel !== null" class="agreement-level mt-3">
            <h5>Your Position:</h5>
            <div class="agreement-display">
              <p>Your agreement level: <strong>{{ agreementLevelText }}</strong></p>
              <div class="agreement-scale">
                <div class="scale-labels">
                  <span>Strongly disagree</span>
                  <span>Strongly agree</span>
                </div>
                <div class="scale-bar">
                  <div class="scale-marker" :style="{ left: agreementMarkerPosition + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Countdown Timer -->
          <div v-if="participantCondition === 3 && allConfirmed" class="countdown-section mt-4">
            <p class="countdown-text">
              Redirecting to the discussion room in <strong>{{ countdown }}</strong> seconds...
            </p>
            <b-spinner label="Loading..." class="mt-2"></b-spinner>
          </div>
        </b-col>
      </b-row>
    </template>
  </b-container>
</template>

<script>
import { mapState } from 'vuex'
import { colors } from '@/components/constants'
import axios from 'axios'

export default {
  data () {
    return {
      countdown: 5, // 5-second countdown before redirect
      hasReadInstructions: false,
      hasConfirmedInstructions: false,
      allConfirmed: false,
      checkConfirmationInterval: null,
      random_third_person_prompt: this.$store.state.random_third_person_prompt
    }
  },
  computed: {
    ...mapState({
      assignedAvatar: state => {
        return {
          color: state.avatar_color,
          animal: state.avatar_name
        }
      },
      chatStatement: state => {
        return state.chat_statement
      },
      isThirdPerson: state => {
        return state.is_third_person
      },
      participantCondition: state => {
        return state.participant_condition
      },
      preDiscussionResponses: state => state.preDiscussionResponses,
      chatStatementIndex: state => state.chat_statement_index
    }),
    yourAgreementLevel () {
      // Get the agreement level for the current chat statement
      if (this.preDiscussionResponses && this.preDiscussionResponses.length > 0 && this.chatStatementIndex !== null) {
        const response = this.preDiscussionResponses[this.chatStatementIndex]
        return response ? response.agreement : null
      }
      return null
    },
    agreementLevelText () {
      // Convert numerical agreement level to text
      const level = this.yourAgreementLevel
      if (level === null) return 'Not available'

      const agreementMap = {
        '-3': 'Strongly disagree',
        '-2': 'Disagree',
        '-1': 'Somewhat disagree',
        '1': 'Somewhat agree',
        '2': 'Agree',
        '3': 'Strongly agree'
      }

      return agreementMap[level.toString()] || 'Neutral'
    },
    agreementMarkerPosition () {
      // Convert agreement level (-3 to 3) to percentage position (0 to 100)
      const level = this.yourAgreementLevel
      if (level === null) return 50 // Center position if no data

      // Map from -3...3 to 0...100
      // Note: We skip 0 in the scale (as in the PreDSurvey)
      // So we need to map -3,-2,-1,1,2,3 to positions on the scale
      if (level < 0) {
        // Map -3,-2,-1 to 0,16.7,33.3
        return (level + 3) * 16.7
      } else {
        // Map 1,2,3 to 66.7,83.3,100
        return 50 + (level * 16.7)
      }
    }
  },
  methods: {
    avatarColorHex (colorName) {
      if (!colorName) {
        console.warn('No color name provided')
        return '#006CFE' // Default to blue
      }

      // If colorName is already a hex code, return it directly
      if (colorName.startsWith('#')) {
        return colorName
      }

      const colorLower = colorName.toLowerCase()
      const colorHex = colors[colorLower]

      if (!colorHex) {
        console.warn(`Color "${colorName}" not found in colors map, using default`)
        return colorName || '#006CFE' // Return the color name or default to blue
      }

      return colorHex
    },
    initWebSocket () {
      // Initialize WebSocket connection
      this.$store.dispatch('initWebSocket')
    },
    startCountdown () {
      const countdownInterval = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(countdownInterval)
          this.initWebSocket()
          this.$router.push('/ChatRoom')
        }
      }, 1000)
    },
    async confirmInstructions () {
      try {
        const formData = new FormData()
        formData.append('subject_id', this.$store.state.subject_id)
        formData.append('group_id', this.$store.state.group_id)
        const response = await axios.post(this.$root.server_url + 'confirm_instructions', formData)

        if (response.data.success) {
          this.hasConfirmedInstructions = true
          if (response.data.all_confirmed) {
            this.allConfirmed = true
            this.startCountdown()
          }
        }
      } catch (error) {
        console.error('Error confirming instructions:', error)
      }
    },
    async checkGroupConfirmation () {
      try {
        const formData = new FormData()
        formData.append('subject_id', this.$store.state.subject_id)
        formData.append('group_id', this.$store.state.group_id)
        const response = await axios.post(this.$root.server_url + 'confirm_instructions', formData)

        if (response.data.success && response.data.all_confirmed) {
          this.allConfirmed = true
          this.startCountdown()
          clearInterval(this.checkConfirmationInterval)
        }
      } catch (error) {
        console.error('Error checking group confirmation:', error)
      }
    }
  },
  mounted () {
    // Start 5-second timer to enable the confirmation button
    setTimeout(() => {
      this.hasReadInstructions = true
    }, 5000)
    // For non-third persons in 3-person groups, start checking for confirmation status
    if (this.participantCondition === 3 && !this.isThirdPerson) {
      this.checkConfirmationInterval = setInterval(this.checkGroupConfirmation, 2000)
    } else if (this.participantCondition !== 3) { // For groups that are not 3-person, start countdown immediately
      this.startCountdown()
    }
  },
  beforeDestroy () {
    if (this.checkConfirmationInterval) {
      clearInterval(this.checkConfirmationInterval)
    }
  }
}
</script>

<style scoped>
.avatar-container {
  text-align: center;
  padding: 40px;
}

.avatar-display {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.avatar-icon {
  margin: 10px 0;
  display: inline-block !important;
}

.avatar-icon svg {
  fill: inherit !important;
}

.avatar-icon svg path {
  fill: inherit !important;
}

.avatar-icon svg circle {
  fill: inherit !important;
}

.statement-text {
  font-size: 1.1em;
  font-weight: 500;
  color: #2c3e50;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  margin-top: 10px;
}

.countdown-text {
  font-size: 1.2em;
  font-weight: bold;
  color: #d9534f; /* Bootstrap danger color */
}

.main-content {
  margin-top: 20px;
}

.left-column {
  padding-right: 30px;
  border-right: 1px solid #eee;
}

.right-column {
  padding-left: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.third-person-instructions {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.third-person-instructions ul {
  text-align: left;
  margin: 0 auto;
  max-width: 500px;
}

.third-person-instructions li {
  margin-bottom: 10px;
}

.waiting-message {
  text-align: center;
}

/* New styles for agreement level display */
.agreement-level {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.agreement-display {
  margin: 10px 0;
}

.agreement-scale {
  width: 100%;
  max-width: 500px;
  margin: 15px auto;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.8em;
  color: #6c757d;
}

.scale-bar {
  position: relative;
  height: 10px;
  background: linear-gradient(to right, #dc3545, #e9ecef, #28a745);
  border-radius: 5px;
}

.scale-marker {
  position: absolute;
  top: -5px;
  width: 20px;
  height: 20px;
  background-color: #007bff;
  border-radius: 50%;
  transform: translateX(-50%);
}

.single-column {
  margin-top: 20px;
  text-align: center;
}
</style>
