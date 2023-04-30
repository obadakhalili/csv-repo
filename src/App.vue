<script setup lang="ts">
import { effect } from 'vue'
import { Authenticator } from '@aws-amplify/ui-vue'
import '@aws-amplify/ui-vue/styles.css'

import { Amplify, Auth } from 'aws-amplify'
import awsconfig from './aws-exports.js'

Amplify.configure(awsconfig)

effect(async () => {
  const session = await Auth.currentSession()
  const token = session.getIdToken().getJwtToken()

  // fetch('https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/item', {
  //   headers: {
  //     Authorization: token
  //   }
  // })
  //   .then((res) => res.json())
  //   .then((res) => console.log(res))
})
</script>

<template>
  <Authenticator>
    <template v-slot="{ user, signOut }">
      <h1>Hello {{ user.username }}!</h1>
      <button @click="signOut">Sign Out</button>
    </template>
  </Authenticator>
</template>
