<template>
  <b-jumbotron header-level="5">
    <template v-slot:header>
      Pairing You with Other Participants
    </template>

    <div class="content-area">
      <p>
        We are pairing you with other participants to start the discussion task.
        <span class="highlight">Please turn on audio on your device.</span>
        Once all of the group members arrive, we will notify you with a sound and redirect you to the next page.
      </p>
      <p>
        If no other group member is paired in 5 minutes, we will redirect you back to Prolific.
      </p>
      <p>
        We will bonus you <b>15 cents per minute</b> for your waiting time.<br>
        The average waiting time is <b>{{ average_waiting_time }}</b> seconds.
      </p>

      <CountdownTimer :remain_time="remainingTime" /> <!-- ⏳ Countdown Timer -->
    </div>

    <div class="pairing-info">
      <p v-if="isPairing"><b>Finding a suitable group...</b></p>
      <p v-else-if="pairingFailed" class="text-danger"><b>Pairing failed. Redirecting...</b></p>
      <p v-else-if="!has_capacity" class="text-success"><b>Pairing successful! Redirecting...</b></p>
    </div>

    <b-spinner v-if="isPairing" label="Loading..."></b-spinner>

    <b-alert v-if="pairingFailed" variant="danger" dismissible>
      We couldn't find a suitable group. You will be redirected shortly.
    </b-alert>

    <div v-if="!isPairing && !isTimedOut" class="text-center mt-4">
      <b-button variant="primary" @click="startPairing">
        Find Discussion Partners
      </b-button>

      <!-- Test button for debugging -->
      <b-button variant="outline-secondary" class="ml-2" @click="testSetAvatar">
        Test Avatar Assignment
      </b-button>
    </div>
  </b-jumbotron>
</template>

<script>
import axios from 'axios'
import CountdownTimer from '@/components/CountdownTimer.vue'

