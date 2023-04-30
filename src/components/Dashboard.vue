<script setup lang="ts">
import { Auth } from 'aws-amplify'
import { useMutation, useQuery } from '@tanstack/vue-query'

const session = await Auth.currentSession()
const userToken = session.getIdToken().getJwtToken()

const { data: files, refetch: refetchFiles } = useQuery(['get-csv'], () => {
  return fetch('https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv', {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  }).then((res) => res.json())
})

const { mutateAsync: uploadFile, isLoading: isUploading } = useMutation((formData: FormData) => {
  return fetch('https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`
    },
    body: formData
  })
})

async function handleFileUpload(event: Event) {
  const targetEl = event.target as HTMLInputElement
  const file = targetEl.files?.[0]!
  const formData = new FormData()
  formData.append('csv', file)

  await uploadFile(formData)
  await refetchFiles()

  targetEl.value = ''
}
</script>

<template>
  <input type="file" className="file-input file-input-sm mb-4" :onChange="handleFileUpload" />
  <div v-if="isUploading">Uploading...</div>
  <table v-if="files?.length" className="table w-full">
    <thead>
      <tr>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="csv in files">
        <th :key="csv">
          {{ csv }}
        </th>
      </tr>
    </tbody>
  </table>
  <div v-else-if="files?.length === 0">
    No files uploaded yet.
  </div>
  <div v-else>
    Loading...
  </div>
</template>
