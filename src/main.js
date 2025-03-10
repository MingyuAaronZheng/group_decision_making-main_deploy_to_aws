import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
import './plugins/axios'
import './plugins/bootstrap-vue'
import VueSimpleAlert from './plugins/vue-simple-alert'
import App from './App.vue'
import router from './router'
import animal from 'vue-animals'
import './assets/style.css'
import Vuex from 'vuex'
import Amplify from 'aws-amplify'
import '@aws-amplify/ui-vue'
import aws_exports from './aws-exports'
import { useSound } from '@vueuse/sound'
import sound from './assets/alert.mp3'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import specific icons */
import { faCircleCheck, faCircleXmark, faCircle, faSkull, faGavel, faRobot } from '@fortawesome/free-solid-svg-icons'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import VueTour from 'vue-tour'
import axios from 'axios'

require('vue-tour/dist/vue-tour.css')
Amplify.configure(aws_exports)
Vue.config.productionTip = false
Vue.use(Vuex)
Vue.use(VueSimpleAlert)
Vue.use(Toast, {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 20,
  newestOnTop: true
})
Vue.use(VueTour)
Vue.component('v-animal', animal)
library.add(faCircleCheck)
library.add(faCircleXmark)
library.add(faCircle)
library.add(faSkull)
library.add(faGavel)
library.add(faRobot)
Vue.component('font-awesome-icon', FontAwesomeIcon)

// Add global properties
Vue.prototype.$server_url = 'https://pilotexperimentmy.us-east-2.elasticbeanstalk.com/ccw/api/'
Vue.prototype.$ws_url = 'ws://pilotexperimentmy.us-east-2.elasticbeanstalk.com/ws/chat/'
Vue.prototype.$chat_url = 'ws://pilotexperimentmy.us-east-2.elasticbeanstalk.com/ws/chat/'
Vue.prototype.$test_mode = false