export default {
  components: {
    CountdownTimer
  },
  data () {
    return {
      isPairing: true,
      pairingFailed: false,
      pollInterval: null,
      timeout: null,
      remainingTime: 300, // 5 minutes countdown
      average_waiting_time: 10,
      has_capacity: false
    }
  },
  methods: {
    startPairing () {
      this.startCountdown()
      this.setReadyToPair()
      this.checkPairingStatus()
      this.pollInterval = setInterval(this.checkPairingStatus, 5000) // Poll every 5s
      this.timeout = setTimeout(this.failPairing, 300000) // Redirect after 5 minutes
    },
    updateAverageWaitingTime (averageWaitingTime) {
      this.average_waiting_time = averageWaitingTime
    },
    checkPairingStatus () {
      const subjectId = this.$store.state.subject_id
      if (!subjectId || subjectId === -1) {
        console.error('No subject ID found')
        this.failPairing()
        return
      }
      let body = new FormData()
      body.append('subject_id', subjectId)
      axios.post(this.$root.server_url + 'pairing', body)
        .then(response => {
          console.log('Pairing response:', response.data)
          this.updateAverageWaitingTime(response.data.average_waiting_time)
          // console.log('Pairing response:', response.data)
          if (response.data.success) {
          // Update the store with the response data regardless of has_capacity
            this.updateStore(response.data)
            // If the group is full OR the user is already assigned to a group, redirect
            if (!response.data.has_capacity && response.data.group_id) {
              this.completePairing()
            }
          }
        })
        .catch(error => {
          console.error('Error during pairing:', error)
          if (this.$root.test_mode) {
          // For testing, simulate a successful pairing after 5 seconds
            setTimeout(() => {
              this.updateStore({
                group_id: 1,
                participant_condition: 1,
                moderator_condition: 1,
                chat_statement_indx: 0,
                is_third_person: false,
                assigned_avatars: [{
                  subject_id: this.$store.state.subject_id,
                  color: 'blue',
                  name: 'tiger'
                }]
              })
              this.completePairing()
            }, 5000)
          } else {
            this.failPairing()
          }
        })
    },

    updateStore (data) {
      this.$store.commit('assign_group_id', { group_id: data.group_id })
      // console.log('Updated group_id:', this.$store.state.group_id)
      this.$store.commit('assign_participant_condition', data.participant_condition)
      // console.log('Updated participant_condition:', this.$store.state.participant_condition)
      this.$store.commit('assign_moderator_condition', data.moderator_condition)
      // console.log('Updated moderator_condition:', this.$store.state.moderator_condition)
      this.$store.commit('assign_group_chat_statement', data.chat_statement_indx)
      // console.log('Updated group_chat_statement:', this.$store.state.chat_statement)
      this.$store.commit('assign_group_chat_statement_indx', data.chat_statement_indx)
      // console.log('Updated group_chat_statement_indx:', this.$store.state.chat_statement_index)
      // Only if is_third_person is true, update is_third_person in store
      // This is important because requests other than for the third person also has is_third_person attribute, but it is false
      // This if statement is to prevent the store from being updated if is_third_person is false
      if (data.is_third_person) {
        this.$store.commit('assign_is_third_person', data.is_third_person)
        this.$store.commit('assign_random_third_person_prompt', data.random_third_person_prompt)
      }
      // Update avatar if assigned
      if (data.assigned_avatars && data.assigned_avatars.length > 0) {
        const subjectId = this.$store.state.subject_id
        // console.log('Checking for avatar with subject ID:', subjectId)
        // console.log('Available avatars:', JSON.stringify(data.assigned_avatars))

        const myAvatar = data.assigned_avatars.find(avatar => avatar.subject_id === subjectId)
        if (myAvatar) {
        // Check for both possible avatar property formats
          // console.log('Found my avatar:', JSON.stringify(myAvatar))
          const avatarColor = myAvatar.avatar_color || myAvatar.color
          const avatarName = myAvatar.avatar_name || myAvatar.name
          // console.log('Extracted avatar details:', avatarName, avatarColor)

          this.$store.commit('update_avatar', {
            avatar_color: avatarColor,
            avatar_name: avatarName
          })
          // console.log('Updated avatar in store:', this.$store.state.avatar_name, this.$store.state.avatar_color)
        } else {
          // console.log('No matching avatar found for subject ID:', subjectId)
        }
      } else {
        // console.log('No assigned_avatars in data or empty array')
      }
    },

    completePairing () {
      this.isPairing = false
      clearInterval(this.pollInterval)
      clearTimeout(this.timeout)
      this.setNotReadyToPair()
      // Redirect to ChatRoom
      this.$router.push('/avatar-assignment')
    },

    failPairing () {
      clearInterval(this.pollInterval)
      clearTimeout(this.timeout)
      this.isPairing = false
      this.pairingFailed = true
      this.setNotReadyToPair()
      this.$root.alarm_sound.play() // 🔊 Play failure sound
      setTimeout(() => {
        this.$router.push('/FailPairing') // ❌ Redirect to fail page
      }, 3000)
    },

    startCountdown () {
      const countdownInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--
        } else {
          clearInterval(countdownInterval)
        }
      }, 1000) // Decrease timer every second
    },

    setReadyToPair () {
      const subjectId = this.$store.state.subject_id
      if (!subjectId || subjectId === -1) {
        console.error('No subject ID found for setting ready_to_pair')
        return
      }
      let body = new FormData()
      body.append('subject_id', subjectId)
      axios.post(this.$root.server_url + 'set_ready_to_pair', body)
        .then(response => {
          // console.log('Set ready to pair response:', response.data)
        })
        .catch(error => {
          console.error('Error setting ready to pair:', error)
        })
    },

    setNotReadyToPair () {
      const subjectId = this.$store.state.subject_id
      if (!subjectId || subjectId === -1) {
        console.error('No subject ID found for setting not ready_to_pair')
        return
      }
      let body = new FormData()
      body.append('subject_id', subjectId)
      axios.post(this.$root.server_url + 'set_not_ready_to_pair', body)
        .then(response => {
          console.log('Set not ready to pair response:', response.data)
        })
        .catch(error => {
          console.error('Error setting not ready to pair:', error)
        })
    },

    testSetAvatar () {
      console.log('Setting test avatar data')
      this.$store.commit('update_avatar', {
        avatar_color: 'blue',
        avatar_name: 'penguin'
      })
      console.log('Test avatar set:', this.$store.state.avatar_name, this.$store.state.avatar_color)

      // Navigate to avatar assignment page
      this.$router.push('/avatar-assignment')
    }
  },

  mounted () {
  // Initialize test mode if needed
    this.startPairing()
    // Add event listeners to detect when user leaves the page
    window.addEventListener('beforeunload', this.setNotReadyToPair)
    window.addEventListener('pagehide', this.setNotReadyToPair)
  },

  beforeDestroy () {
    clearInterval(this.pollInterval)
    clearTimeout(this.timeout)
    this.setNotReadyToPair()
    // Remove event listeners
    window.removeEventListener('beforeunload', this.setNotReadyToPair)
    window.removeEventListener('pagehide', this.setNotReadyToPair)
  }
}
</script>

<style scoped>
.content-area {
  font-size: 1rem;
  line-height: 1.5;
}

.highlight {
  color: red;
  font-weight: bold;
}

.pairing-info {
  margin-top: 20px;
}

.text-danger {
  color: red;
}

.text-success {
  color: green;
}
</style>
