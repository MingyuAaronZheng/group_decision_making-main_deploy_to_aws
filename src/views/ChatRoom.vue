<template>
  <div class="chat-room">
    <!-- Chat Statement, User's Stance, and User's Name -->
    <div class="statement-area">
      <p class="chat-statement">
        <strong>Discussion Topic:</strong> {{ chat_statement }}
      </p>
      <p class="user-stance">
        <strong>Your Stance:</strong> {{ user_stance }}
      </p>
      <p class="current-turn">
        <strong>Your Name:</strong> {{ avatar_full_name }}
      </p>
    </div>

    <!-- Chat Messages Display Area -->
    <div class="room-area" ref="roomarea">
      <div v-for="message in messages" :key="message.id" class="message-card">
        <!-- AI Messages -->
        <b-row v-if="message.sender.subject_id < -1">
          <b-col cols="1" class="vertical-align">
            <div class="message-avatar-icon">
              <!-- Different icons for different AI roles -->
              <div class="ai-icon-container" :style="{ backgroundColor: getAIColorHex(message.sender.subject_id) }">
                <img :src="getAIIcon(message.sender.subject_id)" class="circle-icon" style="color: white; width: 30px; height: 30px;"/>
              </div>
            </div>
          </b-col>
          <b-col cols="9" style="padding-left: 0;">
            <b-row>
              <b-col class="message-avatar-name">{{ getAIName(message.sender.subject_id) }}</b-col>
            </b-row>
            <b-row>
              <b-col>
                <div class="message-content">
                  <span>{{ message.content }}</span>
                </div>
              </b-col>
            </b-row>
          </b-col>
        </b-row>

        <!-- Other Users' Messages -->
        <b-row v-else-if="message.sender.subject_id !== $store.state.subject_id">
          <b-col cols="1" class="vertical-align">
            <div class="message-avatar-icon">
              <v-animal size="30px" :name="message.sender.avatar_name"
                        :color="message.sender.avatar_color"
                        class="avatar-icon"/>
            </div>
          </b-col>
          <b-col cols="9" style="padding-left: 0;">
            <b-row>
              <b-col class="message-avatar-name" :style="{ color: message.sender.avatar_color }">{{message.sender.avatar_color }} {{ message.sender.avatar_name }}</b-col>
            </b-row>
            <b-row>
              <b-col>
                <div class="message-content">
                  <span>{{ message.content }}</span>
                </div>
              </b-col>
            </b-row>
          </b-col>
        </b-row>

        <!-- Current User's Messages -->
        <b-row v-else class="own_message">
          <b-col cols="2"/>
          <b-col cols="9" style="padding-right: 15px;">
            <b-row style="margin-right: 0;" class="justify-content-end">
              <b-col class="current-user-avatar-name text-end" style="text-align: right; width: 100%;">You</b-col>
            </b-row>
            <b-row style="margin-left: 0;">
              <b-col>
                <div class="message-content">
                  <span>{{ message.content }}</span>
                </div>
              </b-col>
            </b-row>
          </b-col>
          <b-col cols="1" class="vertical-align" style="text-align: left; padding-right: 0; padding-left: 10px;">
            <div class="message-avatar-icon">
              <v-animal size="30px" :name="$store.state.avatar_name"
                        :color="$store.state.avatar_color"
                        class="avatar-icon"/>
            </div>
          </b-col>
        </b-row>
      </div>
    </div>

    <!-- Ready to End Button and Status -->
    <div v-if="canExit" class="ready-to-end-area" style="padding: 0; margin: 0;">
      <div class="button-container" style="text-align: right;">
        <b-button
          @click="handleReadyToEnd"
          :variant="isReadyToEnd ? 'success' : 'primary'"
          class="exit-button"
          :disabled="isReadyToEnd"
        >
          {{ isReadyToEnd ? 'You indicated you are ready to end the discussion. We are waiting for other participants to do the same.' : 'When you are ready to end the discussion, click this button' }}
        </b-button>
      </div>
    </div>

    <!-- Typing Notifications -->
    <div v-if="typingNotification" class="typing-notifications">
      <p class="typing-indicator">
        <span :style="{ color: avatarColorHex(typingNotification.avatar_color) }">
          {{ typingNotification.avatar_color }} {{ typingNotification.avatar_name }}
        </span> is typing...
      </p>
    </div>

    <!-- Chat Input Area -->
    <div class="message-area">
      <b-input-group>
        <b-form-input
          placeholder="Type a message..."
          v-model="send_out_message"
          class="message-input-area"
          @keydown.enter.native="sendMessage"
          @paste.prevent
          @copy.prevent
          @cut.prevent
        />
        <b-button variant='primary' class="message-send-button" v-on:click="sendMessage">
          Send
        </b-button>
      </b-input-group>
    </div>

  </div>
