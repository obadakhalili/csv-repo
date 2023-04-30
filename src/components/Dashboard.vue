<script setup lang="ts">
import { Auth } from 'aws-amplify'
import { useQuery } from '@tanstack/vue-query'

const session = await Auth.currentSession()
const userToken = session.getIdToken().getJwtToken()

const { data: csvs } = useQuery(['get-csv'], () => {
  return fetch('https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv', {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  }).then((res) => res.json())
})
</script>

<template>
  <div>
    <table v-if="csvs" className="table w-full">
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="csv in csvs">
          <th :key="csv">
            {{ csv }}
          </th>
        </tr>
      </tbody>
    </table>
  </div>
</template>
