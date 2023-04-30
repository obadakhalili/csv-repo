<script setup lang="ts">
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-vue'
import '@aws-amplify/ui-vue/styles.css'

import awsconfig from './aws-exports.js'
import Dashboard from './components/Dashboard.vue'

Amplify.configure(awsconfig)
</script>

<template>
  <!-- TODO: move auth UI down -->
  <Authenticator>
    <template v-slot="{ signOut, user }">
      <div className="navbar bg-base-300">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl">{{ user.attributes.email }}</a>
        </div>
        <div className="flex-none">
          <button className="btn btn-ghost" @click="signOut">Log out</button>
        </div>
      </div>
      <Suspense>
        <div class="p-4">
          <Dashboard />
        </div>
      </Suspense>
    </template>
  </Authenticator>
</template>
