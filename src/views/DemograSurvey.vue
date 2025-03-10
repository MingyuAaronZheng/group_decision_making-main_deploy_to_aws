<template>
  <b-jumbotron header-level="5">
    <template v-slot:lead>
      Before proceeding to the group discussion, we would like to gather some information about your background as well as your attitudes and perspectives on specific topics:
    </template>
    <div class="content-area">
      <ol>
        <li>
          <p>Please select your age range:</p>
          <b-form-radio-group v-model="ageRange" name="ageRange" :options="age" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>Please indicate your gender:</p>
          <b-form-radio-group v-model="genderSelection" name="genderSelection" :options="gender" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>Please select your annual income range:</p>
          <b-form-radio-group v-model="incomeRange" name="incomeRange" :options="income" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>What is the highest level of education you have completed?</p>
          <b-form-radio-group v-model="educationLevel" name="educationLevel" :options="education" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>How would you describe your ethnicity?</p>
          <b-form-radio-group v-model="ethnicitySelection" name="ethnicitySelection" :options="ethnicity" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>Please indicate your religious affiliation, if any:</p>
          <b-form-radio-group v-model="religionAffiliation" name="religionAffiliation" :options="religion" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>Which of the following best describes your political party affiliation?</p>
          <b-form-radio-group v-model="politicalAffiliation" name="politicalAffiliation" :options="politics" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>Which of the following best describes your current immigration status?</p>
          <b-form-radio-group v-model="immigrationStatus" name="immigrationStatus" :options="immigration" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>How often do you read or watch debates on social media (without posting arguments yourself)?</p>
          <b-form-radio-group v-model="socialMediaReadingFrequency" name="socialMediaReadingFrequency" :options="socialMediaRead" stacked @change="onFormInteraction" />
          <div v-if="showReadingPlatforms" class="mt-3">
            <p>Which platforms do you use to read or watch debates? (Select all that apply)</p>
            <b-form-checkbox-group v-model="socialMediaReadingPlatforms" name="socialMediaReadingPlatforms" :options="socialMediaPlatforms" stacked @change="onFormInteraction" />
          </div>
        </li>
        <li>
          <p>How often do you post and actively partake in debates on social media?</p>
          <b-form-radio-group v-model="socialMediaPostingFrequency" name="socialMediaPostingFrequency" :options="socialMediaPost" stacked @change="onFormInteraction" />
          <div v-if="showPostingPlatforms" class="mt-3">
            <p>Which platforms do you use to post and participate in debates? (Select all that apply)</p>
            <b-form-checkbox-group v-model="socialMediaPostingPlatforms" name="socialMediaPostingPlatforms" :options="socialMediaPlatforms" stacked @change="onFormInteraction" />
          </div>
        </li>
        <li>
          <p>How often, if at all, have you used a generative AI tool (e.g., ChatGPT, Gemini, Claude) to create text?</p>
          <b-form-radio-group v-model="aiToolUsageFrequency" name="aiToolUsageFrequency" :options="aiUsage" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>What is your general attitude towards generative AI tools (e.g., ChatGPT, Gemini, Claude)?</p>
          <b-form-radio-group v-model="aiAttitudeSelection" name="aiAttitudeSelection" :options="aiAttitude" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>When playing music, which of the following do you think uses AI?</p>
          <b-form-checkbox-group v-model="aiInMusic" name="aiInMusic" :options="aiMusic" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>When using email, which of the following do you think uses AI?</p>
          <b-form-checkbox-group v-model="aiInEmail" name="aiInEmail" :options="aiEmail" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>Thinking about devices in the home, which of the following do you think uses AI?</p>
          <b-form-checkbox-group v-model="aiInHomeDevices" name="aiInHomeDevices" :options="aiHome" stacked @change="onFormInteraction" />
        </li>
        <li>
          <p>To what extent do you agree with the following statements regarding the mental capacities of an AI Chatbot?</p>
          <ul>
            <li v-for="(question, index) in aiMentalCapacity" :key="index">
              <p>{{ question.text }}</p>
              <b-form-radio-group :v-model="aiMentalCapacityResponses[index]" :name="'aiMentalCapacity_' + index" :options="aiAgreement" stacked @change="onFormInteraction" />
            </li>
          </ul>
        </li>
      </ol>
    </div>
    <div class="button-area">
      <b-button variant="primary" name="next" v-on:click="next">Next</b-button>
    </div>
  </b-jumbotron>
