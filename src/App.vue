<template>
  <div id="app">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script>
export default {
  name: 'App',
  watch: {
    '$store.state.subject_id' (newSubjectId) {
      if (newSubjectId) {
        this.$store.dispatch('initializeHeartbeat') // ✅ Start heartbeat when subject_id is assigned
      }
    }
  },
  beforeDestroy () {
    this.$store.dispatch('terminateHeartbeat') // ✅ Stop heartbeat when app is closed
  }
}
</script>

<style>
/* Add global styles if needed */
</style>