</template>

<script>
import { colors } from '@/components/constants'
import axios from 'axios'
import { removeStopwords } from 'stopword'

const CUSTOM_FILLER_WORDS = new Set([
  'um', 'uh', 'er', 'ah', 'like', 'okay', 'right', 'you know', 'i mean',
  'well', 'so', 'anyway', 'basically', 'actually', 'literally', 'just'
])

export default {
  data () {
    return {
      send_out_message: '',
      typingTimeout: null,
      isReadyToEnd: false,
      typingNotification: null,
      typingNotificationTimeout: null
    }
  },
  computed: {
    avatar_full_name () {
      return this.$store.state.avatar_color + ' ' + this.$store.state.avatar_name
    },
    chat_statement () {
      return this.$store.state.chat_statement || 'No discussion topic available'
    },
    user_stance () {
      const masterStatements = this.$store.state.masterStatements || []
      const chatStatement = this.$store.state.chat_statement

      const statementIndex = masterStatements.indexOf(chatStatement)
      if (statementIndex === -1) return 'No stance recorded'

      // Find this statement in the user's selected statements
      const userStatementIndex = masterStatements.indexOf(chatStatement)
      if (userStatementIndex === -1) return 'No stance recorded'

      // Get the user's response for this statement
      const response = this.$store.state.preDiscussionResponses[userStatementIndex]
      if (!response) return 'No stance recorded'

      // Convert agreement value to corresponding text from the scale
      const agreementScale = [
        {text: 'Strongly disagree', value: -3},
        {text: 'Disagree', value: -2},
        {text: 'Somewhat disagree', value: -1},
        {text: 'Neutral', value: 0},
        {text: 'Somewhat agree', value: 1},
        {text: 'Agree', value: 2},
        {text: 'Strongly agree', value: 3}
      ]

      const scaleItem = agreementScale.find(item => item.value === response.agreement)
      return scaleItem ? scaleItem.text : 'No stance recorded'
    },
    messages () {
      return this.$store.state.messages
    },
    typingNotifications () {
      // Filter out current user from typing notifications
      return Array.from(this.$root.typingUsers)
        .filter(user => user.subject_id !== this.$store.state.subject_id)
    },
    // ***** TODO: Currently, can exit only when it is the 5th turn (i.e., one person sends a message after finishing 4th turn),
    //        but it should be after 4th turn and before 5th turn (i.e., no one needs to send a message for the 5th turn)
    canExit () {
      return this.$store.state.current_turn > 1
      // Use 1 for TEST
    }
    // readyMembers () {
    //   return this.$root.members.filter(m => m.is_ready_to_end && m.subject_id > 0)
    // },
    // humanMemberCount () {
    //   return this.$root.members.filter(m => m.subject_id > 0).length
    // }
  },
  methods: {
    avatarColorHex (avatar_color) {
      return colors[avatar_color] || avatar_color || '#000000'
    },
    getAIColorHex (subjectId) {
      switch (subjectId) {
        case -2: return '#2196F3' // Blue for moderator
        case -3: return '#4CAF50' // Green for participant
        case -4: return '#4CAF50' // Green for dispute
        default: return '#9E9E9E' // Grey for default
      }
    },
    getAIIcon (subjectId) {
      switch (subjectId) {
        case -2: return require('@/assets/AI_moderator.jpg') // AI Moderator
        case -3: return require('@/assets/AI_participant.jpg') // Advocating AI
        case -4: return require('@/assets/AI_participant.jpg') // Disputing AI
        default: return require('@/assets/icon.jpg')
      }
    },
    getAIName (subjectId) {
      switch (subjectId) {
        case -2: return 'AI Moderator'
        case -3: return 'AI Participant'
        case -4: return 'AI Participant'
        default: return 'AI'
      }
    },
    getAvatarName (subjectId) {
      // Find the member with matching subject_id in the root members list
      const member = this.$root.members.find(m => m.subject_id === parseInt(subjectId))
      if (member) {
        return member.avatar_name
      }
      // Fallback to the message's avatar name if member not found
      const message = this.messages.find(m => m.sender.subject_id === subjectId)
      return message ? message.sender.avatar_name : 'Unknown'
    },
    getAvatarColor (subjectId) {
      // Find the member with matching subject_id in the root members list
      const member = this.$root.members.find(m => m.subject_id === parseInt(subjectId))
      if (member) {
        return member.avatar_color
      }
      // Fallback to the message's avatar color if member not found
      const message = this.messages.find(m => m.sender.subject_id === subjectId)
      return message ? message.sender.avatar_color : 'blue'
    },
    updateChatStatus () {
      const formData = new FormData()
      formData.append('group_id', this.$store.state.group_id)
      formData.append('chatting', true)
      axios.post(this.$root.server_url + 'update_chat_status', formData)
        .then(response => {
          console.log('Chat status updated:', response.data)
        })
        .catch(error => {
          console.error('Error updating chat status:', error)
        })
    },
    deactivateChatStatus () {
      const formData = new FormData()
      formData.append('group_id', this.$store.state.group_id)
      formData.append('chatting', false)
      axios.post(this.$root.server_url + 'update_chat_status', formData)
        .then(response => {
          console.log('Chat status deactivated:', response.data)
        })
        .catch(error => {
          console.error('Error deactivating chat status:', error)
        })
    },
    countMeaningfulWords (message) {
      // Convert message to lowercase and split into words
      let words = message.toLowerCase().trim().split(/\s+/)

      // Remove stopwords
      let filteredWords = removeStopwords(words)

      // Remove custom filler words
      filteredWords = filteredWords.filter(word => !CUSTOM_FILLER_WORDS.has(word))

      return filteredWords.length
    },
    sendMessage () {
      // TODO TEST remove
      // this.$store.dispatch('recordActivity')
      const trimmedMessage = this.send_out_message.trim()
      // console.log('Trimmed message:', trimmedMessage)

      if (trimmedMessage !== '') {
        const meaningfulWordCount = this.countMeaningfulWords(trimmedMessage)
        // console.log('Meaningful word count:', meaningfulWordCount)

        if (meaningfulWordCount < 10) {
          // Show error message
          this.$bvToast.toast('Your message must contain at least 10 meaningful words. Filler words don\'t count.', {
            title: 'Message Too Short',
            variant: 'warning',
            solid: true
          })
          return
        }

        let send_chat_message = {
          'code': 200,
          'data': {
            'subject_id': this.$store.state.subject_id,
            'group_id': this.$store.state.group_id,
            'msg': this.send_out_message
          }
        }
        this.$root.sendWebSocketMessage(send_chat_message)
        this.send_out_message = ''
      }
    },
    notifyTyping (isTyping) {
      const data = {
        code: 202,
        data: {
          event: isTyping ? 'user_typing' : 'user_stopped_typing',
          subject_id: this.$store.state.subject_id,
          group_id: this.$store.state.group_id,
          avatar_name: this.$store.state.avatar_name,
          avatar_color: this.$store.state.avatar_color
        }
      }

      this.$root.sendWebSocketMessage(data)
    },
    handleReadyToEnd () {
      this.isReadyToEnd = true
      let ready_message = {
        'code': 902, // code for ready to end
        'data': {
          'subject_id': this.$store.state.subject_id,
          'group_id': this.$store.state.group_id
        }
      }
      this.$root.sendWebSocketMessage(ready_message)
    },
    showInactivityWarning () {
      this.$bvToast.toast('Warning: You appear to be inactive. Please respond within 15 seconds or you may be removed from the discussion.', {
        title: 'Inactivity Warning',
        variant: 'warning',
        solid: true,
        autoHideDelay: 10000
      })
    },
    handleInactiveUser () {
      // Send websocket message to notify server
      let inactive_message = {
        'code': 131, // new code for inactivity
        'data': {
          'subject_id': this.$store.state.subject_id,
          'group_id': this.$store.state.group_id
        }
      }
      this.$root.sendWebSocketMessage(inactive_message)
      // Redirect to a timeout page
      this.$router.push('/timeout')
    },
    handleTyping (user) {
      // Store the typing user
      this.typingNotification = user

      // Clear any existing timeout
      if (this.typingNotificationTimeout) {
        clearTimeout(this.typingNotificationTimeout)
      }

      // Set a timeout to clear the notification
      this.typingNotificationTimeout = setTimeout(() => {
        this.typingNotification = null
      }, 3000) // Show typing indicator for 3 seconds
    }
  },
  watch: {
    messages: {
      handler () {
        this.$nextTick(() => {
          const el = this.$refs.roomarea
          if (el) {
            el.scrollTop = el.scrollHeight
          }
        })
      },
      deep: true
    },
    send_out_message (newMessage) {
      // Clear any existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout)
      }

      if (newMessage.trim() !== '') {
        // Send typing notification
        this.notifyTyping(true)
        // Set timeout to clear typing status after 1 second of no changes
        this.typingTimeout = setTimeout(() => {
          this.notifyTyping(false)
        }, 1000)
      } else {
        // If message is empty, immediately send stopped typing
        this.notifyTyping(false)
      }
    }
  },
  mounted () {
    // Ensure WebSocket is initialized
    if (!this.$root.websock || this.$root.websock.readyState !== WebSocket.OPEN) {
      this.$root.initWebSocket()
    }

    // TODO TEST remove
    // // Start inactivity checking
    // this.$store.commit('startInactivityCheck')

    // // Listen for inactivity warnings
    // window.addEventListener('show-inactivity-warning', this.showInactivityWarning)
    // window.addEventListener('remove-inactive-user', this.handleInactiveUser)

    // Listen for typing events
    window.addEventListener('user-typing', (event) => this.handleTyping(event.detail))
    window.addEventListener('user-stopped-typing', () => { this.typingNotification = null })

    // Existing mounted code...
    this.updateChatStatus()
  },
  beforeDestroy () {
    // Clean up event listeners
    window.removeEventListener('show-inactivity-warning', this.showInactivityWarning)
    window.removeEventListener('remove-inactive-user', this.handleInactiveUser)
    window.removeEventListener('user-typing', (event) => this.handleTyping(event.detail))
    window.removeEventListener('user-stopped-typing', () => { this.typingNotification = null })

    // Clear any existing timeouts
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }

    if (this.typingNotificationTimeout) {
      clearTimeout(this.typingNotificationTimeout)
    }

    // Deactivate chat status
    this.deactivateChatStatus()
    // Optionally, send a WebSocket message to inform the server
    let leave_room = {
      'code': 130,
      'data': this.$store.state.subject_id
    }
    this.$root.sendWebSocketMessage(leave_room)
    // TODO There is currently no handling for code 130 in consumers.py
    // Clean up listeners and intervals
    this.$store.commit('stopInactivityCheck')
  }
}
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  background: #f5f7fa;
}