const store = new Vuex.Store({
  // plugins: [createPersistedState({
  //   getItem: key => Cookies.get(key),
  //   setItem: (key, value) => Cookies.set(key, value, { expires: 3, secure: false }),
  //   removeItem: key => Cookies.remove(key)
  // })],
  state () {
    return {
      subject_id: null,
      avatar_name: null,
      avatar_color: null,
      group_id: -1,
      messages: [],
      preDiscussionResponses: [], // Store pre-discussion responses
      participant_number_condition: -1,
      participant_condition: -1,
      moderator_condition: -1,
      // masterStatements: [
      //   'Should abortion be legal?',
      //   'Should governments have the authority to censor online content?',
      //   'Should the government employ a stricter immigration/border policy?',
      //   'Do tariffs on imported goods protect American jobs and industries from foreign competition?',
      //   'Should the government cut tax for the wealthy?',
      //   'Is unpredictability in U.S. foreign policy an effective deterrent against hostile actions from other nations?'
      // ], // Store master statements
      masterStatements: [
        'Should abortion be legal?'
      ], // use only one statement for TEST
      heartbeatInterval: null,
      chat_statement_index: null,
      chat_statement: null,
      all_ready: false, // Tracks whether all human members are ready
      lastActivityTimestamp: Date.now(),
      inactivityWarningShown: false,
      inactivityCheckInterval: null,
      random_third_person_prompt: -1,
      is_third_person: false,
      websocket: null,
      websocketConnected: false,
      WebSocketOnMessageRunningTimes: 0,
      current_turn: 0
    }
  },
  mutations: {
    setAllReadyStatus (state, all_ready) {
      state.all_ready = all_ready
    },
    assign_random_third_person_prompt (state, random_third_person_prompt) {
      state.random_third_person_prompt = random_third_person_prompt
    },
    assign_is_third_person (state, is_third_person) {
      state.is_third_person = is_third_person
    },
    // In main.js store configuration
    startHeartbeat (state) {
      if (!state.heartbeatInterval) {
        state.heartbeatInterval = setInterval(() => {
          axios.post(Vue.prototype.$server_url + 'heartbeat', {
            subject_id: state.subject_id
          })
        }, 10000)
      }
    },
    stopHeartbeat (state) {
      if (state.heartbeatInterval) {
        clearInterval(state.heartbeatInterval)
        state.heartbeatInterval = null
      }
    },
    assign_participant_condition (state, participant_condition) {
      state.participant_condition = participant_condition
    },
    assign_moderator_condition (state, moderator_condition) {
      state.moderator_condition = moderator_condition
    },
    setPreDiscussionResponses (state, responses) {
      state.preDiscussionResponses = responses
    },
    setPostDiscussionResponses (state, responses) {
      state.postDiscussionResponses = responses
    },
    assign_subject_id (state, record) {
      state.subject_id = record.subject_id
    },
    assign_group_id (state, record) {
      state.group_id = record.group_id
    },
    new_message (state, message) {
      state.messages.push(message)
      console.log(`New message: ${message.content}`)
    },
    clear_messages (state) {
      state.messages = []
    },
    assign_group_chat_statement_indx (state, index) {
      state.chat_statement_index = index
    },
    assign_group_chat_statement (state, chat_statement_index) {
      state.chat_statement = state.masterStatements[chat_statement_index]
    },
    update_avatar (state, payload) {
      state.avatar_name = payload.avatar_name
      state.avatar_color = payload.avatar_color
    },
    updateLastActivity (state) {
      state.lastActivityTimestamp = Date.now()
      state.inactivityWarningShown = false
    },
    setInactivityWarningShown (state, value) {
      state.inactivityWarningShown = value
    },
    startInactivityCheck (state) {
      if (!state.inactivityCheckInterval) {
        // Reset the activity timestamp when starting the check
        state.lastActivityTimestamp = Date.now()
        state.inactivityWarningShown = false

        state.inactivityCheckInterval = setInterval(() => {
          const currentTime = Date.now()
          const timeSinceLastActivity = currentTime - state.lastActivityTimestamp

          // Show warning after 45 seconds of inactivity
          if (timeSinceLastActivity >= 45000 && !state.inactivityWarningShown) {
            state.inactivityWarningShown = true
            // Emit a custom event that components can listen to
            window.dispatchEvent(new CustomEvent('show-inactivity-warning'))
          }

          // Remove user after 1 minute of inactivity
          if (timeSinceLastActivity >= 60000) {
            // Clear the interval before removing user to prevent multiple triggers
            clearInterval(state.inactivityCheckInterval)
            state.inactivityCheckInterval = null
            window.dispatchEvent(new CustomEvent('remove-inactive-user'))
          }
        }, 1000) // Check every second
      }
    },
    stopInactivityCheck (state) {
      if (state.inactivityCheckInterval) {
        clearInterval(state.inactivityCheckInterval)
        state.inactivityCheckInterval = null
      }
    },
    setThirdPerson (state, is_third_person) {
      state.is_third_person = is_third_person
    },
    setWebSocket (state, websocket) {
      state.websocket = websocket
    },
    setWebSocketConnected (state, status) {
      state.websocketConnected = status
    }
  },
  actions: {
    updatePreDiscussionResponses ({ commit }, responses) {
      commit('setPreDiscussionResponses', responses)
    },
    initializeHeartbeat ({ commit, state }) {
      if (!state.heartbeatInterval) {
        commit('startHeartbeat')
      }
    },
    terminateHeartbeat ({ commit }) {
      commit('stopHeartbeat')
    },
    recordActivity ({ commit, state }) {
      commit('updateLastActivity')
      // Also send a heartbeat to the server
      axios.post(Vue.prototype.$server_url + 'heartbeat', {
        subject_id: state.subject_id
      }).catch(error => console.error('Error sending heartbeat:', error))
    },
    initWebSocket ({ commit, state }) {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(state.$ws_url)

        ws.onopen = () => {
          commit('setWebSocket', ws)
          commit('setWebSocketConnected', true)
          resolve()
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        ws.onclose = () => {
          commit('setWebSocket', null)
          commit('setWebSocketConnected', false)
        }
      })
    }
  },
  getters: {
    getSelectedStatements: (state) => state.masterStatements,
    getPreDiscussionResponses: (state) => state.preDiscussionResponses
  }
})

// Keep only this part for browser close/refresh warning
window.addEventListener('beforeunload', (event) => {
  event.preventDefault()
  event.returnValue = 'Warning: Leaving this page will invalidate your participation. You will not be compensated if you leave.'
})