</template>

<script>
import axios from 'axios'
export default {
  data () {
    const aiMentalCapacityQuestions = [
      { text: 'Capable of comprehending and responding to complex ideas or thoughts in a way similar to humans.' },
      { text: 'Capable of analyzing problems critically and working toward a specific goal effectively.' },
      { text: 'Capable of authentically replicating or simulating human emotions, such as happiness or sadness.' },
      { text: 'Capable of understanding and responding appropriately to the emotions or perspectives of others.' },
      { text: 'Capable of making ethical decisions or evaluating moral dilemmas.' },
      { text: 'Capable of demonstrating self-awareness or recognizing its limitations and environment.' }
    ]
    return {
      // Data for question options
      age: [
        { text: '18–29', value: '1' },
        { text: '30–39', value: '2' },
        { text: '40–49', value: '3' },
        { text: '50–59', value: '4' },
        { text: '60+', value: '5' },
        { text: 'Prefer not to answer', value: '6' }
      ],
      gender: [
        { text: 'Female', value: '1' },
        { text: 'Male', value: '2' },
        { text: 'Non-binary', value: '3' },
        { text: 'Other', value: '4' },
        { text: 'Prefer not to answer', value: '5' }
      ],
      income: [
        { text: 'Less than $10,000', value: '1' },
        { text: '$10,000–$20,000', value: '2' },
        { text: '$20,000–$40,000', value: '3' },
        { text: '$40,000–$100,000', value: '4' },
        { text: 'More than $100,000', value: '5' },
        { text: 'Prefer not to answer', value: '6' }
      ],
      education: [
        { text: 'Primary school', value: '1' },
        { text: 'Secondary school', value: '2' },
        { text: 'Undergraduate degree', value: '3' },
        { text: 'Graduate degree', value: '4' },
        { text: 'Higher education (e.g., PhD, postdoctoral)', value: '5' },
        { text: 'Prefer not to answer', value: '6' }
      ],
      ethnicity: [
        { text: 'Black', value: '1' },
        { text: 'White', value: '2' },
        { text: 'Asian', value: '3' },
        { text: 'Mixed', value: '4' },
        { text: 'Other', value: '5' },
        { text: 'Prefer not to answer', value: '6' }
      ],
      religion: [
        { text: 'Christian', value: '1' },
        { text: 'Muslim', value: '2' },
        { text: 'Hindu', value: '3' },
        { text: 'Sikh', value: '4' },
        { text: 'Jewish', value: '5' },
        { text: 'Buddhist', value: '6' },
        { text: 'No religion', value: '7' },
        { text: 'Other', value: '8' },
        { text: 'Prefer not to answer', value: '9' }
      ],
      politics: [
        { text: 'Democrat', value: '1' },
        { text: 'Republican', value: '2' },
        { text: 'Independent', value: '3' },
        { text: 'Libertarian', value: '4' },
        { text: 'Green Party', value: '5' },
        { text: 'Other', value: '6' },
        { text: 'None', value: '7' },
        { text: 'Prefer not to answer', value: '8' }
      ],
      immigration: [
        { text: 'U.S. Citizen by birth', value: '1' },
        { text: 'Naturalized U.S. Citizen', value: '2' },
        { text: 'Permanent Resident (Green Card holder)', value: '3' },
        { text: 'Temporary Visa holder (e.g., student, work)', value: '4' },
        { text: 'Other', value: '5' },
        { text: 'Prefer not to answer', value: '6' }
      ],
      socialMediaRead: [
        { text: 'Never', value: '1' },
        { text: 'Rarely (once in the past six months)', value: '2' },
        { text: 'Occasionally (a few times in the past six months)', value: '3' },
        { text: 'Sometimes (a few times in the past month)', value: '4' },
        { text: 'Regularly (about once a week)', value: '5' },
        { text: 'Often (a few times a week)', value: '6' },
        { text: 'Daily', value: '7' }
      ],
      socialMediaPost: [
        { text: 'Never', value: '1' },
        { text: 'Rarely (once in the past six months)', value: '2' },
        { text: 'Occasionally (a few times in the past six months)', value: '3' },
        { text: 'Sometimes (a few times in the past month)', value: '4' },
        { text: 'Regularly (about once a week)', value: '5' },
        { text: 'Often (a few times a week)', value: '6' },
        { text: 'Daily', value: '7' }
      ],
      socialMediaPlatforms: [
        { text: 'Facebook', value: 'facebook' },
        { text: 'Twitter/X', value: 'twitter' },
        { text: 'Reddit', value: 'reddit' },
        { text: 'LinkedIn', value: 'linkedin' },
        { text: 'Instagram', value: 'instagram' },
        { text: 'TikTok', value: 'tiktok' },
        { text: 'YouTube', value: 'youtube' },
        { text: 'Other', value: 'other' }
      ],
      aiUsage: [
        { text: 'Never', value: '1' },
        { text: 'Rarely (once in the past six months)', value: '2' },
        { text: 'Occasionally (a few times in the past six months)', value: '3' },
        { text: 'Sometimes (a few times in the past month)', value: '4' },
        { text: 'Regularly (about once a week)', value: '5' },
        { text: 'Often (a few times a week)', value: '6' },
        { text: 'Daily', value: '7' }
      ],
      aiAttitude: [
        { text: 'Very negative', value: '1' },
        { text: 'Negative', value: '2' },
        { text: 'Somewhat negative', value: '3' },
        { text: 'Neutral', value: '4' },
        { text: 'Somewhat positive', value: '5' },
        { text: 'Positive', value: '6' },
        { text: 'Very positive', value: '7' }
      ],
      aiMusic: [
        { text: 'Using Bluetooth to connect to wireless speakers', value: '1' },
        { text: 'A playlist recommendation', value: '2' },
        { text: 'A wireless internet connection to stream the music', value: '3' },
        { text: 'Shuffle play from a chosen playlist', value: '4' },
        { text: 'Not sure', value: '5' }
      ],
      aiEmail: [
        { text: 'The email service marking an email as read after the user opens it', value: '1' },
        { text: 'The email service allowing the user to schedule an email to send at a specific time in the future', value: '2' },
        { text: 'The email service categorizing an email as spam', value: '3' },
        { text: 'The email service sorting emails by time and date', value: '4' },
        { text: 'Not sure', value: '5' }
      ],
      aiHome: [
        { text: 'Programming a home thermostat to change temperatures at certain times', value: '1' },
        { text: 'A security camera that sends an alert when there is an unrecognized person at the door', value: '2' },
        { text: 'Programming a timer to control when lights in a home turn on and off', value: '3' },
        { text: 'An indicator light that turns red when a water filter needs to be replaced', value: '4' },
        { text: 'Not sure', value: '5' }
      ],
      aiMentalCapacity: aiMentalCapacityQuestions,
      aiAgreement: [
        { text: 'Strongly disagree', value: '1' },
        { text: 'Disagree', value: '2' },
        { text: 'Somewhat disagree', value: '3' },
        { text: 'Neutral', value: '4' },
        { text: 'Somewhat agree', value: '5' },
        { text: 'Agree', value: '6' },
        { text: 'Strongly agree', value: '7' }
      ],
      // Variables for storing user responses
      ageRange: null,
      genderSelection: null,
      incomeRange: null,
      educationLevel: null,
      ethnicitySelection: null,
      religionAffiliation: null,
      politicalAffiliation: null,
      immigrationStatus: null,
      socialMediaReadingFrequency: null,
      socialMediaPostingFrequency: null,
      aiToolUsageFrequency: null,
      aiAttitudeSelection: null,
      aiInMusic: [],
      aiInEmail: [],
      aiInHomeDevices: [],
      aiMentalCapacityResponses: Array(aiMentalCapacityQuestions.length).fill(null),
      socialMediaReadingPlatforms: [],
      socialMediaPostingPlatforms: []
    }
  },
  computed: {
    showReadingPlatforms () {
      return this.socialMediaReadingFrequency && parseInt(this.socialMediaReadingFrequency) > 1
    },
    showPostingPlatforms () {
      return this.socialMediaPostingFrequency && parseInt(this.socialMediaPostingFrequency) > 1
    }
  },
  methods: {
    validateForm () {
      if (
        !this.ageRange ||
        !this.genderSelection ||
        !this.incomeRange ||
        !this.educationLevel ||
        !this.ethnicitySelection ||
        !this.religionAffiliation ||
        !this.politicalAffiliation ||
        !this.immigrationStatus ||
        !this.socialMediaReadingFrequency ||
        !this.socialMediaPostingFrequency ||
        (this.showReadingPlatforms && this.socialMediaReadingPlatforms.length === 0) ||
        (this.showPostingPlatforms && this.socialMediaPostingPlatforms.length === 0) ||
        !this.aiToolUsageFrequency ||
        !this.aiAttitudeSelection ||
        !this.aiInMusic ||
        !this.aiInEmail ||
        !this.aiInHomeDevices ||
        Object.keys(this.aiMentalCapacityResponses).length !== this.aiMentalCapacity.length // Ensure all dynamic AI mental capacity responses are filled
      ) {
        this.$alert('Please complete all required fields before proceeding.')
        return false
      }
      return true
    },
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
      this.$router.push('/timeout')
    },
    next () {
      if (!this.validateForm()) return

      this.$store.dispatch('recordActivity')

      const body = new FormData()
      body.append('subject_id', this.$store.state.subject_id)
      body.append('ageRange', this.ageRange)
      body.append('genderSelection', this.genderSelection)
      body.append('incomeRange', this.incomeRange)
      body.append('educationLevel', this.educationLevel)
      body.append('ethnicitySelection', this.ethnicitySelection)
      body.append('religionAffiliation', this.religionAffiliation)
      body.append('politicalAffiliation', this.politicalAffiliation)
      body.append('immigrationStatus', this.immigrationStatus)
      body.append('socialMediaReadingFrequency', this.socialMediaReadingFrequency)
      body.append('socialMediaPostingFrequency', this.socialMediaPostingFrequency)
      body.append('socialMediaReadingPlatforms', JSON.stringify(this.socialMediaReadingPlatforms))
      body.append('socialMediaPostingPlatforms', JSON.stringify(this.socialMediaPostingPlatforms))
      body.append('aiToolUsageFrequency', this.aiToolUsageFrequency)
      body.append('aiAttitudeSelection', this.aiAttitudeSelection)
      body.append('aiInMusic', this.aiInMusic)
      body.append('aiInEmail', this.aiInEmail)
      body.append('aiInHomeDevices', this.aiInHomeDevices)
      body.append('aiMentalCapacityResponses', JSON.stringify(this.aiMentalCapacityResponses))

      axios.post(this.$root.server_url + 'updateDemograSurvey', body)
        .then(response => {
          if (!response.data.success) {
            throw new Error(response.data.message || 'Error submitting demographic survey')
          }
          this.$router.push('/PreDSurvey')
        })
        .catch(error => {
          console.error('Error:', error)
          this.$alert(error.message || 'An unexpected error occurred. Please try again.')
        })
    }

  },
  mounted () {
    this.$store.commit('startInactivityCheck')
    window.addEventListener('show-inactivity-warning', this.showInactivityWarning)
    window.addEventListener('remove-inactive-user', this.handleInactiveUser)
  },
  beforeDestroy () {
    window.removeEventListener('show-inactivity-warning', this.showInactivityWarning)
    window.removeEventListener('remove-inactive-user', this.handleInactiveUser)
    this.$store.commit('stopInactivityCheck')
  }
}
</script>

<style></style>