.statement-area {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.chat-statement, .user-stance {
  margin: 0;
  padding: 8px 0;
  color: #2c3e50;
}

.room-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  margin-bottom: 20px;
}

.message-card {
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 80%;
  word-wrap: break-word;
}

.own_message .message-content {
  background: #007bff;
  color: white;
  margin-left: auto;
}

.message-avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
}

.typing-notifications {
  margin: 8px 0;
}

.typing-indicator {
  display: flex;
  align-items: center;
  color: #6c757d;
  font-size: 0.9em;
}

.typing-indicator::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: #007bff;
  animation: typing 1s infinite;
}

@keyframes typing {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.message-area {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
}

.message-input-area {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  margin-right: 8px;
}

.message-send-button {
  border-radius: 8px;
  padding: 12px 24px;
}

.exit-button {
  position: static;
  box-shadow: none;
}

.ready-status {
  position: static;
  background-color: transparent;
  border: none;
  padding: 0;
}

.ready-to-end-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  margin: 2;
  background: transparent;
  border: none;
  box-shadow: none;
}

.avatar-icon {
  display:inline-block !important;
  color: inherit !important;
}

.avatar-icon svg {
  fill: currentColor !important;
}

.avatar-icon path {
  fill: currentColor !important;
}

.ready-instructions {
  margin: 15px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.instruction-text {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  font-style: italic;
}

.button-container {
  text-align: right;
}

.current-user-avatar-name {
  text-align: right;
  width: 100%;
}

@media (max-width: 768px) {
  .chat-room {
    padding: 10px;
  }

  .message-content {
    max-width: 90%;
  }
}
</style>