new Vue({
  data: function () {
    return {
      // localhost
      server_url: 'https://pilotexperimentmy.us-east-2.elasticbeanstalk.com/ccw/api/',
      chat_url: 'ws://pilotexperimentmy.us-east-2.elasticbeanstalk.com/ws/chat/',
      test_mode: false,
      // AWS
      // server_url: 'https://devil-advocate.hci-study.com/ccw/api/',
      // chat_url: 'wss://devil-advocate.hci-study.com/ws/chat/',
      // test_mode: false,
      estimation: null,
      is_loading: false,
      fire_400: false,
      members: [],
      decisions: [],
      typingUsers: new Set() // Track who is currently typing
    }
  },
  watch: {
    '$store.state.all_ready': function (newVal) {
      if (newVal) {
        this.$router.push('/PostDOSurvey') // Redirect when all are ready
      }
    }
  },
  methods: {
    initWebSocket () {
      const wsUrl = `${this.$chat_url}${this.$store.state.group_id}/`
      console.log('Connecting to WebSocket at:', wsUrl)

      this.websock = new WebSocket(wsUrl)
      this.websock.onmessage = this.webSocketOnMessage
      this.websock.onopen = this.webSocketOnOpen
      this.websock.onerror = this.webSocketOnError
      this.websock.onclose = this.webSocketOnClose
    },
    sendWebSocketMessage (msg) {
      this.websock.send(JSON.stringify(msg))
    },
    webSocketOnMessage (response) {
      let message = JSON.parse(response.data).message
      if (message.code === 201) { // Both human and AI messages
        let received_msg = message.message
        // Process human messages
        // 1. Add avatar info
        // 2. Update current turn
        if (received_msg.sender.subject_id > 0) {
          // Find the member with matching subject_id
          const member = this.$root.members.find(m => m.subject_id === parseInt(received_msg.sender.subject_id))
          if (member) {
            received_msg.sender.avatar_name = member.avatar_name
            received_msg.sender.avatar_color = member.avatar_color
            console.log(`Received message from ${received_msg.sender.subject_id}: ${member.avatar_name} (${member.avatar_color})`)
          } else {
            console.error('Member not found for subject_id:', received_msg.sender.subject_id, 'Available members:', this.$root.members)
          }
        }
        // Add to Vuex store
        this.$store.commit('new_message', received_msg)
        const formData = new FormData()
        formData.append('group_id', this.$store.state.group_id)
        axios.post(this.$root.server_url + 'get_group_current_turn', formData)
          .then(response => {
            if (response.data.success) {
              this.$store.state.current_turn = response.data.current_turn
            }
          })
          .catch(error => {
            console.error('Error getting current turn:', error)
          })
        console.log('Current turn:', this.$store.state.current_turn)
      } else if (message.code === 101) { // Successful pairing/room joining
        // Update members list
        this.$root.members = message.user_list.map(user => ({
          subject_id: user.subject_id,
          avatar_name: user.avatar_name,
          avatar_color: user.avatar_color,
          is_activated: user.is_activated
        }))
        // Format:
        // message = {
        //   "code": 101,
        //   "user_list": [
        //     {
        //       subject_id: 123,
        //       avatar_name: "Lion",
        //       avatar_color: "Blue",
        //       is_activated: 1
        //     },
        //     ...
        //   ],
        //   "startable": true,
        //   "task_list": []
        // }
      } else if (message.code === 778) { // Devil's advocate message
        let received_msg = message.message
        this.$store.commit('new_message', received_msg)
      } else if (message.code === 203) { // Typing notification
        const typingInfo = message.typing_info
        // Skip if it's the current user's typing notification
        if (typingInfo.subject_id === this.$store.state.subject_id) {
          return
        }
        if (typingInfo.is_typing) {
          // Dispatch custom event for typing notification
          const typingEvent = new CustomEvent('user-typing', {
            detail: {
              subject_id: typingInfo.subject_id,
              avatar_name: typingInfo.avatar_name,
              avatar_color: typingInfo.avatar_color
            }
          })
          window.dispatchEvent(typingEvent)
        } else {
          // Dispatch event to stop typing notification
          const stoppedTypingEvent = new CustomEvent('user-stopped-typing', {
            detail: { subject_id: typingInfo.subject_id }
          })
          window.dispatchEvent(stoppedTypingEvent)
        }
      } else if (message.code === 903) { // Ready to end status update
        // Update ready status for members
        const readyMembers = message.ready_members
        this.$root.members.forEach(member => {
          member.is_ready_to_end = readyMembers.includes(member.subject_id)
        })
        // Store `all_ready` in Vuex so all components can reactively watch it
        this.$store.commit('setAllReadyStatus', message.all_ready)
      }
    },
    webSocketOnOpen (e) {
      let enter_room = {
        'code': 100,
        'data': {
          'subject_id': this.$store.state.subject_id
        }
      }
      this.$root.sendWebSocketMessage(enter_room)
    },
    webSocketOnError (e) {
      console.error(e)
    },
    webSocketOnClose (e) {
      let leave_room = {
        'code': 130,
        'message': this.$store.state.subject_id
      }
      this.$root.sendWebSocketMessage(leave_room)
    }
  },
  setup () {
    const alarm_sound = useSound(sound)

    return {
      alarm_sound
    }
  },
  store: store,
  router,
  render: h => h(App)
}).$mount('#app')
